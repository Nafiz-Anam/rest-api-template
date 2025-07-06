import Joi from 'joi';
import { password } from './custom.validation';

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().min(1).max(100).required(),
    role: Joi.string().valid('USER', 'ADMIN').optional(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    deviceName: Joi.string().min(1).max(100).required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const verifyTwoFactor = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    token: Joi.string().min(6).max(8).required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(password),
  }),
};

const enableTwoFactor = {
  body: Joi.object().keys({
    token: Joi.string().min(6).max(8).required(),
  }),
};

const disableTwoFactor = {
  body: Joi.object().keys({
    token: Joi.string().min(6).max(8).required(),
  }),
};

const regenerateBackupCodes = {
  body: Joi.object().keys({
    token: Joi.string().min(6).max(8).required(),
  }),
};

const checkAccountLockout = {
  query: Joi.object().keys({
    email: Joi.string().email().required(),
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
};
