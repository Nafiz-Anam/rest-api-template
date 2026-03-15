import Joi from 'joi';
import { IPSecurityRuleType } from '@prisma/client';

const createIPRule = Joi.object({
  ipAddress: Joi.string().ip().required().messages({
    'string.ip': 'Invalid IP address format',
    'any.required': 'IP address is required',
  }),
  cidrRange: Joi.string().ip().optional().messages({
    'string.ip': 'Invalid CIDR range format',
  }),
  ruleType: Joi.string()
    .valid(...Object.values(IPSecurityRuleType))
    .required()
    .messages({
      'any.only': 'Invalid rule type. Must be WHITELIST, BLACKLIST, or SUSPICIOUS',
      'any.required': 'Rule type is required',
    }),
  reason: Joi.string().optional().max(500).messages({
    'string.max': 'Reason cannot exceed 500 characters',
  }),
});

const updateIPRule = Joi.object({
  ipAddress: Joi.string().ip().optional().messages({
    'string.ip': 'Invalid IP address format',
  }),
  cidrRange: Joi.string().ip().optional().messages({
    'string.ip': 'Invalid CIDR range format',
  }),
  ruleType: Joi.string()
    .valid(...Object.values(IPSecurityRuleType))
    .optional()
    .messages({
      'any.only': 'Invalid rule type. Must be WHITELIST, BLACKLIST, or SUSPICIOUS',
    }),
  reason: Joi.string().optional().max(500).messages({
    'string.max': 'Reason cannot exceed 500 characters',
  }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
});

const getIPRules = Joi.object({
  ruleType: Joi.string()
    .valid(...Object.values(IPSecurityRuleType))
    .optional()
    .messages({
      'any.only': 'Invalid rule type. Must be WHITELIST, BLACKLIST, or SUSPICIOUS',
    }),
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean',
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

export const ipSecurityValidation = {
  createIPRule,
  updateIPRule,
  getIPRules,
};
