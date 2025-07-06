import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const MAX_DEVICES_PER_USER = 3;

/**
 * Generate a unique device ID
 */
const generateDeviceId = (): string => {
  return uuidv4();
};

/**
 * Get device information from request
 */
const getDeviceInfo = (req: Request): {
  deviceName: string;
  ipAddress: string;
  userAgent: string;
} => {
  const deviceName = req.body.deviceName || 'Unknown Device';
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
  const userAgent = req.get('User-Agent') || 'Unknown';

  return {
    deviceName,
    ipAddress,
    userAgent,
  };
};

/**
 * Check if user has reached device limit
 */
const checkDeviceLimit = async (userId: number): Promise<{
  hasReachedLimit: boolean;
  activeDevices: any[];
}> => {
  const activeDevices = await prisma.token.findMany({
    where: {
      userId,
      type: 'REFRESH',
      blacklisted: false,
      expires: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      deviceId: true,
      deviceName: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return {
    hasReachedLimit: activeDevices.length >= MAX_DEVICES_PER_USER,
    activeDevices,
  };
};

/**
 * Remove oldest device session when limit is reached
 */
const removeOldestDevice = async (userId: number): Promise<void> => {
  const oldestToken = await prisma.token.findFirst({
    where: {
      userId,
      type: 'REFRESH',
      blacklisted: false,
      expires: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (oldestToken) {
    await prisma.token.update({
      where: { id: oldestToken.id },
      data: { blacklisted: true },
    });
  }
};

/**
 * Create a new device session
 */
const createDeviceSession = async (
  userId: number,
  token: string,
  req: Request
): Promise<{
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}> => {
  const deviceInfo = getDeviceInfo(req);
  const deviceId = generateDeviceId();

  // Check device limit
  const { hasReachedLimit, activeDevices } = await checkDeviceLimit(userId);

  if (hasReachedLimit) {
    // Remove oldest device
    await removeOldestDevice(userId);
  }

  // Create new token with device info
  await prisma.token.create({
    data: {
      token,
      type: 'REFRESH',
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      blacklisted: false,
      deviceId,
      deviceName: deviceInfo.deviceName,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      userId,
    },
  });

  return {
    deviceId,
    deviceName: deviceInfo.deviceName,
    ipAddress: deviceInfo.ipAddress,
    userAgent: deviceInfo.userAgent,
  };
};

/**
 * Get user's active devices
 */
const getUserDevices = async (userId: number): Promise<any[]> => {
  const devices = await prisma.token.findMany({
    where: {
      userId,
      type: 'REFRESH',
      blacklisted: false,
      expires: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      deviceId: true,
      deviceName: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expires: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return devices.map(device => ({
    ...device,
    isCurrentSession: false, // Will be set by the controller
  }));
};

/**
 * Logout from a specific device
 */
const logoutDevice = async (userId: number, deviceId: string): Promise<void> => {
  const token = await prisma.token.findFirst({
    where: {
      userId,
      deviceId,
      type: 'REFRESH',
      blacklisted: false,
    },
  });

  if (!token) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Device session not found');
  }

  await prisma.token.update({
    where: { id: token.id },
    data: { blacklisted: true },
  });
};

/**
 * Logout from all devices except current
 */
const logoutAllOtherDevices = async (userId: number, currentDeviceId: string): Promise<void> => {
  await prisma.token.updateMany({
    where: {
      userId,
      type: 'REFRESH',
      blacklisted: false,
      deviceId: {
        not: currentDeviceId,
      },
    },
    data: { blacklisted: true },
  });
};

/**
 * Get device limit info
 */
const getDeviceLimitInfo = async (userId: number): Promise<{
  maxDevices: number;
  currentDevices: number;
  canAddNewDevice: boolean;
}> => {
  const { activeDevices } = await checkDeviceLimit(userId);

  return {
    maxDevices: MAX_DEVICES_PER_USER,
    currentDevices: activeDevices.length,
    canAddNewDevice: activeDevices.length < MAX_DEVICES_PER_USER,
  };
};

/**
 * Update device name
 */
const updateDeviceName = async (userId: number, deviceId: string, deviceName: string): Promise<void> => {
  const token = await prisma.token.findFirst({
    where: {
      userId,
      deviceId,
      type: 'REFRESH',
      blacklisted: false,
    },
  });

  if (!token) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Device session not found');
  }

  await prisma.token.update({
    where: { id: token.id },
    data: { deviceName },
  });
};

export default {
  generateDeviceId,
  getDeviceInfo,
  checkDeviceLimit,
  removeOldestDevice,
  createDeviceSession,
  getUserDevices,
  logoutDevice,
  logoutAllOtherDevices,
  getDeviceLimitInfo,
  updateDeviceName,
}; 