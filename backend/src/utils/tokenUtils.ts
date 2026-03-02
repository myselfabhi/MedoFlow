import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface TokenPayload {
  userId: string;
  clinicId?: string | null;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    { userId: payload.userId, clinicId: payload.clinicId, role: payload.role },
    process.env.JWT_SECRET as string,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getRefreshTokenExpiry = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return date;
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
};
