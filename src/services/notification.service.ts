import { Request } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import emailService from './email.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const prisma = new PrismaClient();

/**
 * Create a new notification
 * @param {string} userId - User ID
 * @param {NotificationType} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 * @returns {Promise<any>}
 */
const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, any> = {}
): Promise<any> => {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
    },
  });
};

/**
 * Send login alert notification
 */
const sendLoginAlert = async (user: any, req: Request, deviceInfo: any): Promise<void> => {
  // Check if user has login alerts enabled
  if (!user.loginAlerts) {
    return;
  }

  const title = 'New Login Detected';
  const message = `A new login was detected on your account from ${deviceInfo.deviceName} (${deviceInfo.ipAddress}) at ${new Date().toLocaleString()}.`;

  // Create notification record
  await createNotification(user.id, NotificationType.LOGIN_ALERT, title, message);

  // Send email notification if enabled
  if (user.emailNotifications) {
    await emailService.sendLoginAlertEmail(user.email, {
      deviceName: deviceInfo.deviceName,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  // TODO: Send SMS notification if enabled and phone number exists
  // if (user.smsNotifications && user.phone) {
  //   await smsService.sendLoginAlertSMS(user.phone, message);
  // }
};

/**
 * Send security update notification
 */
const sendSecurityUpdate = async (
  userId: string,
  title: string,
  message: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailNotifications: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Create notification record
  await createNotification(userId, NotificationType.SECURITY_UPDATE, title, message);

  // Send email if enabled
  if (user.emailNotifications) {
    await emailService.sendSecurityUpdateEmail(user.email, { title, message });
  }
};

/**
 * Send password expiry notification
 */
const sendPasswordExpiryAlert = async (userId: string, daysUntilExpiry: number): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailNotifications: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const title = 'Password Expiry Alert';
  const message = `Your password will expire in ${daysUntilExpiry} days. Please change it soon to maintain account security.`;

  // Create notification record
  await createNotification(userId, NotificationType.PASSWORD_EXPIRY, title, message);

  // Send email if enabled
  if (user.emailNotifications) {
    await emailService.sendPasswordExpiryEmail(user.email, { daysUntilExpiry });
  }
};

/**
 * Send suspicious activity alert
 */
const sendSuspiciousActivityAlert = async (
  userId: string,
  activity: string,
  location: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailNotifications: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const title = 'Suspicious Activity Detected';
  const message = `Suspicious activity detected: ${activity} from ${location}. If this wasn't you, please secure your account immediately.`;

  // Create notification record
  await createNotification(userId, NotificationType.SUSPICIOUS_ACTIVITY, title, message);

  // Send email if enabled
  if (user.emailNotifications) {
    await emailService.sendSuspiciousActivityEmail(user.email, { activity, location });
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (
  userId: string,
  options: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    isRead?: boolean;
  } = {}
): Promise<{
  notifications: any[];
  total: number;
  unread: number;
}> => {
  const { page = 1, limit = 20, type, isRead } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (type) where.type = type;
  if (isRead !== undefined) where.isRead = isRead;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return {
    notifications,
    total,
    unread: unreadCount,
  };
};

/**
 * Mark notification as read
 */
const markAsRead = async (userId: string, notificationId: string): Promise<any> => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return result.count;
};

/**
 * Delete notification
 */
const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });
};

/**
 * Delete all read notifications
 */
const deleteReadNotifications = async (userId: string): Promise<number> => {
  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      isRead: true,
    },
  });

  return result.count;
};

/**
 * Get notification count
 */
const getNotificationCount = async (userId: string, unreadOnly: boolean = true): Promise<number> => {
  const where: any = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }

  return prisma.notification.count({ where });
};

/**
 * Send login notification
 * @param {string} userId - User ID
 * @param {object} loginData - Login information
 * @returns {Promise<void>}
 */
const sendLoginNotification = async (
  userId: string,
  loginData: {
    deviceName: string;
    ipAddress: string;
    location?: string;
    browser?: string;
    os?: string;
  }
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, emailNotifications: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Create notification
  await createNotification(
    userId,
    NotificationType.LOGIN_ALERT,
    'New Login Detected',
    `New login from ${loginData.deviceName} (${loginData.ipAddress})`,
    {
      deviceName: loginData.deviceName,
      ipAddress: loginData.ipAddress,
      location: loginData.location,
      browser: loginData.browser,
      os: loginData.os,
      timestamp: new Date(),
    }
  );

  // Send email if enabled
  if (user.emailNotifications?.loginAlerts) {
    await emailService.sendLoginAlertEmail(
      user.email,
      user.name || 'User',
      loginData
    );
  }
};

/**
 * Send password change notification
 * @param {string} userId - User ID
 * @param {object} changeData - Password change information
 * @returns {Promise<void>}
 */
const sendPasswordChangeNotification = async (
  userId: string,
  changeData: {
    ipAddress: string;
    deviceName: string;
    timestamp: Date;
  }
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, emailNotifications: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Create notification
  await createNotification(
    userId,
    NotificationType.PASSWORD_CHANGE,
    'Password Changed',
    'Your password has been successfully changed',
    {
      ipAddress: changeData.ipAddress,
      deviceName: changeData.deviceName,
      timestamp: changeData.timestamp,
    }
  );

  // Send email if enabled
  if (user.emailNotifications?.passwordChanges) {
    await emailService.sendPasswordChangeEmail(
      user.email,
      user.name || 'User',
      changeData
    );
  }
};

/**
 * Send 2FA setup notification
 * @param {string} userId - User ID
 * @param {boolean} enabled - Whether 2FA was enabled or disabled
 * @returns {Promise<void>}
 */
const sendTwoFactorNotification = async (
  userId: string,
  enabled: boolean
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, emailNotifications: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const action = enabled ? 'enabled' : 'disabled';
  const title = `Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'}`;
  const message = `Two-factor authentication has been ${action} for your account`;

  // Create notification
  await createNotification(
    userId,
    NotificationType.TWO_FACTOR,
    title,
    message,
    {
      enabled,
      timestamp: new Date(),
    }
  );

  // Send email if enabled
  if (user.emailNotifications?.twoFactorChanges) {
    await emailService.sendTwoFactorEmail(
      user.email,
      user.name || 'User',
      { enabled }
    );
  }
};

/**
 * Send device login notification
 * @param {string} userId - User ID
 * @param {object} deviceData - Device information
 * @returns {Promise<void>}
 */
const sendDeviceLoginNotification = async (
  userId: string,
  deviceData: {
    deviceName: string;
    ipAddress: string;
    location?: string;
    browser?: string;
    os?: string;
  }
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, emailNotifications: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Create notification
  await createNotification(
    userId,
    NotificationType.DEVICE_LOGIN,
    'New Device Login',
    `New login from ${deviceData.deviceName}`,
    {
      deviceName: deviceData.deviceName,
      ipAddress: deviceData.ipAddress,
      location: deviceData.location,
      browser: deviceData.browser,
      os: deviceData.os,
      timestamp: new Date(),
    }
  );

  // Send email if enabled
  if (user.emailNotifications?.deviceLogins) {
    await emailService.sendDeviceLoginEmail(
      user.email,
      user.name || 'User',
      deviceData
    );
  }
};

/**
 * Get notification statistics
 * @param {string} userId - User ID
 * @returns {Promise<{total: number, unread: number, byType: Record<string, number>}>}
 */
const getNotificationStats = async (userId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<string, number>;
}> => {
  const [total, unread, byType] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: { type: true },
    }),
  ]);

  const byTypeMap: Record<string, number> = {};
  byType.forEach((item) => {
    byTypeMap[item.type] = item._count.type;
  });

  return {
    total,
    unread,
    byType: byTypeMap,
  };
};

export default {
  createNotification,
  sendLoginAlert,
  sendSecurityUpdate,
  sendPasswordExpiryAlert,
  sendSuspiciousActivityAlert,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationCount,
  sendLoginNotification,
  sendPasswordChangeNotification,
  sendTwoFactorNotification,
  sendDeviceLoginNotification,
  getNotificationStats,
}; 