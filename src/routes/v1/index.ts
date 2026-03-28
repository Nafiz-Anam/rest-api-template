import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import meRoute from './me.routes';
import docsRoute from './docs.route';
import twoFactorRoute from './twoFactor.route';
import deviceRoute from './device.route';
import profileRoute from './profile.route';
import ipSecurityRoute from './ipSecurity.route';
import pushNotificationRoute from './pushNotification.route';
import config from '../../config/config';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/me',
    route: meRoute,
  },
  {
    path: '/2fa',
    route: twoFactorRoute,
  },
  {
    path: '/devices',
    route: deviceRoute,
  },
  {
    path: '/profile',
    route: profileRoute,
  },
  {
    path: '/ip-security',
    route: ipSecurityRoute,
  },
  {
    path: '/users',
    route: pushNotificationRoute,
  },
];

// routes available only in development mode
const devRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
];

// routes available in production with authentication
const prodRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
];

// Debug log to check route registration
defaultRoutes.forEach(route => {
  router.use(route.path, route.route);
});

if (config.env === 'development') {
  devRoutes.forEach(route => {
    router.use(route.path, route.route);
  });
} else if (config.env === 'production') {
  // In production, docs are available but should be protected
  prodRoutes.forEach(route => {
    router.use(route.path, route.route);
  });
}

export default router;
