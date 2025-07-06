import { Request, Response } from 'express';
import prisma from '../client';
import { version } from '../../package.json';

const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    const healthCheck = {
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      version: version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(503).json(healthCheck);
  }
};

export default {
  healthCheck,
}; 