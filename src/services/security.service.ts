import { Request } from 'express';
import { User } from '@prisma/client';
import prisma from '../client';
import logger from '../config/logger';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

interface SecurityEventData {
  userId?: number;
  email?: string;
  ipAddress: string;
  userAgent: string;
  eventType: SecurityEventType;
  details?: Record<string, any>;
  success: boolean;
}

/**
 * Log security events for audit trail
 */
const logSecurityEvent = async (data: SecurityEventData): Promise<void> => {
  try {
    // Log to database for audit trail
    await prisma.securityLog.create({
      data: {
        userId: data.userId,
        email: data.email,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        eventType: data.eventType,
        details: data.details,
        success: data.success,
        timestamp: new Date(),
      },
    });

    // Log to application logs
    const logLevel = data.success ? 'info' : 'warn';
    logger[logLevel]('Security event', {
      eventType: data.eventType,
      userId: data.userId,
      email: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details,
      success: data.success,
    });
  } catch (error) {
    // Fallback to console if database logging fails
    console.error('Failed to log security event:', error);
    logger.error('Security event logging failed', { error, data });
  }
};

/**
 * Log successful login
 */
const logLoginSuccess = async (user: User, req: Request): Promise<void> => {
  await logSecurityEvent({
    userId: user.id,
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    eventType: SecurityEventType.LOGIN_SUCCESS,
    details: {
      loginMethod: 'email_password',
      timestamp: new Date().toISOString(),
    },
    success: true,
  });
};

/**
 * Log failed login attempt
 */
const logLoginFailed = async (email: string, req: Request, reason?: string): Promise<void> => {
  await logSecurityEvent({
    email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    eventType: SecurityEventType.LOGIN_FAILED,
    details: {
      reason: reason || 'Invalid credentials',
      timestamp: new Date().toISOString(),
    },
    success: false,
  });
};

/**
 * Log logout event
 */
const logLogout = async (user: User, req: Request): Promise<void> => {
  await logSecurityEvent({
    userId: user.id,
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    eventType: SecurityEventType.LOGOUT,
    details: {
      timestamp: new Date().toISOString(),
    },
    success: true,
  });
};

/**
 * Log registration event
 */
const logRegistration = async (user: User, req: Request): Promise<void> => {
  await logSecurityEvent({
    userId: user.id,
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    eventType: SecurityEventType.REGISTER,
    details: {
      registrationMethod: 'email_password',
      timestamp: new Date().toISOString(),
    },
    success: true,
  });
};

/**
 * Log password reset request
 */
const logPasswordResetRequest = async (email: string, req: Request): Promise<void> => {
  await logSecurityEvent({
    email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    eventType: SecurityEventType.PASSWORD_RESET_REQUESTED,
    details: {
      timestamp: new Date().toISOString(),
    },
    success: true,
  });
};

/**
 * Log password reset completion
 */
const logPasswordResetCompleted = async (user: User, req: Request): Promise<void> => {
  await logSecurityEvent({
    userId: user.id,
    email: user.email,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    eventType: SecurityEventType.PASSWORD_RESET_COMPLETED,
    details: {
      timestamp: new Date().toISOString(),
    },
    success: true,
  });
};

/**
 * Log rate limit exceeded
 */
const logRateLimitExceeded = async (req: Request, endpoint: string): Promise<void> => {
  await logSecurityEvent({
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
    details: {
      endpoint,
      timestamp: new Date().toISOString(),
    },
    success: false,
  });
};

/**
 * Get security events for a user
 */
const getUserSecurityEvents = async (userId: number, limit = 50): Promise<any[]> => {
  return prisma.securityLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
};

/**
 * Get recent security events (admin function)
 */
const getRecentSecurityEvents = async (limit = 100): Promise<any[]> => {
  return prisma.securityLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
};

export default {
  logSecurityEvent,
  logLoginSuccess,
  logLoginFailed,
  logLogout,
  logRegistration,
  logPasswordResetRequest,
  logPasswordResetCompleted,
  logRateLimitExceeded,
  getUserSecurityEvents,
  getRecentSecurityEvents,
}; 