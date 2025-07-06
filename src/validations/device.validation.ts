import Joi from 'joi';

const trustDevice = {
  params: Joi.object().keys({
    deviceId: Joi.string().required(),
  }),
};

const removeDevice = {
  params: Joi.object().keys({
    deviceId: Joi.string().required(),
  }),
};

const removeAllOtherDevices = {
  body: Joi.object().keys({
    currentDeviceId: Joi.string().required(),
  }),
};

export default {
  trustDevice,
  removeDevice,
  removeAllOtherDevices,
}; 