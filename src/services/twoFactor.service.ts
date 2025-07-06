import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User } from '@prisma/client';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

/**
 * Generate a new TOTP secret for 2FA setup
 */
const generateSecret = async (user: User): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> => {
  // Generate TOTP secret
  const secret = speakeasy.generateSecret({
    name: `${user.email} (${process.env.APP_NAME || 'Your App'})`,
    issuer: process.env.APP_NAME || 'Your App',
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  return {
    secret: secret.base32!,
    qrCode,
    backupCodes,
  };
};

/**
 * Generate backup codes for account recovery
 */
const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Verify TOTP token
 */
const verifyToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds) for clock skew
  });
};

/**
 * Verify backup code
 */
const verifyBackupCode = async (userId: number, code: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorBackupCodes: true },
  });

  if (!user || !user.twoFactorBackupCodes.includes(code)) {
    return false;
  }

  // Remove used backup code
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorBackupCodes: {
        set: user.twoFactorBackupCodes.filter(c => c !== code),
      },
    },
  });

  return true;
};

/**
 * Enable 2FA for a user
 */
const enableTwoFactor = async (userId: number, token: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      twoFactorSecret: true,
      twoFactorEnabled: true,
      twoFactorVerified: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.twoFactorEnabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, '2FA is already enabled');
  }

  if (!user.twoFactorSecret) {
    throw new ApiError(httpStatus.BAD_REQUEST, '2FA secret not found. Please generate a new secret first.');
  }

  // Verify the token
  if (!verifyToken(user.twoFactorSecret, token)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid 2FA token');
  }

  // Enable 2FA
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorVerified: true,
    },
  });
};

/**
 * Disable 2FA for a user
 */
const disableTwoFactor = async (userId: number, token: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      twoFactorSecret: true,
      twoFactorEnabled: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.twoFactorEnabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, '2FA is not enabled');
  }

  // Verify the token
  if (!verifyToken(user.twoFactorSecret!, token)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid 2FA token');
  }

  // Disable 2FA
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorVerified: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    },
  });
};

/**
 * Setup 2FA (generate secret and QR code)
 */
const setupTwoFactor = async (userId: number): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      twoFactorEnabled: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.twoFactorEnabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, '2FA is already enabled');
  }

  const { secret, qrCode, backupCodes } = await generateSecret(user as User);

  // Store the secret temporarily (not enabled yet)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
    },
  });

  return { secret, qrCode, backupCodes };
};

/**
 * Verify 2FA during login
 */
const verifyTwoFactor = async (userId: number, token: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return false;
  }

  // First try TOTP token
  if (verifyToken(user.twoFactorSecret, token)) {
    return true;
  }

  // If TOTP fails, try backup code
  return await verifyBackupCode(userId, token);
};

/**
 * Regenerate backup codes
 */
const regenerateBackupCodes = async (userId: number, token: string): Promise<string[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.twoFactorEnabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, '2FA is not enabled');
  }

  // Verify the token
  if (!verifyToken(user.twoFactorSecret!, token)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid 2FA token');
  }

  const backupCodes = generateBackupCodes();

  // Update backup codes
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorBackupCodes: backupCodes,
    },
  });

  return backupCodes;
};

/**
 * Get 2FA status for a user
 */
const getTwoFactorStatus = async (userId: number): Promise<{
  enabled: boolean;
  verified: boolean;
  hasBackupCodes: boolean;
}> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorVerified: true,
      twoFactorBackupCodes: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return {
    enabled: user.twoFactorEnabled,
    verified: user.twoFactorVerified,
    hasBackupCodes: user.twoFactorBackupCodes.length > 0,
  };
};

export default {
  generateSecret,
  verifyToken,
  verifyBackupCode,
  enableTwoFactor,
  disableTwoFactor,
  setupTwoFactor,
  verifyTwoFactor,
  regenerateBackupCodes,
  getTwoFactorStatus,
}; 