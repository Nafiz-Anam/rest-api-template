import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../config/logger';

const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: false, // Default to false for most SMTP servers
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass,
  },
});

/**
 * Send email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  const msg = { from: config.email.from, to, subject, text, html };
  await transporter.sendMail(msg);
  logger.info(`Email sent to ${to}`);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to: string, token: string, name: string) => {
  const resetPasswordUrl = `${config.clientUrl || 'http://localhost:3000'}/reset-password?token=${token}`;
  const subject = 'Reset password';
  const text = `Dear ${name},
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  const html = `<div>Dear ${name},<br><br>To reset your password, click on this link: <a href="${resetPasswordUrl}">Reset Password</a><br><br>If you did not request any password resets, then ignore this email.</div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise}
 */
const sendVerificationEmail = async (to: string, token: string, name: string) => {
  const verificationEmailUrl = `${config.clientUrl || 'http://localhost:3000'}/verify-email?token=${token}`;
  const subject = 'Email Verification';
  const text = `Dear ${name},
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  const html = `<div>Dear ${name},<br><br>To verify your email, click on this link: <a href="${verificationEmailUrl}">Verify Email</a><br><br>If you did not create an account, then ignore this email.</div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send welcome email
 * @param {string} to
 * @param {string} name
 * @returns {Promise}
 */
const sendWelcomeEmail = async (to: string, name: string) => {
  const subject = 'Welcome to our platform';
  const text = `Dear ${name},
Welcome to our platform! We're excited to have you on board.`;
  const html = `<div>Dear ${name},<br><br>Welcome to our platform! We're excited to have you on board.</div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send login alert email
 * @param {string} to
 * @param {Object} loginData
 * @returns {Promise}
 */
const sendLoginAlertEmail = async (to: string, loginData: {
  deviceName: string;
  location?: string;
  ipAddress?: string;
  browser?: string;
  os?: string;
}) => {
  const subject = 'New Login Detected';
  const text = `A new login was detected on your account.
Device: ${loginData.deviceName}
${loginData.location ? `Location: ${loginData.location}` : ''}
${loginData.ipAddress ? `IP Address: ${loginData.ipAddress}` : ''}
${loginData.browser ? `Browser: ${loginData.browser}` : ''}
${loginData.os ? `OS: ${loginData.os}` : ''}

If this wasn't you, please secure your account immediately.`;
  
  const html = `<div>
    <h3>New Login Detected</h3>
    <p>A new login was detected on your account.</p>
    <p><strong>Device:</strong> ${loginData.deviceName}</p>
    ${loginData.location ? `<p><strong>Location:</strong> ${loginData.location}</p>` : ''}
    ${loginData.ipAddress ? `<p><strong>IP Address:</strong> ${loginData.ipAddress}</p>` : ''}
    ${loginData.browser ? `<p><strong>Browser:</strong> ${loginData.browser}</p>` : ''}
    ${loginData.os ? `<p><strong>OS:</strong> ${loginData.os}</p>` : ''}
    <p>If this wasn't you, please secure your account immediately.</p>
  </div>`;
  
  await sendEmail(to, subject, text, html);
};

/**
 * Send account lockout email
 * @param {string} to
 * @param {string} name
 * @param {Object} lockoutData
 * @returns {Promise}
 */
const sendAccountLockoutEmail = async (to: string, name: string, lockoutData: {
  reason: string;
  lockoutUntil?: Date;
  failedAttempts: number;
}) => {
  const subject = 'Account Locked';
  const text = `Dear ${name},
Your account has been locked due to ${lockoutData.reason}.
Failed login attempts: ${lockoutData.failedAttempts}
${lockoutData.lockoutUntil ? `Lockout until: ${lockoutData.lockoutUntil}` : ''}

Please contact support if you need assistance.`;
  
  const html = `<div>
    <h3>Account Locked</h3>
    <p>Dear ${name},</p>
    <p>Your account has been locked due to ${lockoutData.reason}.</p>
    <p><strong>Failed login attempts:</strong> ${lockoutData.failedAttempts}</p>
    ${lockoutData.lockoutUntil ? `<p><strong>Lockout until:</strong> ${lockoutData.lockoutUntil}</p>` : ''}
    <p>Please contact support if you need assistance.</p>
  </div>`;
  
  await sendEmail(to, subject, text, html);
};

export default {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendAccountLockoutEmail,
  transporter,
};
