import Joi from 'joi';

const enableTwoFactor = {
  body: Joi.object().keys({
    token: Joi.string().min(6).max(8).required(),
  }),
};

const disableTwoFactor = {
  body: Joi.object().keys({
    token: Joi.string().min(6).max(8).required(),
  }),
};

const regenerateBackupCodes = {
  body: Joi.object().keys({
    token: Joi.string().min(6).max(8).required(),
  }),
};

const verifyToken = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    token: Joi.string().min(6).max(8).required(),
  }),
};

export default {
  enableTwoFactor,
  disableTwoFactor,
  regenerateBackupCodes,
  verifyToken,
};
