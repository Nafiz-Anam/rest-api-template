import { Role } from '@prisma/client';
import Joi from 'joi';
import { password } from './custom.validation';

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required().min(1).max(100),
    role: Joi.string().valid(Role.USER, Role.ADMIN).optional(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string().optional(),
    role: Joi.string().valid(Role.USER, Role.ADMIN).optional(),
    isActive: Joi.boolean().optional(),
    isEmailVerified: Joi.boolean().optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).optional(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email().optional(),
      password: Joi.string().custom(password).optional(),
      name: Joi.string().min(1).max(100).optional(),
      role: Joi.string().valid(Role.USER, Role.ADMIN).optional(),
      isActive: Joi.boolean().optional(),
      isEmailVerified: Joi.boolean().optional(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

// Profile management
const getUserProfile = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const updateUserProfile = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().min(1).max(100).optional(),
    avatar: Joi.string().uri().optional(),
    bio: Joi.string().max(500).optional(),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-()]+$/)
      .optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    location: Joi.string().max(200).optional(),
    timezone: Joi.string().optional(),
    language: Joi.string()
      .valid('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko')
      .optional(),
  }),
};

const getUserPreferences = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const updateUserPreferences = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    emailNotifications: Joi.object()
      .keys({
        loginAlerts: Joi.boolean().optional(),
        passwordChanges: Joi.boolean().optional(),
        twoFactorChanges: Joi.boolean().optional(),
        deviceLogins: Joi.boolean().optional(),
      })
      .optional(),
    pushNotifications: Joi.object()
      .keys({
        loginAlerts: Joi.boolean().optional(),
        securityUpdates: Joi.boolean().optional(),
      })
      .optional(),
    privacySettings: Joi.object()
      .keys({
        profileVisibility: Joi.string().valid('public', 'private', 'friends_only').optional(),
        showEmail: Joi.boolean().optional(),
        showLastSeen: Joi.boolean().optional(),
      })
      .optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    language: Joi.string()
      .valid('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko')
      .optional(),
    timezone: Joi.string().optional(),
  }),
};

const getPrivacySettings = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const updatePrivacySettings = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    profileVisibility: Joi.string().valid('public', 'private', 'friends_only').required(),
    showEmail: Joi.boolean().optional(),
    showLastSeen: Joi.boolean().optional(),
  }),
};

const getAccountStatus = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const getUserStats = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

// Activity management
const getUserActivity = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    type: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
  }),
};

const getActivityStats = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    days: Joi.number().integer().min(1).max(365).optional(),
  }),
};

// Device management
const getUserDevices = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const getDeviceSessions = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const trustDevice = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
    deviceId: Joi.string().required(),
  }),
};

const removeDevice = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
    deviceId: Joi.string().required(),
  }),
};

const removeAllOtherDevices = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    currentDeviceId: Joi.string().required(),
  }),
};

// Notification management
const getUserNotifications = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    type: Joi.string().optional(),
    isRead: Joi.boolean().optional(),
  }),
};

const markNotificationAsRead = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
    notificationId: Joi.string().required(),
  }),
};

const deleteNotification = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
    notificationId: Joi.string().required(),
  }),
};

// Security logs
const getSecurityLogs = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    eventType: Joi.string().optional(),
    level: Joi.string().valid('info', 'warning', 'error').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
  }),
};

const getSecurityStats = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    days: Joi.number().integer().min(1).max(365).optional(),
  }),
};

// Public profile
const getPublicProfile = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

// Data export and account management
const exportUserData = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const deleteAccount = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required(),
  }),
};

// Admin-only endpoints
const getUsersWithExpiringPasswords = {
  query: Joi.object().keys({
    days: Joi.number().integer().min(1).max(30).optional(),
  }),
};

const unlockUserAccount = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const forcePasswordChange = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getPrivacySettings,
  updatePrivacySettings,
  getAccountStatus,
  getUserStats,
  getUserActivity,
  getActivityStats,
  getUserDevices,
  getDeviceSessions,
  trustDevice,
  removeDevice,
  removeAllOtherDevices,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  getSecurityLogs,
  getSecurityStats,
  getPublicProfile,
  exportUserData,
  deleteAccount,
  getUsersWithExpiringPasswords,
  unlockUserAccount,
  forcePasswordChange,
};
