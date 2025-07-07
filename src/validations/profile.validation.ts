import Joi from 'joi';

const updateProfile = {
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

const updatePreferences = {
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

const updatePrivacySettings = {
  body: Joi.object().keys({
    profileVisibility: Joi.string().valid('public', 'private', 'friends_only').required(),
    showEmail: Joi.boolean().optional(),
    showLastSeen: Joi.boolean().optional(),
  }),
};

const deleteAccount = {
  body: Joi.object().keys({
    password: Joi.string().required(),
  }),
};

const uploadAvatar = {
  file: Joi.object().keys({
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp').required(),
    size: Joi.number()
      .max(5 * 1024 * 1024)
      .required(), // 5MB max
  }),
};

export default {
  updateProfile,
  updatePreferences,
  updatePrivacySettings,
  deleteAccount,
  uploadAvatar,
};
