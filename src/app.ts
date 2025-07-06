import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config';
import morgan from './config/morgan';
import xss from './middlewares/xss';
import { jwtStrategy } from './config/passport';
import { 
  apiLimiter, 
  authLimiter, 
  passwordResetLimiter, 
  registrationLimiter 
} from './middlewares/rateLimiter';
import routes from './routes/v1';
import { healthController } from './controllers';
import { errorConverter, errorHandler } from './middlewares/error';
import ApiError from './utils/ApiError';

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Health check routes (no rate limiting)
app.get('/v1/health', healthController.healthCheck);
app.get('/v1/health/db', healthController.databaseHealthCheck);
app.get('/v1/health/detailed', healthController.detailedHealthCheck);

// Global rate limiting - apply to all API endpoints
app.use('/v1', apiLimiter);

// Specific rate limiting for sensitive endpoints (stricter limits)
if (config.env === 'production') {
  // Auth endpoints - stricter limits
  app.use('/v1/auth/login', authLimiter);
  app.use('/v1/auth/register', registrationLimiter);
  app.use('/v1/auth/forgot-password', passwordResetLimiter);
  app.use('/v1/auth/reset-password', passwordResetLimiter);
} else {
  // Development - apply rate limiting but with more lenient limits
  app.use('/v1/auth/login', authLimiter);
  app.use('/v1/auth/register', registrationLimiter);
  app.use('/v1/auth/forgot-password', passwordResetLimiter);
  app.use('/v1/auth/reset-password', passwordResetLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
