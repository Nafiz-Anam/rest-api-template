import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import docsRoute from './docs.route';
import twoFactorRoute from './twoFactor.route';
import deviceRoute from './device.route';
import profileRoute from './profile.route';
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
];

// routes available only in development mode
// const devRoutes = [
//   {
//     path: '/docs',
//     route: docsRoute,
//   },
// ];

// Debug log to check route registration
defaultRoutes.forEach(route => {
  console.log(
    'Registering route:',
    route.path,
    'Type:',
    typeof route.route,
    'IsRouter:',
    route.route && typeof route.route.use === 'function'
  );
  router.use(route.path, route.route);
});

// if (config.env === 'development') {
//   devRoutes.forEach(route => {
//     router.use(route.path, route.route);
//   });
// }

export default router;
