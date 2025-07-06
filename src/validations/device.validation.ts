import Joi from 'joi';

export const updateDeviceName = {
  body: Joi.object().keys({
    deviceName: Joi.string().min(1).max(100).required(),
  }),
};

export default {
  updateDeviceName,
}; 