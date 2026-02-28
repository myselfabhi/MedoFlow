const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} = require('../utils/tokenUtils');

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
};

const register = asyncHandler(async (req, res) => {
  const creator = req.user?.role === 'SUPER_ADMIN' ? req.user : null;
  const user = await authService.registerUser(req.body, creator);
  successResponse(res, 201, 'Registration successful', { user });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account is deactivated');
    err.statusCode = 403;
    throw err;
  }

  const hashedPassword = await bcrypt.compare(password, user.password);
  if (!hashedPassword) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    clinicId: user.clinicId,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  setRefreshTokenCookie(res, refreshToken);

  successResponse(res, 200, 'Login successful', {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!token) {
    const err = new Error('Refresh token required');
    err.statusCode = 401;
    throw err;
  }

  const hashedToken = hashToken(token);

  const storedToken = await prisma.refreshToken.findFirst({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!storedToken) {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  if (storedToken.revoked) {
    const err = new Error('Refresh token has been revoked');
    err.statusCode = 401;
    throw err;
  }

  if (new Date() > storedToken.expiresAt) {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });
    const err = new Error('Refresh token expired');
    err.statusCode = 401;
    throw err;
  }

  if (!storedToken.user.isActive) {
    const err = new Error('Account is deactivated');
    err.statusCode = 403;
    throw err;
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  const newRefreshToken = generateRefreshToken();
  const hashedNewRefreshToken = hashToken(newRefreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.userId,
      token: hashedNewRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  setRefreshTokenCookie(res, newRefreshToken);

  const accessToken = generateAccessToken({
    userId: storedToken.user.id,
    clinicId: storedToken.user.clinicId,
    role: storedToken.user.role,
  });

  successResponse(res, 200, 'Token refreshed', { accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (token) {
    const hashedToken = hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { revoked: true },
    });
  }

  clearRefreshTokenCookie(res);
  successResponse(res, 200, 'Logged out successfully');
});

const me = asyncHandler(async (req, res) => {
  successResponse(res, 200, 'User retrieved', { user: req.user });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  me,
};
