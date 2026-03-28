import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Request } from 'express';
import { NotificationType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  isAuthenticated?: boolean;
}

interface PushNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface PushNotificationPreferences {
  enabled: boolean;
  types: {
    [key in NotificationType]?: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

class PushNotificationService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketToUserId: Map<string, string> = new Map(); // socketId -> userId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware for Socket.IO
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as any;
        socket.userId = decoded.userId;
        socket.isAuthenticated = true;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.isAuthenticated || !socket.userId) {
        socket.disconnect();
        return;
      }

      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

      // Track user connection
      if (!this.connectedUsers.has(socket.userId)) {
        this.connectedUsers.set(socket.userId, new Set());
      }
      this.connectedUsers.get(socket.userId)!.add(socket.id);
      this.socketToUserId.set(socket.id, socket.userId);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Send connection acknowledgment
      socket.emit('connected', {
        message: 'Successfully connected to push notifications',
        userId: socket.userId,
        socketId: socket.id,
      });

      // Handle disconnect
      socket.on('disconnect', reason => {
        console.log(`User ${socket.userId} disconnected: ${reason}`);
        this.handleDisconnect(socket);
      });

      // Handle mark as read
      socket.on('mark_notification_read', async (data: { notificationId: string }) => {
        try {
          // Import dynamically to avoid circular dependency
          const { default: notificationService } = await import('./notification.service');
          await notificationService.markAsRead(socket.userId!, data.notificationId);

          // Broadcast to user's other devices
          socket.to(`user_${socket.userId}`).emit('notification_marked_read', {
            notificationId: data.notificationId,
            userId: socket.userId,
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to mark notification as read' });
        }
      });

      // Handle mark all as read
      socket.on('mark_all_notifications_read', async () => {
        try {
          const { default: notificationService } = await import('./notification.service');
          const count = await notificationService.markAllAsRead(socket.userId!);

          socket.to(`user_${socket.userId}`).emit('all_notifications_marked_read', {
            count,
            userId: socket.userId,
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to mark all notifications as read' });
        }
      });

      // Handle subscription to notification types
      socket.on('subscribe_notifications', (data: { types: NotificationType[] }) => {
        data.types.forEach(type => {
          socket.join(`notifications_${type}`);
        });
        socket.emit('subscribed', { types: data.types });
      });

      // Handle unsubscription from notification types
      socket.on('unsubscribe_notifications', (data: { types: NotificationType[] }) => {
        data.types.forEach(type => {
          socket.leave(`notifications_${type}`);
        });
        socket.emit('unsubscribed', { types: data.types });
      });
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    if (socket.userId) {
      const userSockets = this.connectedUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(socket.userId);
        }
      }
      this.socketToUserId.delete(socket.id);
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendPushNotification(data: PushNotificationData): Promise<void> {
    const userPrefs = await this.getUserPushPreferences(data.userId);

    // Check if push notifications are enabled for this user
    if (!userPrefs?.enabled) {
      return;
    }

    // Check if this notification type is enabled
    if (userPrefs.types && !userPrefs.types[data.type]) {
      return;
    }

    // Check quiet hours
    if (userPrefs.quietHours?.enabled && this.isQuietHours(userPrefs.quietHours)) {
      return;
    }

    // Send to user's personal room
    this.io.to(`user_${data.userId}`).emit('push_notification', {
      id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      timestamp: data.timestamp,
      isRead: false,
    });

    // Also send to type-specific room if subscribed
    this.io.to(`notifications_${data.type}`).emit('type_notification', {
      ...data,
      userId: data.userId,
    });
  }

  /**
   * Get user push notification preferences
   */
  private async getUserPushPreferences(
    userId: string
  ): Promise<PushNotificationPreferences | null> {
    try {
      const { default: prisma } = await import('../client');
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushNotifications: true },
      });

      if (!user?.pushNotifications) {
        return {
          enabled: true,
          types: {},
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
        };
      }

      const prefs =
        typeof user.pushNotifications === 'string'
          ? JSON.parse(user.pushNotifications)
          : user.pushNotifications;

      return {
        enabled: prefs.enabled !== false,
        types: prefs.types || {},
        quietHours: prefs.quietHours || { enabled: false, start: '22:00', end: '08:00' },
      };
    } catch (error) {
      console.error('Error getting user push preferences:', error);
      return null;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day (e.g., 22:00 to 08:00 doesn't cross midnight)
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Crosses midnight (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get user's active connections
   */
  getUserConnections(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  /**
   * Send notification to all connected users (admin/system notifications)
   */
  async broadcastNotification(data: Omit<PushNotificationData, 'userId'>): Promise<void> {
    this.io.emit('broadcast_notification', {
      ...data,
      timestamp: new Date(),
    });
  }

  /**
   * Get server instance
   */
  getServer(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let pushNotificationService: PushNotificationService | null = null;

/**
 * Initialize push notification service
 */
export const initializePushNotifications = (server: HTTPServer): PushNotificationService => {
  if (!pushNotificationService) {
    pushNotificationService = new PushNotificationService(server);
  }
  return pushNotificationService;
};

/**
 * Get push notification service instance
 */
export const getPushNotificationService = (): PushNotificationService => {
  if (!pushNotificationService) {
    throw new Error(
      'Push notification service not initialized. Call initializePushNotifications first.'
    );
  }
  return pushNotificationService;
};

export default PushNotificationService;
