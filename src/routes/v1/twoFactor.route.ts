import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { twoFactorValidation } from '../../validations';
import { twoFactorController } from '../../controllers';
import { sensitiveOperationLimiter } from '../../middlewares/rateLimiter';

const router = express.Router();

// All 2FA routes require authentication
router.use(auth());

// Setup 2FA (generate secret and QR code)
router.post('/setup', twoFactorController.setupTwoFactor);

// Enable 2FA
router.post('/enable', sensitiveOperationLimiter, validate(twoFactorValidation.enable), twoFactorController.enableTwoFactor);

// Disable 2FA
router.post('/disable', sensitiveOperationLimiter, validate(twoFactorValidation.disable), twoFactorController.disableTwoFactor);

// Regenerate backup codes
router.post('/regenerate-backup-codes', sensitiveOperationLimiter, validate(twoFactorValidation.regenerateBackupCodes), twoFactorController.regenerateBackupCodes);

// Get 2FA status
router.get('/status', twoFactorController.getTwoFactorStatus);

export default router;

/**
 * @swagger
 * tags:
 *   name: Two-Factor Authentication
 *   description: 2FA/MFA management endpoints
 */

/**
 * @swagger
 * /two-factor/setup:
 *   post:
 *     summary: Setup 2FA
 *     description: Generate a new TOTP secret and QR code for 2FA setup
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: 2FA setup initiated successfully
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
 *                   example: "2FA setup initiated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     secret:
 *                       type: string
 *                       description: TOTP secret key
 *                     qrCode:
 *                       type: string
 *                       description: QR code data URL
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Backup codes for account recovery
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /two-factor/enable:
 *   post:
 *     summary: Enable 2FA
 *     description: Enable 2FA for the authenticated user
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP token from authenticator app
 *                 example: "123456"
 *     responses:
 *       "200":
 *         description: 2FA enabled successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /two-factor/disable:
 *   post:
 *     summary: Disable 2FA
 *     description: Disable 2FA for the authenticated user
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP token from authenticator app
 *                 example: "123456"
 *     responses:
 *       "200":
 *         description: 2FA disabled successfully
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /two-factor/regenerate-backup-codes:
 *   post:
 *     summary: Regenerate backup codes
 *     description: Generate new backup codes for account recovery
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: 6-digit TOTP token from authenticator app
 *                 example: "123456"
 *     responses:
 *       "200":
 *         description: Backup codes regenerated successfully
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
 *                   example: "Backup codes regenerated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: New backup codes
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /two-factor/status:
 *   get:
 *     summary: Get 2FA status
 *     description: Get the current 2FA status for the authenticated user
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: 2FA status retrieved successfully
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
 *                   example: "2FA status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                       description: Whether 2FA is enabled
 *                     verified:
 *                       type: boolean
 *                       description: Whether 2FA setup is completed
 *                     hasBackupCodes:
 *                       type: boolean
 *                       description: Whether backup codes are available
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */ 