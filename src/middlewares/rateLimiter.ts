import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config/config';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
}

// Rate limiter for authentication endpoints (stricter limits)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'production' ? 5 : 10, // 5 attempts in prod, 10 in dev
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 429,
      message: 'Too many authentication attempts, please try again later',
      retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
    });
  },
  keyGenerator: (req: Request) => {
    // Use IP + user agent for better rate limiting
    return `${req.ip}-${req.get('User-Agent')}`;
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks and internal requests
    return req.path === '/health' || req.get('X-Internal-Request') === 'true';
  },
});

// Rate limiter for password reset (very strict)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.env === 'production' ? 3 : 5, // 3 attempts in prod, 5 in dev
  message: {
    error: 'Too many password reset attempts, please try again later',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 429,
      message: 'Too many password reset attempts, please try again later',
      retryAfter: Math.ceil(60 * 60), // 1 hour in seconds
    });
  },
  keyGenerator: (req: Request) => {
    return `${req.ip}-${req.get('User-Agent')}`;
  },
});

// Rate limiter for general API endpoints (global protection)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'production' ? 100 : 200, // 100 requests in prod, 200 in dev
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 429,
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
    });
  },
  keyGenerator: (req: Request) => {
    // Use IP for general API limiting
    return req.ip;
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks, docs, and internal requests
    return (
      req.path === '/health' ||
      req.path.startsWith('/docs') ||
      req.get('X-Internal-Request') === 'true'
    );
  },
});

// Rate limiter for user registration (prevent spam)
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.env === 'production' ? 3 : 5, // 3 registrations in prod, 5 in dev
  message: {
    error: 'Too many registration attempts, please try again later',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 429,
      message: 'Too many registration attempts, please try again later',
      retryAfter: Math.ceil(60 * 60), // 1 hour in seconds
    });
  },
  keyGenerator: (req: Request) => {
    return `${req.ip}-${req.get('User-Agent')}`;
  },
});

// Rate limiter for sensitive operations (like user updates, deletions)
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: config.env === 'production' ? 10 : 20, // 10 operations in prod, 20 in dev
  message: {
    error: 'Too many sensitive operations, please try again later',
    retryAfter: '5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 429,
      message: 'Too many sensitive operations, please try again later',
      retryAfter: Math.ceil(5 * 60), // 5 minutes in seconds
    });
  },
  keyGenerator: (req: Request) => {
    // Use authenticated user ID if available, otherwise IP
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id?.toString() || req.ip;
  },
});
