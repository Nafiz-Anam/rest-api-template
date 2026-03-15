import { PrismaClient, OtpType } from '@prisma/client';
import moment from 'moment';
import prisma from '../client';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

export async function createEmailVerificationOtp(userId: string) {
  const otp = generateOtp();
  const expiresAt = moment().add(OTP_EXPIRY_MINUTES, 'minutes').toDate();
  await prisma.otp.create({
    data: {
      userId,
      otp,
      type: OtpType.EMAIL_VERIFICATION,
      expiresAt,
      consumed: false,
    },
  });
  return otp;
}

export async function verifyEmailOtp(userId: string, otp: string) {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      userId,
      otp,
      type: OtpType.EMAIL_VERIFICATION,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
  });
  if (!otpRecord) return false;
  await prisma.otp.update({ where: { id: otpRecord.id }, data: { consumed: true } });
  return true;
}

export async function createPasswordResetOtp(userId: string) {
  const otp = generateOtp();
  const expiresAt = moment().add(OTP_EXPIRY_MINUTES, 'minutes').toDate();
  await prisma.otp.create({
    data: {
      userId,
      otp,
      type: OtpType.PASSWORD_RESET,
      expiresAt,
      consumed: false,
    },
  });
  return otp;
}

export async function verifyPasswordResetOtp(userId: string, otp: string) {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      userId,
      otp,
      type: OtpType.PASSWORD_RESET,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
  });
  if (!otpRecord) return false;
  await prisma.otp.update({ where: { id: otpRecord.id }, data: { consumed: true } });
  return true;
}

export async function createPasswordResetOtpByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (!user) {
    // For security, don't reveal if email exists or not
    // But still return a fake OTP to prevent timing attacks
    return generateOtp();
  }

  return await createPasswordResetOtp(user.id);
}

export async function verifyPasswordResetOtpByEmail(email: string, otp: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return false;

  return await verifyPasswordResetOtp(user.id, otp);
}
