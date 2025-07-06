import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { deviceValidation } from '../../validations';
import { deviceController } from '../../controllers';

const router = express.Router();

// All device routes require authentication
router.use(auth());

/**
 * @route GET /v1/devices
 * @desc Get user devices
 * @access Private
 */
router.get(
  '/',
  deviceController.getUserDevices
);

/**
 * @route GET /v1/devices/sessions
 * @desc Get device sessions
 * @access Private
 */
router.get(
  '/sessions',
  deviceController.getDeviceSessions
);

/**
 * @route POST /v1/devices/:deviceId/trust
 * @desc Trust device
 * @access Private
 */
router.post(
  '/:deviceId/trust',
  validate(deviceValidation.trustDevice),
  deviceController.trustDevice
);

/**
 * @route DELETE /v1/devices/:deviceId
 * @desc Remove device
 * @access Private
 */
router.delete(
  '/:deviceId',
  validate(deviceValidation.removeDevice),
  deviceController.removeDevice
);

/**
 * @route DELETE /v1/devices
 * @desc Remove all other devices
 * @access Private
 */
router.delete(
  '/',
  validate(deviceValidation.removeAllOtherDevices),
  deviceController.removeAllOtherDevices
);

/**
 * @route GET /v1/devices/limit
 * @desc Check device limit
 * @access Private
 */
router.get(
  '/limit',
  deviceController.checkDeviceLimit
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Device Management
 *   description: User device and session management
 */

/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Get user's active devices
 *     description: Retrieve all active device sessions for the authenticated user
 *     tags: [Device Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Devices retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Token ID
 *                       deviceId:
 *                         type: string
 *                         description: Unique device identifier
 *                       deviceName:
 *                         type: string
 *                         description: Human-readable device name
 *                       ipAddress:
 *                         type: string
 *                         description: IP address of the device
 *                       userAgent:
 *                         type: string
 *                         description: User agent string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: When the session was created
 *                       expires:
 *                         type: string
 *                         format: date-time
 *                         description: When the session expires
 *                       isCurrentSession:
 *                         type: boolean
 *                         description: Whether this is the current device
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /devices/limit-info:
 *   get:
 *     summary: Get device limit information
 *     description: Get information about device limits for the user
 *     tags: [Device Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Device limit info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Device limit info retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     maxDevices:
 *                       type: integer
 *                       description: Maximum number of devices allowed
 *                       example: 3
 *                     currentDevices:
 *                       type: integer
 *                       description: Current number of active devices
 *                       example: 2
 *                     canAddNewDevice:
 *                       type: boolean
 *                       description: Whether user can add a new device
 *                       example: true
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /devices/{deviceId}:
 *   delete:
 *     summary: Logout from a specific device
 *     description: Revoke access for a specific device session
 *     tags: [Device Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID to logout from
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       "200":
 *         description: Device logged out successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 * /devices:
 *   delete:
 *     summary: Logout from all other devices
 *     description: Revoke access for all devices except the current one
 *     tags: [Device Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: All other devices logged out successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /devices/{deviceId}/name:
 *   patch:
 *     summary: Update device name
 *     description: Update the name of a specific device
 *     tags: [Device Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID to update
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceName
 *             properties:
 *               deviceName:
 *                 type: string
 *                 description: New name for the device
 *                 example: "My iPhone 15"
 *     responses:
 *       "200":
 *         description: Device name updated successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */ 