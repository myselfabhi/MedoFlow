import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { ApiError } from '../types/errors';
import * as passwordSetupService from './passwordSetupService';
import * as emailService from './emailService';
import * as auditService from './auditService';

const PLACEHOLDER_PASSWORD = 'pending-setup';

export const listFrontDeskStaff = async (clinicId: string) => {
  return prisma.user.findMany({
    where: {
      clinicId,
      role: 'FRONT_DESK',
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};

export const provisionFrontDeskUser = async (
  data: { name: string; email: string },
  clinicId: string,
  performedById: string
) => {
  if (!process.env.SMTP_HOST && process.env.NODE_ENV === 'production') {
    const err = new Error(
      'SMTP is required to invite staff in production'
    ) as ApiError;
    err.statusCode = 500;
    throw err;
  }

  const email = data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    const err = new Error('An account with this email already exists') as ApiError;
    err.statusCode = 409;
    throw err;
  }

  const password = await bcrypt.hash(PLACEHOLDER_PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      password,
      role: 'FRONT_DESK',
      clinicId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const token = await passwordSetupService.createPasswordSetupToken(user.id);
  const frontendUrl = (
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  const setupLink = `${frontendUrl}/set-password?token=${token}`;

  await emailService.sendStaffInviteEmail({
    to: email,
    name: user.name,
    setupLink,
    roleLabel: 'Front Desk',
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'User',
    entityId: user.id,
    action: 'CREATE',
    fieldChanged: 'role',
    oldValue: null,
    newValue: 'FRONT_DESK',
    performedById,
  });

  return user;
};
