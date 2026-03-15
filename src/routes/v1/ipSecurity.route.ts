import express from 'express';
import validate from '../../middlewares/validate';
import { ipSecurityController } from '../../controllers';
import auth from '../../middlewares/auth';
import { ipSecurityValidation } from '../../validations';

const router = express.Router();

/**
 * @route POST /v1/ip-security/rules
 * @desc Create IP security rule
 * @access Private (Admin)
 */
router.post(
  '/rules',
  auth('manageUsers'),
  validate(ipSecurityValidation.createIPRule),
  ipSecurityController.createIPRule
);

/**
 * @route GET /v1/ip-security/rules
 * @desc Get all IP security rules
 * @access Private (Admin)
 */
router.get(
  '/rules',
  auth('manageUsers'),
  ipSecurityController.getIPRules
);

/**
 * @route PUT /v1/ip-security/rules/:id
 * @desc Update IP security rule
 * @access Private (Admin)
 */
router.put(
  '/rules/:id',
  auth('manageUsers'),
  validate(ipSecurityValidation.updateIPRule),
  ipSecurityController.updateIPRule
);

/**
 * @route DELETE /v1/ip-security/rules/:id
 * @desc Delete IP security rule
 * @access Private (Admin)
 */
router.delete(
  '/rules/:id',
  auth('manageUsers'),
  ipSecurityController.deleteIPRule
);

/**
 * @route GET /v1/ip-security/stats
 * @desc Get IP security statistics
 * @access Private (Admin)
 */
router.get(
  '/stats',
  auth('manageUsers'),
  ipSecurityController.getIPStats
);

/**
 * @route POST /v1/ip-security/clear-cache
 * @desc Clear IP security cache
 * @access Private (Admin)
 */
router.post(
  '/clear-cache',
  auth('manageUsers'),
  ipSecurityController.clearIPCache
);

export default router;
