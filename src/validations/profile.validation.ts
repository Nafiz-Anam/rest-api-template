import { z } from 'zod';

const updateProfile = {
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Name must be at least 1 character' })
      .max(100, { message: 'Name cannot exceed 100 characters' })
      .optional(),
    avatar: z.string().url({ message: 'Avatar must be a valid URL' }).optional(),
    bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters' }).optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()]+$/, { message: 'Invalid phone number format' })
      .optional(),
    dateOfBirth: z
      .date()
      .max(new Date(), { message: 'Date of birth cannot be in the future' })
      .optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    location: z.string().max(200, { message: 'Location cannot exceed 200 characters' }).optional(),
    timezone: z.string().optional(),
    language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']).optional(),
  }),
};

const updatePreferences = {
  body: z.object({
    emailNotifications: z
      .object({
        loginAlerts: z.boolean().optional(),
        passwordChanges: z.boolean().optional(),
        twoFactorChanges: z.boolean().optional(),
        deviceLogins: z.boolean().optional(),
      })
      .optional(),
    pushNotifications: z
      .object({
        loginAlerts: z.boolean().optional(),
        securityUpdates: z.boolean().optional(),
      })
      .optional(),
    privacySettings: z
      .object({
        profileVisibility: z.enum(['public', 'private', 'friends_only']).optional(),
        showEmail: z.boolean().optional(),
        showLastSeen: z.boolean().optional(),
      })
      .optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']).optional(),
    timezone: z.string().optional(),
  }),
};

const updatePrivacySettings = {
  body: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends_only'], {
      message: 'Profile visibility is required',
    }),
    showEmail: z.boolean().optional(),
    showLastSeen: z.boolean().optional(),
  }),
};

const deleteAccount = {
  body: z.object({
    password: z.string().min(1, { message: 'Password is required' }),
  }),
};

const uploadAvatar = {
  file: z.object({
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], {
      message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
    }),
    size: z.number().max(5 * 1024 * 1024, { message: 'File size cannot exceed 5MB' }),
  }),
};

export default {
  updateProfile,
  updatePreferences,
  updatePrivacySettings,
  deleteAccount,
  uploadAvatar,
};
