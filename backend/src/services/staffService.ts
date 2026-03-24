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

export const listStaff = async (clinicId: string) => {
  return prisma.user.findMany({
    where: {
      clinicId,
      role: { in: ['SUPER_ADMIN', 'FRONT_DESK', 'ACCOUNTING', 'MARKETING'] },
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      isActive: true,
      createdAt: true,
      provider: { select: { id: true } },
    },
  });
};

export const deactivateStaffUser = async (
  userId: string,
  clinicId: string,
  performedById: string
) => {
  const userToDeactivate = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, clinicId: true, role: true },
  });

  if (!userToDeactivate || userToDeactivate.clinicId !== clinicId) {
    const err = new Error('User not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  // PRD: Protection against removing the last Super Admin
  if (userToDeactivate.role === 'SUPER_ADMIN') {
    const adminCount = await prisma.user.count({
      where: {
        clinicId,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    if (adminCount <= 1) {
      const err = new Error(
        'Cannot deactivate the last remaining Super Admin. Assign another Super Admin first.'
      ) as ApiError;
      err.statusCode = 400;
      throw err;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'User',
    entityId: userId,
    action: 'DEACTIVATE',
    fieldChanged: 'isActive',
    oldValue: true,
    newValue: false,
    performedById,
  });

  return updatedUser;
};

export const updateStaffUser = async (
  userId: string,
  data: { role?: string; permissions?: object },
  clinicId: string,
  performedById: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, clinicId: true, role: true, name: true },
  });

  if (!user || user.clinicId !== clinicId) {
    const err = new Error('User not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  // Prevent removing the last Super Admin
  if (user.role === 'SUPER_ADMIN' && data.role && data.role !== 'SUPER_ADMIN') {
    const adminCount = await prisma.user.count({
      where: { clinicId, role: 'SUPER_ADMIN', isActive: true },
    });
    if (adminCount <= 1) {
      const err = new Error(
        'Cannot change role of the last remaining Super Admin.'
      ) as ApiError;
      err.statusCode = 400;
      throw err;
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.role ? { role: data.role as any } : {}),
      ...(data.permissions !== undefined ? { permissions: data.permissions as any } : {}),
    },
    select: { id: true, name: true, email: true, role: true, permissions: true, isActive: true, createdAt: true },
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'User',
    entityId: userId,
    action: 'UPDATE',
    fieldChanged: 'role/permissions',
    oldValue: user.role,
    newValue: data.role ?? user.role,
    performedById,
  });

  return updated;
};

export const linkAdminAsProvider = async (
  userId: string,
  clinicId: string,
  performedById: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, clinicId: true, role: true, name: true, provider: { select: { id: true } } },
  });

  if (!user || user.clinicId !== clinicId) {
    const err = new Error('User not found') as ApiError;
    err.statusCode = 404;
    throw err;
  }

  if (user.provider) {
    // Already has a provider profile — just return it
    return user.provider;
  }

  // Split name into first/last
  const nameParts = (user.name ?? '').trim().split(' ');
  const firstName = nameParts[0] ?? user.name;
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const provider = await prisma.provider.create({
    data: {
      firstName,
      lastName,
      clinicId,
      userId,
    },
    select: { id: true, firstName: true, lastName: true, userId: true },
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'Provider',
    entityId: provider.id,
    action: 'CREATE',
    fieldChanged: 'userId',
    oldValue: null,
    newValue: userId,
    performedById,
  });

  return provider;
};

export const provisionFrontDeskUser = async (
  data: { name: string; email: string; role?: string; permissions?: object },
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

  const allowedNonProviderRoles = ['FRONT_DESK', 'ACCOUNTING', 'MARKETING'];
  const assignedRole = data.role && allowedNonProviderRoles.includes(data.role)
    ? (data.role as any)
    : 'FRONT_DESK';

  const password = await bcrypt.hash(PLACEHOLDER_PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      password,
      role: assignedRole,
      clinicId,
      ...(data.permissions ? { permissions: data.permissions as any } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
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

  const roleLabels: Record<string, string> = {
    FRONT_DESK: 'Front Desk',
    ACCOUNTING: 'Accounting',
    MARKETING: 'Marketing',
  };

  await emailService.sendStaffInviteEmail({
    to: email,
    name: user.name,
    setupLink,
    roleLabel: roleLabels[user.role] ?? 'Staff',
  });

  await auditService.logAudit({
    clinicId,
    entityType: 'User',
    entityId: user.id,
    action: 'CREATE',
    fieldChanged: 'role',
    oldValue: null,
    newValue: user.role,
    performedById,
  });

  return user;
};
