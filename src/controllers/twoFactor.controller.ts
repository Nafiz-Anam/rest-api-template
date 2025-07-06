import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { twoFactorService } from '../services';
import ApiError from '../utils/ApiError';
import { Request, Response } from 'express';

/**
 * Setup 2FA
 * @route POST /v1/2fa/setup
 * @access Private
 */
const setupTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await twoFactorService.setupTwoFactor(user.id);
  res.status(httpStatus.OK).send(result);
});

/**
 * Enable 2FA
 * @route POST /v1/2fa/enable
 * @access Private
 */
const enableTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  await twoFactorService.enableTwoFactor(user.id, req.body.token);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Disable 2FA
 * @route POST /v1/2fa/disable
 * @access Private
 */
const disableTwoFactor = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  await twoFactorService.disableTwoFactor(user.id, req.body.token);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get 2FA status
 * @route GET /v1/2fa/status
 * @access Private
 */
const getTwoFactorStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const status = await twoFactorService.getTwoFactorStatus(user.id);
  res.status(httpStatus.OK).send(status);
});

/**
 * Regenerate backup codes
 * @route POST /v1/2fa/regenerate-backup-codes
 * @access Private
 */
const regenerateBackupCodes = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const backupCodes = await twoFactorService.regenerateBackupCodes(user.id, req.body.token);
  res.status(httpStatus.OK).send({ backupCodes });
});

/**
 * Verify 2FA token
 * @route POST /v1/2fa/verify
 * @access Public
 */
const verifyToken = catchAsync(async (req: Request, res: Response) => {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID and token are required');
  }

  const isValid = await twoFactorService.verifyTwoFactor(userId, token);
  res.send({ isValid });
});

export default {
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes,
  verifyToken,
}; 