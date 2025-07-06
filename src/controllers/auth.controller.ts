import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import { authService, userService, tokenService, emailService } from '../services';
import securityService from '../services/security.service';
import exclude from '../utils/exclude';
import { User } from '@prisma/client';

const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  const user = await userService.createUser(email, password, name);
  const userWithoutPassword = exclude(user, ['password', 'createdAt', 'updatedAt']);
  const tokens = await tokenService.generateAuthTokens(user, req);

  // Log registration event
  await securityService.logRegistration(user, req);

  res.status(httpStatus.CREATED).send({
    user: userWithoutPassword,
    tokens,
    message: 'User registered successfully',
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUserWithEmailAndPassword(email, password, req);
  
  // Check if 2FA is required
  if ('requiresTwoFactor' in result) {
    res.status(httpStatus.OK).send({
      requiresTwoFactor: true,
      userId: result.userId,
      message: '2FA token required',
    });
    return;
  }
  
  const tokens = await tokenService.generateAuthTokens(result, req);

  res.send({
    user: result,
    tokens,
    message: 'Login successful',
  });
});

const verifyTwoFactor = catchAsync(async (req, res) => {
  const { userId, token } = req.body;
  const user = await authService.completeLoginWithTwoFactor(userId, token, req);
  const tokens = await tokenService.generateAuthTokens(user, req);

  res.send({
    user,
    tokens,
    message: 'Login successful',
  });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken, req);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);

  // Log password reset request
  await securityService.logPasswordResetRequest(req.body.email, req);

  res.status(httpStatus.OK).send({
    message: 'Password reset email sent',
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password, req);
  res.status(httpStatus.OK).send({
    message: 'Password reset successful',
  });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user as User;
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  res.status(httpStatus.OK).send({
    message: 'Verification email sent',
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.OK).send({
    message: 'Email verified successfully',
  });
});

export default {
  register,
  login,
  verifyTwoFactor,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
