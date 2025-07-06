import { PrismaClient, SecurityEventType, SecurityLevel } from '@prisma/client';
import { Request } from 'express';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const prisma = new PrismaClient();

export interface SecurityEventData {
  userId?: string;
  eventType: SecurityEventType;
  level: SecurityLevel;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    browser?: string;
    os?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Log a security event
 * @param {SecurityEventData} eventData - Security event data
 * @returns {Promise<any>}
 */
const logSecurityEvent = async (eventData: SecurityEventData): Promise<any> => {
  return prisma.securityLog.create({
    data: {
      userId: eventData.userId,
      eventType: eventData.eventType,
      level: eventData.level,
      description: eventData.description,
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
      location: eventData.location,
      deviceId: eventData.deviceInfo?.deviceId,
      deviceName: eventData.deviceInfo?.deviceName,
      browser: eventData.browser,
      os: eventData.os,
      metadata: eventData.metadata,
    },
  });
};

/**
 * Log login attempt
 * @param {string} email - User email
 * @param {boolean} success - Whether login was successful
 * @param {Request} req - Express request object
 * @param {string} [userId] - User ID (if login was successful)
 * @returns {Promise<void>}
 */
const logLoginAttempt = async (
  email: string,
  success: boolean,
  req: Request,
  userId?: string
): Promise<void> => {
  const eventData: SecurityEventData = {
    userId,
    eventType: success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILED,
    level: success ? SecurityLevel.INFO : SecurityLevel.WARNING,
    description: `${success ? 'Successful' : 'Failed'} login attempt for ${email}`,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    metadata: {
      email,
      success,
      timestamp: new Date(),
    },
  };

  await logSecurityEvent(eventData);
};

/**
 * Log password change
 * @param {string} userId - User ID
 * @param {Request} req - Express request object
 * @param {boolean} [forced] - Whether password change was forced
 * @returns {Promise<void>}
 */
const logPasswordChange = async (
  userId: string,
  req: Request,
  forced: boolean = false
): Promise<void> => {
  const eventData: SecurityEventData = {
    userId,
    eventType: SecurityEventType.PASSWORD_CHANGE,
    level: SecurityLevel.INFO,
    description: `Password ${forced ? 'force ' : ''}changed`,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    metadata: {
      forced,
      timestamp: new Date(),
    },
  };

  await logSecurityEvent(eventData);
};

/**
 * Log 2FA events
 * @param {string} userId - User ID
 * @param {SecurityEventType} eventType - Type of 2FA event
 * @param {Request} req - Express request object
 * @param {object} [metadata] - Additional metadata
 * @returns {Promise<void>}
 */
const logTwoFactorEvent = async (
  userId: string,
  eventType: SecurityEventType,
  req: Request,
  metadata: Record<string, any> = {}
): Promise<void> => {
  const eventData: SecurityEventData = {
    userId,
    eventType,
    level: SecurityLevel.INFO,
    description: `Two-factor authentication event: ${eventType}`,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    metadata: {
      ...metadata,
      timestamp: new Date(),
    },
  };

  await logSecurityEvent(eventData);
};

/**
 * Log suspicious activity
 * @param {string} userId - User ID
 * @param {string} activity - Description of suspicious activity
 * @param {Request} req - Express request object
 * @param {object} [metadata] - Additional metadata
 * @returns {Promise<void>}
 */
const logSuspiciousActivity = async (
  userId: string,
  activity: string,
  req: Request,
  metadata: Record<string, any> = {}
): Promise<void> => {
  const eventData: SecurityEventData = {
    userId,
    eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
    level: SecurityLevel.HIGH,
    description: `Suspicious activity detected: ${activity}`,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    metadata: {
      activity,
      ...metadata,
      timestamp: new Date(),
    },
  };

  await logSecurityEvent(eventData);
};

/**
 * Log account lockout
 * @param {string} userId - User ID
 * @param {string} reason - Reason for lockout
 * @param {Request} req - Express request object
 * @returns {Promise<void>}
 */
const logAccountLockout = async (
  userId: string,
  reason: string,
  req: Request
): Promise<void> => {
  const eventData: SecurityEventData = {
    userId,
    eventType: SecurityEventType.ACCOUNT_LOCKED,
    level: SecurityLevel.HIGH,
    description: `Account locked: ${reason}`,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    metadata: {
      reason,
      timestamp: new Date(),
    },
  };

  await logSecurityEvent(eventData);
};

/**
 * Log device management events
 * @param {string} userId - User ID
 * @param {SecurityEventType} eventType - Type of device event
 * @param {Request} req - Express request object
 * @param {object} deviceInfo - Device information
 * @returns {Promise<void>}
 */
const logDeviceEvent = async (
  userId: string,
  eventType: SecurityEventType,
  req: Request,
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    browser?: string;
    os?: string;
  }
): Promise<void> => {
  const eventData: SecurityEventData = {
    userId,
    eventType,
    level: SecurityLevel.INFO,
    description: `Device event: ${eventType}`,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    deviceInfo,
    metadata: {
      timestamp: new Date(),
    },
  };

  await logSecurityEvent(eventData);
};

/**
 * Get security logs for a user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<{logs: any[], total: number}>}
 */
const getUserSecurityLogs = async (
  userId: string,
  options: {
    page?: number;
    limit?: number;
    eventType?: SecurityEventType;
    level?: SecurityLevel;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{
  logs: any[];
  total: number;
}> => {
  const { page = 1, limit = 20, eventType, level, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (eventType) where.eventType = eventType;
  if (level) where.level = level;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.securityLog.count({ where }),
  ]);

  return { logs, total };
};

/**
 * Get security statistics
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<{
 *   totalEvents: number,
 *   byType: Record<string, number>,
 *   byLevel: Record<string, number>,
 *   recentActivity: any[]
 * }>}
 */
const getSecurityStats = async (
  userId: string,
  days: number = 30
): Promise<{
  totalEvents: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  recentActivity: any[];
}> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where = {
    userId,
    createdAt: {
      gte: startDate,
    },
  };

  const [totalEvents, byType, byLevel, recentActivity] = await Promise.all([
    prisma.securityLog.count({ where }),
    prisma.securityLog.groupBy({
      by: ['eventType'],
      where,
      _count: { eventType: true },
    }),
    prisma.securityLog.groupBy({
      by: ['level'],
      where,
      _count: { level: true },
    }),
    prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const byTypeMap: Record<string, number> = {};
  byType.forEach((item) => {
    byTypeMap[item.eventType] = item._count.eventType;
  });

  const byLevelMap: Record<string, number> = {};
  byLevel.forEach((item) => {
    byLevelMap[item.level] = item._count.level;
  });

  return {
    totalEvents,
    byType: byTypeMap,
    byLevel: byLevelMap,
    recentActivity,
  };
};

/**
 * Clean old security logs
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {Promise<number>} Number of logs deleted
 */
const cleanOldLogs = async (daysToKeep: number = 90): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.securityLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
};

export default {
  logSecurityEvent,
  logLoginAttempt,
  logPasswordChange,
  logTwoFactorEvent,
  logSuspiciousActivity,
  logAccountLockout,
  logDeviceEvent,
  getUserSecurityLogs,
  getSecurityStats,
  cleanOldLogs,
}; 