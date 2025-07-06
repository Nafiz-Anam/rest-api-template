import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { profileService } from '../services';
import ApiError from '../utils/ApiError';
import { Request, Response } from 'express';

/**
 * Get user profile
 * @route GET /v1/profile
 * @access Private
 */
const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const profile = await profileService.getUserProfile(user.id);
  res.status(httpStatus.OK).send(profile);
});

/**
 * Update user profile
 * @route PATCH /v1/profile
 * @access Private
 */
const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const profile = await profileService.updateUserProfile(user.id, req.body);
  res.status(httpStatus.OK).send(profile);
});

/**
 * Get user preferences
 * @route GET /v1/profile/preferences
 * @access Private
 */
const getUserPreferences = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const preferences = await profileService.getUserPreferences(user.id);
  res.status(httpStatus.OK).send(preferences);
});

/**
 * Update user preferences
 * @route PATCH /v1/profile/preferences
 * @access Private
 */
const updateUserPreferences = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const preferences = await profileService.updateUserPreferences(user.id, req.body);
  res.status(httpStatus.OK).send(preferences);
});

/**
 * Get privacy settings
 * @route GET /v1/profile/privacy
 * @access Private
 */
const getPrivacySettings = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const privacy = await profileService.getPrivacySettings(user.id);
  res.status(httpStatus.OK).send(privacy);
});

/**
 * Update privacy settings
 * @route PATCH /v1/profile/privacy
 * @access Private
 */
const updatePrivacySettings = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const privacy = await profileService.updatePrivacySettings(user.id, req.body);
  res.status(httpStatus.OK).send(privacy);
});

/**
 * Get account status
 * @route GET /v1/profile/account-status
 * @access Private
 */
const getAccountStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const status = await profileService.getAccountStatus(user.id);
  res.status(httpStatus.OK).send(status);
});

/**
 * Get user statistics
 * @route GET /v1/profile/stats
 * @access Private
 */
const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const stats = await profileService.getUserStats(user.id);
  res.status(httpStatus.OK).send(stats);
});

/**
 * Export user data
 * @route GET /v1/profile/export
 * @access Private
 */
const exportUserData = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const data = await profileService.exportUserData(user.id);
  res.status(httpStatus.OK).send(data);
});

/**
 * Delete user account
 * @route DELETE /v1/profile/account
 * @access Private
 */
const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { password } = req.body;
  
  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password is required to delete account');
  }

  await profileService.deleteAccount(user.id, password);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Upload avatar
 * @route POST /v1/profile/avatar
 * @access Private
 */
const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Avatar file is required');
  }

  const avatar = await profileService.uploadAvatar(user.id, req.file);
  res.status(httpStatus.OK).send(avatar);
});

/**
 * Remove avatar
 * @route DELETE /v1/profile/avatar
 * @access Private
 */
const removeAvatar = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  await profileService.removeAvatar(user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getPrivacySettings,
  updatePrivacySettings,
  getAccountStatus,
  getUserStats,
  exportUserData,
  deleteAccount,
  uploadAvatar,
  removeAvatar,
}; 