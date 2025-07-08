import { PrismaClient, OtpType } from '@prisma/client';
import moment from 'moment';
import crypto from 'crypto';

const prisma = new PrismaClient();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString(); // 6-digit
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
