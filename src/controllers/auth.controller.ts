import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import authService from '../services/auth.service';
import tokenService from '../services/token.service';
import emailService from '../services/email.service';
import userService from '../services/user.service';
import { Request, Response } from 'express';

/**
 * Register user
 * @route POST /v1/auth/register
 * @access Public
 */
const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user as any, req);
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user as any);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken, user.name || 'User');
  res.status(httpStatus.CREATED).send({ user, tokens });
});

/**
 * Login user
 * @route POST /v1/auth/login
 * @access Public
 */
const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const tokens = await authService.loginUserWithEmailAndPassword(email, password, req);
  res.send({ tokens });
});

/**
 * Logout
 * @route POST /v1/auth/logout
 * @access Private
 */
const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Refresh tokens
 * @route POST /v1/auth/refresh-tokens
 * @access Public
 */
const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken, req);
  res.send({ tokens });
});

/**
 * Forgot password
 * @route POST /v1/auth/forgot-password
 * @access Public
 */
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken, 'User');
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Reset password
 * @route POST /v1/auth/reset-password
 * @access Public
 */
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.query.token as string, req.body.password, req);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Send verification email
 * @route POST /v1/auth/send-verification-email
 * @access Private
 */
const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user as any);
  await emailService.sendVerificationEmail(
    (req.user as any).email,
    verifyEmailToken,
    (req.user as any).name || 'User'
  );
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Verify email
 * @route POST /v1/auth/verify-email
 * @access Public
 */
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Change password
 * @route POST /v1/auth/change-password
 * @access Private
 */
const changePassword = catchAsync(async (req: Request, res: Response) => {
  await authService.changePassword(
    (req.user as any).id,
    req.body.oldPassword,
    req.body.newPassword,
    req
  );
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Verify 2FA and complete login
 * @route POST /v1/auth/verify-2fa
 * @access Public
 */
const verifyTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const { userId, token } = req.body;

  const isValid = await authService.verifyTwoFactorToken(userId, token);

  if (!isValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid 2FA token');
  }

  const user = await authService.getUserById(userId);
  const tokens = await tokenService.generateAuthTokens(user as any, req);

  res.send({
    user: tokens.user,
    tokens: tokens.access,
    device: tokens.device,
  });
});

/**
 * Setup 2FA
 * @route POST /v1/auth/2fa/setup
 * @access Private
 */
const setupTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.setupTwoFactor((req.user as any).id);
  res.send(result);
});

/**
 * Enable 2FA
 * @route POST /v1/auth/2fa/enable
 * @access Private
 */
const enableTwoFactor = catchAsync(async (req: Request, res: Response) => {
  await authService.enableTwoFactor((req.user as any).id, req.body.token, req);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Disable 2FA
 * @route POST /v1/auth/2fa/disable
 * @access Private
 */
const disableTwoFactor = catchAsync(async (req: Request, res: Response) => {
  await authService.disableTwoFactor((req.user as any).id, req.body.token, req);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get 2FA status
 * @route GET /v1/auth/2fa/status
 * @access Private
 */
const getTwoFactorStatus = catchAsync(async (req: Request, res: Response) => {
  const status = await authService.getTwoFactorStatus((req.user as any).id);
  res.send(status);
});

/**
 * Regenerate 2FA backup codes
 * @route POST /v1/auth/2fa/regenerate-backup-codes
 * @access Private
 */
const regenerateBackupCodes = catchAsync(async (req: Request, res: Response) => {
  const backupCodes = await authService.regenerateBackupCodes((req.user as any).id, req.body.token);
  res.send({ backupCodes });
});

/**
 * Check account lockout status
 * @route GET /v1/auth/account-lockout-status
 * @access Public
 */
const checkAccountLockoutStatus = catchAsync(async (req: Request, res: Response) => {
  const status = await authService.checkAccountLockout(req.query.email as string);
  res.send(status);
});

export default {
  register,
  login,
  verifyTwoFactor,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  changePassword,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes,
  checkAccountLockoutStatus,
};
