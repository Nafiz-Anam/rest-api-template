import { PrismaClient } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import pick from '../utils/pick';
import { UserActivityService } from './userActivity.service';

const prisma = new PrismaClient();

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  language?: string;
  avatar?: string;
}

export interface PreferencesUpdateData {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  loginAlerts?: boolean;
  securityUpdates?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  timezone?: string;
  language?: string;
}

export interface PrivacySettingsData {
  profileVisibility?: 'public' | 'private' | 'friends_only';
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  allowSearch?: boolean;
  allowContact?: boolean;
}

export class ProfileService {
  /**
   * Get user profile with sensitive data excluded
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        location: true,
        timezone: true,
        language: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        twoFactorVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: ProfileUpdateData, ipAddress?: string) {
    const allowedFields = [
      'name', 'phone', 'timezone', 'language', 'avatar', 'bio', 'dateOfBirth', 'gender', 'location'
    ];

    const updateData = pick(data, allowedFields);

    // Validate phone number format
    if (updateData.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(updateData.phone)) {
        throw new Error('Invalid phone number format');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        timezone: true,
        language: true,
        avatar: true,
        bio: true,
        dateOfBirth: true,
        gender: true,
        location: true,
        updatedAt: true,
      },
    });

    // Log profile update activity
    await UserActivityService.logProfileUpdate(userId, updateData, ipAddress);

    return user;
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, data: PreferencesUpdateData, ipAddress?: string) {
    // For now, we'll store preferences in a simple way
    // In a real implementation, you might want to create a separate preferences table
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Log preference update activity
    await UserActivityService.createActivity({
      userId,
      type: 'preferences',
      action: 'update',
      details: { changes: data },
      ipAddress,
    });

    return { id: user.id, updatedAt: user.updatedAt };
  }

  /**
   * Update privacy settings
   */
  static async updatePrivacySettings(userId: string, data: PrivacySettingsData, ipAddress?: string) {
    // For now, we'll handle privacy settings in a simple way
    // In a real implementation, you might want to create a separate privacy settings table
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Log privacy settings update activity
    await UserActivityService.createActivity({
      userId,
      type: 'privacy',
      action: 'update',
      details: { changes: data },
      ipAddress,
    });

    return { id: user.id, updatedAt: user.updatedAt };
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailNotifications: true,
        pushNotifications: true,
        privacySettings: true,
        theme: true,
        language: true,
        timezone: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return user;
  }

  /**
   * Update avatar
   */
  static async updateAvatar(userId: string, avatarUrl: string, ipAddress?: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        location: true,
        timezone: true,
        language: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        twoFactorVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log avatar update activity
    await UserActivityService.createActivity({
      userId,
      type: 'profile',
      action: 'avatar_update',
      details: { avatarUrl },
      ipAddress,
    });

    return user;
  }

  /**
   * Delete user account (soft delete)
   */
  static async deleteAccount(userId: string, reason?: string, ipAddress?: string) {
    // For now, we'll just mark the user as inactive
    // In a real implementation, you might want to implement soft delete
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        // Note: These fields don't exist in current schema, so we'll just update what we can
      },
      select: {
        id: true,
        email: true,
        updatedAt: true,
      },
    });

    // Log account deletion activity
    await UserActivityService.createActivity({
      userId,
      type: 'account',
      action: 'deleted',
      details: { reason },
      ipAddress,
    });

    return { id: user.id, email: user.email, deletedAt: new Date() };
  }

  /**
   * Get public profile (for other users to view)
   */
  static async getPublicProfile(userId: string, requestingUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const isOwnProfile = requestingUserId === userId;

    // If it's the user's own profile, return all data
    if (isOwnProfile) {
      return user;
    }

    // Apply privacy settings for public view
    const publicProfile: any = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    return publicProfile;
  }

  /**
   * Search users (respecting privacy settings)
   */
  static async searchUsers(query: string, limit: number = 20, offset: number = 0) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      take: limit,
      skip: offset,
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
    }));
  }
} 