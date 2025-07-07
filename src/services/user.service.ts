import httpStatus from 'http-status';
import { User, Role } from '@prisma/client';
import ApiError from '../utils/ApiError';
import prisma from '../client';
import { encryptPassword, isPasswordMatch } from '../utils/encryption';
import exclude from '../utils/exclude';
import pick from '../utils/pick';

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody: any) => {
  if (await getUserByEmail(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const hashedPassword = await encryptPassword(userBody.password);
  const user = await prisma.user.create({
    data: {
      ...userBody,
      password: hashedPassword,
      isActive: true,
    },
  });
  return user;
};

/**
 * Get user by id
 * @param {string} id
 * @param {Array<string>} keys
 * @returns {Promise<Pick<User, 'id' | 'email' | 'name' | 'role'> | null>}
 */
const getUserById = async (id: string, keys?: string[]) => {
  if (keys && keys.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: keys.reduce((obj, key) => ({ ...obj, [key]: true }), {}),
    });
    return user;
  }

  // Return full user object if no keys specified
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return user as User | null;
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User | null>}
 */
const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user as User | null;
};

/**
 * Update user by id
 * @param {string} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId: string, updateBody: any) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await getUserByEmail(updateBody.email)).id !== userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
  });
  return updatedUser;
};

/**
 * Delete user by id
 * @param {string} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await prisma.user.delete({ where: { id: userId } });
  return user;
};

/**
 * Query users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter: any, options: any) => {
  const users = await prisma.user.findMany({
    where: filter,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isEmailVerified: true,
      isActive: true,
      isLocked: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { createdAt: 'desc' },
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  });

  const total = await prisma.user.count({ where: filter });

  return {
    results: users,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit),
    totalResults: total,
  };
};

/**
 * Get user profile
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      isEmailVerified: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      privacySettings: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const privacySettings = user.privacySettings || {};

  return {
    ...user,
    privacySettings,
  };
};

/**
 * Update user profile
 * @param {string} userId
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const updateUserProfile = async (userId: string, updateBody: any) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/**
 * Get user preferences
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getUserPreferences = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailNotifications: true,
      privacySettings: true,
      preferences: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return {
    emailNotifications: user.emailNotifications || {},
    privacySettings: user.privacySettings || {},
    preferences: user.preferences || {},
  };
};

/**
 * Update user preferences
 * @param {string} userId
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const updateUserPreferences = async (userId: string, updateBody: any) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailNotifications: true,
      privacySettings: true,
      preferences: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
    select: {
      emailNotifications: true,
      privacySettings: true,
      preferences: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/**
 * Get user statistics
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getUserStats = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Get counts from related tables
  const [activityCount, deviceCount, sessionCount] = await Promise.all([
    prisma.userActivity.count({ where: { userId } }),
    prisma.device.count({ where: { userId } }),
    prisma.userSession.count({ where: { userId } }),
  ]);

  return {
    totalActivities: activityCount,
    totalDevices: deviceCount,
    activeSessions: sessionCount,
    accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    lastLogin: user.lastLoginAt,
    isEmailVerified: user.isEmailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
  };
};

/**
 * Get users with expiring passwords
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const getUsersWithExpiringPasswords = async (filter: any, options: any) => {
  const users = await prisma.user.findMany({
    where: {
      ...filter,
      passwordChangedAt: {
        lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordChangedAt: true,
      lastLoginAt: true,
    },
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { passwordChangedAt: 'asc' },
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  });

  const total = await prisma.user.count({
    where: {
      ...filter,
      passwordChangedAt: {
        lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    results: users,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit),
    totalResults: total,
  };
};

/**
 * Get locked users
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const getLockedUsers = async (filter: any, options: any) => {
  const users = await prisma.user.findMany({
    where: {
      ...filter,
      isLocked: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isLocked: true,
      failedLoginAttempts: true,
      lockoutUntil: true,
      lastLoginAt: true,
    },
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { lastLoginAt: 'desc' },
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  });

  const total = await prisma.user.count({
    where: {
      ...filter,
      isLocked: true,
    },
  });

  return {
    results: users,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit),
    totalResults: total,
  };
};

/**
 * Unlock user account
 * @param {string} userId
 * @returns {Promise<User>}
 */
const unlockUserAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isLocked: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.isLocked) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User account is not locked');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isLocked: false,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
  });

  return updatedUser;
};

/**
 * Force password change
 * @param {string} userId
 * @returns {Promise<User>}
 */
const forcePasswordChange = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      forcePasswordChange: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      forcePasswordChange: true,
    },
  });

  return updatedUser;
};

export default {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserStats,
  getUsersWithExpiringPasswords,
  getLockedUsers,
  unlockUserAccount,
  forcePasswordChange,
};
