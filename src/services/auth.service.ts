import httpStatus from 'http-status';
import tokenService from './token.service';
import userService from './user.service';
import securityService from './security.service';
import twoFactorService from './twoFactor.service';
import ApiError from '../utils/ApiError';
import { TokenType, User } from '@prisma/client';
import prisma from '../client';
import { encryptPassword, isPasswordMatch } from '../utils/encryption';
import { AuthTokensResponse } from '../types/response';
import exclude from '../utils/exclude';
import { Request } from 'express';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @param {Request} req - Express request object for logging
 * @returns {Promise<Omit<User, 'password'> | { requiresTwoFactor: true; userId: number }>}
 */
const loginUserWithEmailAndPassword = async (
  email: string,
  password: string,
  req: Request
): Promise<Omit<User, 'password'> | { requiresTwoFactor: true; userId: number }> => {
  const user = await userService.getUserByEmail(email, [
    'id',
    'email',
    'name',
    'password',
    'role',
    'isEmailVerified',
    'createdAt',
    'updatedAt',
    'failedLoginAttempts',
    'lockoutUntil',
    'lastLoginAt',
    'twoFactorEnabled',
    'twoFactorSecret',
    'twoFactorBackupCodes',
    'twoFactorVerified',
  ]);

  // Check if account is locked
  if (user?.lockoutUntil && user.lockoutUntil > new Date()) {
    await securityService.logLoginFailed(email, req, 'Account locked');
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      `Account temporarily locked. Please try again after ${new Date(user.lockoutUntil).toLocaleString()}`
    );
  }

  if (!user || !(await isPasswordMatch(password, user.password as string))) {
    // Increment failed login attempts
    if (user) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutUntil = null;

      // Lock account after 5 failed attempts for 15 minutes
      if (failedAttempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await userService.updateUserById(user.id, {
        failedLoginAttempts: failedAttempts,
        lockoutUntil,
      } as any); // Type assertion for new fields
    }

    await securityService.logLoginFailed(email, req, 'Invalid credentials');
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  // Reset failed login attempts on successful login
  if (user.failedLoginAttempts > 0) {
    await userService.updateUserById(user.id, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
    } as any); // Type assertion for new fields
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // Return indication that 2FA is required
    return { requiresTwoFactor: true, userId: user.id };
  }

  // Update last login time
  await userService.updateUserById(user.id, {
    lastLoginAt: new Date(),
  } as any);

  const userWithoutPassword = exclude(user, ['password']);
  await securityService.logLoginSuccess(userWithoutPassword as any, req);
  
  return userWithoutPassword;
};

/**
 * Complete login with 2FA verification
 * @param {number} userId
 * @param {string} twoFactorToken
 * @param {Request} req - Express request object for logging
 * @returns {Promise<Omit<User, 'password'>>}
 */
const completeLoginWithTwoFactor = async (
  userId: number,
  twoFactorToken: string,
  req: Request
): Promise<Omit<User, 'password'>> => {
  const user = await userService.getUserById(userId);
  
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.twoFactorEnabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, '2FA is not enabled for this account');
  }

  // Verify 2FA token
  const isValid = await twoFactorService.verifyTwoFactor(userId, twoFactorToken);
  
  if (!isValid) {
    await securityService.logLoginFailed(user.email, req, 'Invalid 2FA token');
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid 2FA token');
  }

  // Update last login time
  await userService.updateUserById(userId, {
    lastLoginAt: new Date(),
  } as any);

  const userWithoutPassword = exclude(user, ['password']);
  await securityService.logLoginSuccess(userWithoutPassword as any, req);
  
  return userWithoutPassword;
};

/**
 * Logout
 * @param {string} refreshToken
 * @param {Request} req - Express request object for logging
 * @returns {Promise<void>}
 */
const logout = async (refreshToken: string, req: Request): Promise<void> => {
  const refreshTokenData = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: TokenType.REFRESH,
      blacklisted: false,
    },
    include: {
      user: true,
    },
  });
  
  if (!refreshTokenData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }

  // Log logout event
  if (refreshTokenData.user) {
    await securityService.logLogout(refreshTokenData.user, req);
  }

  await prisma.token.delete({ where: { id: refreshTokenData.id } });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (refreshToken: string): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenData = await tokenService.verifyToken(refreshToken, TokenType.REFRESH);
    const { userId } = refreshTokenData;
    await prisma.token.delete({ where: { id: refreshTokenData.id } });
    return tokenService.generateAuthTokens({ id: userId });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @param {Request} req - Express request object for logging
 * @returns {Promise<void>}
 */
const resetPassword = async (
  resetPasswordToken: string, 
  newPassword: string, 
  req: Request
): Promise<void> => {
  try {
    const resetPasswordTokenData = await tokenService.verifyToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    );
    const user = await userService.getUserById(resetPasswordTokenData.userId);
    if (!user) {
      throw new Error();
    }
    const encryptedPassword = await encryptPassword(newPassword);
    await userService.updateUserById(user.id, { 
      password: encryptedPassword,
      failedLoginAttempts: 0, // Reset failed attempts
      lockoutUntil: null, // Unlock account
    } as any); // Type assertion for new fields
    await prisma.token.deleteMany({ where: { userId: user.id, type: TokenType.RESET_PASSWORD } });
    
    // Log password reset completion
    await securityService.logPasswordResetCompleted(user, req);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenData = await tokenService.verifyToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
    );
    await prisma.token.deleteMany({
      where: { userId: verifyEmailTokenData.userId, type: TokenType.VERIFY_EMAIL },
    });
    await userService.updateUserById(verifyEmailTokenData.userId, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

export default {
  loginUserWithEmailAndPassword,
  completeLoginWithTwoFactor,
  isPasswordMatch,
  encryptPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
