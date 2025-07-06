import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { deviceService } from '../services';
import { Request } from 'express';

/**
 * Get user's active devices
 */
const getUserDevices = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const devices = await deviceService.getUserDevices(userId);
  
  // Mark current device
  const currentDeviceId = req.headers['x-device-id'] as string;
  const devicesWithCurrent = devices.map(device => ({
    ...device,
    isCurrentSession: device.deviceId === currentDeviceId,
  }));

  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: 'Devices retrieved successfully',
    data: devicesWithCurrent,
  });
});

/**
 * Logout from a specific device
 */
const logoutDevice = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const { deviceId } = req.params;

  await deviceService.logoutDevice(userId, deviceId);

  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: 'Device logged out successfully',
  });
});

/**
 * Logout from all other devices
 */
const logoutAllOtherDevices = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const currentDeviceId = req.headers['x-device-id'] as string;

  if (!currentDeviceId) {
    res.status(httpStatus.BAD_REQUEST).json({
      code: httpStatus.BAD_REQUEST,
      message: 'Current device ID is required',
    });
    return;
  }

  await deviceService.logoutAllOtherDevices(userId, currentDeviceId);

  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: 'All other devices logged out successfully',
  });
});

/**
 * Get device limit information
 */
const getDeviceLimitInfo = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const limitInfo = await deviceService.getDeviceLimitInfo(userId);

  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: 'Device limit info retrieved successfully',
    data: limitInfo,
  });
});

/**
 * Update device name
 */
const updateDeviceName = catchAsync(async (req: Request, res) => {
  const userId = (req.user as any).id;
  const { deviceId } = req.params;
  const { deviceName } = req.body;

  await deviceService.updateDeviceName(userId, deviceId, deviceName);

  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: 'Device name updated successfully',
  });
});

export default {
  getUserDevices,
  logoutDevice,
  logoutAllOtherDevices,
  getDeviceLimitInfo,
  updateDeviceName,
}; 