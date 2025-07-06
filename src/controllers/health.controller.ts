import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Health check endpoint
 * @route GET /v1/health
 * @access Public
 */
const healthCheck = catchAsync(async (req: Request, res: Response) => {
  res.status(httpStatus.OK).send({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Database health check
 * @route GET /v1/health/db
 * @access Public
 */
const databaseHealthCheck = catchAsync(async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(httpStatus.OK).send({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(httpStatus.SERVICE_UNAVAILABLE).send({
      status: 'ERROR',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Detailed health check
 * @route GET /v1/health/detailed
 * @access Private (Admin only)
 */
const detailedHealthCheck = catchAsync(async (req: Request, res: Response) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
    database: {
      status: 'unknown',
      connectionTime: 0,
    },
    services: {
      email: 'unknown',
      notifications: 'unknown',
    },
  };

  // Test database connection
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database.status = 'connected';
    health.database.connectionTime = Date.now() - dbStart;
  } catch (error) {
    health.database.status = 'error';
    health.status = 'DEGRADED';
  }

  // Test email service (if configured)
  if (process.env.EMAIL_SERVICE) {
    health.services.email = 'configured';
  } else {
    health.services.email = 'not_configured';
  }

  // Test notification service (if configured)
  if (process.env.NOTIFICATION_SERVICE) {
    health.services.notifications = 'configured';
  } else {
    health.services.notifications = 'not_configured';
  }

  const statusCode = health.status === 'OK' ? httpStatus.OK : httpStatus.SERVICE_UNAVAILABLE;
  res.status(statusCode).send(health);
});

export default {
  healthCheck,
  databaseHealthCheck,
  detailedHealthCheck,
}; 