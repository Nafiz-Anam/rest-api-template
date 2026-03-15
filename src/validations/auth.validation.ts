import { z } from 'zod';
import { password } from './custom.validation';

const register = {
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    name: z
      .string()
      .min(1, { message: 'Name is required' })
      .max(100, { message: 'Name cannot exceed 100 characters' }),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }),
};

const login = {
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
};

const logout = {
  body: z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
  }),
};

const refreshTokens = {
  body: z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
  }),
};

const forgotPassword = {
  body: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
  }),
};

const resetPassword = {
  query: z.object({
    token: z.string().min(1, { message: 'Token is required' }),
  }),
  body: z.object({
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  }),
};

const verifyEmail = {
  query: z.object({
    token: z.string().min(1, { message: 'Token is required' }),
  }),
};

const verifyTwoFactor = {
  body: z.object({
    userId: z.string().min(1, { message: 'User ID is required' }),
    token: z
      .string()
      .min(6, { message: 'Token must be at least 6 characters' })
      .max(8, { message: 'Token cannot exceed 8 characters' }),
  }),
};

const changePassword = {
  body: z.object({
    oldPassword: z.string().min(1, { message: 'Old password is required' }),
    newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  }),
};

const enableTwoFactor = {
  body: z.object({
    token: z
      .string()
      .min(6, { message: 'Token must be at least 6 characters' })
      .max(8, { message: 'Token cannot exceed 8 characters' }),
  }),
};

const disableTwoFactor = {
  body: z.object({
    token: z
      .string()
      .min(6, { message: 'Token must be at least 6 characters' })
      .max(8, { message: 'Token cannot exceed 8 characters' }),
  }),
};

const regenerateBackupCodes = {
  body: z.object({
    token: z
      .string()
      .min(6, { message: 'Token must be at least 6 characters' })
      .max(8, { message: 'Token cannot exceed 8 characters' }),
  }),
};

const checkAccountLockout = {
  query: z.object({
    email: z.string().email({ message: 'Invalid email format' }),
  }),
};

const verifyEmailOtp = {
  body: z.object({
    userId: z.string().min(1, { message: 'User ID is required' }),
    otp: z.string().length(6, { message: 'OTP must be exactly 6 characters' }),
  }),
};

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyTwoFactor,
  changePassword,
  enableTwoFactor,
  disableTwoFactor,
  regenerateBackupCodes,
  checkAccountLockout,
  verifyEmailOtp,
};
