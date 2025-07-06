import Joi from 'joi';

export const enable = {
  body: Joi.object().keys({
    token: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  }),
};

export const disable = {
  body: Joi.object().keys({
    token: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  }),
};

export const regenerateBackupCodes = {
  body: Joi.object().keys({
    token: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  }),
};

export const verifyTwoFactor = {
  body: Joi.object().keys({
    userId: Joi.number().integer().positive().required(),
    token: Joi.string().min(6).max(8).required(),
  }),
};

export default {
  enable,
  disable,
  regenerateBackupCodes,
  verifyTwoFactor,
}; 