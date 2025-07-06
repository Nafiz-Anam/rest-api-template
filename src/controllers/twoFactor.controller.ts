import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { authService, twoFactorService, tokenService } from '../services';
import { Request } from 'express';

/**
 * Setup 2FA (generate secret and QR code)
 */
const setupTwoFactor = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const result = await twoFactorService.setupTwoFactor(userId);
  
  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: '2FA setup initiated successfully',
    data: {
      secret: result.secret,
      qrCode: result.qrCode,
      backupCodes: result.backupCodes,
    },
  });
});

/**
 * Enable 2FA
 */
const enableTwoFactor = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const { token } = req.body;
  
  await twoFactorService.enableTwoFactor(userId, token);
  
  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: '2FA enabled successfully',
  });
});

/**
 * Disable 2FA
 */
const disableTwoFactor = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const { token } = req.body;
  
  await twoFactorService.disableTwoFactor(userId, token);
  
  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: '2FA disabled successfully',
  });
});

/**
 * Verify 2FA during login
 */
const verifyTwoFactor = catchAsync(async (req: Request, res) => {
  const { userId, token } = req.body;
  
  const user = await authService.completeLoginWithTwoFactor(userId, token, req);
  const tokens = await tokenService.generateAuthTokens(user);
  
  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: 'Login successful',
    data: {
      user,
      tokens,
    },
  });
});

/**
 * Regenerate backup codes
 */
const regenerateBackupCodes = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const { token } = req.body;
  
  const backupCodes = await twoFactorService.regenerateBackupCodes(userId, token);
  
  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: 'Backup codes regenerated successfully',
    data: {
      backupCodes,
    },
  });
});

/**
 * Get 2FA status
 */
const getTwoFactorStatus = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const status = await twoFactorService.getTwoFactorStatus(userId);
  
  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: '2FA status retrieved successfully',
    data: status,
  });
});

export default {
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  regenerateBackupCodes,
  getTwoFactorStatus,
}; 