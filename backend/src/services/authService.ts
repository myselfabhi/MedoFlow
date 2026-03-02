import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import * as clinicService from './clinicService';
import { ApiError } from '../types/errors';

const VALID_ROLES = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'PROVIDER', 'STAFF', 'PATIENT'] as const;

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role?: string;
  clinicId?: string;
  clinicName?: string;
  clinicEmail?: string;
}

interface Creator {
  role?: string;
}

interface ValidateResult {
  roleToUse: string;
  clinicId: string | null | undefined;
  clinicName?: string;
  clinicEmail?: string;
}

const validateRegistration = (
  body: RegisterBody,
  creatorRole: string | null
): ValidateResult => {
  const { name, email, password, role, clinicId, clinicName, clinicEmail } =
    body;

  if (!name || !email || !password) {
    const err = new Error('Name, email, and password are required') as ApiError;
    err.statusCode = 400;
    throw err;
  }

  const roleToUse =
    role && VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])
      ? role
      : 'STAFF';

  if (roleToUse === 'CLINIC_ADMIN') {
    if (!clinicName || !clinicEmail) {
      const err = new Error(
        'Clinic name and email are required for CLINIC_ADMIN registration'
      ) as ApiError;
      err.statusCode = 400;
      throw err;
    }
  }

  if (roleToUse === 'PROVIDER' || roleToUse === 'STAFF') {
    if (!clinicId) {
      const err = new Error(
        'Clinic ID is required for PROVIDER and STAFF roles'
      ) as ApiError;
      err.statusCode = 400;
      throw err;
    }
  }

  if (roleToUse === 'SUPER_ADMIN' && creatorRole !== 'SUPER_ADMIN') {
    const err = new Error('Only SUPER_ADMIN can create SUPER_ADMIN users') as ApiError;
    err.statusCode = 403;
    throw err;
  }

  return { roleToUse, clinicId, clinicName, clinicEmail };
};

export const registerUser = async (
  body: RegisterBody,
  creator: Creator | null = null
) => {
  const creatorRole = creator?.role || null;
  const { roleToUse, clinicId, clinicName, clinicEmail } = validateRegistration(
    body,
    creatorRole
  );

  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existingUser) {
    const err = new Error('Email already registered') as ApiError;
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);

  let resolvedClinicId: string | null = null;

  if (roleToUse === 'CLINIC_ADMIN' && clinicName && clinicEmail) {
    const clinic = await clinicService.createClinic({
      name: clinicName,
      email: clinicEmail,
    });
    resolvedClinicId = clinic.id;
  } else if (roleToUse === 'PROVIDER' || roleToUse === 'STAFF') {
    if (!clinicId) {
      const err = new Error('Clinic not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    const exists = await clinicService.clinicExists(clinicId);
    if (!exists) {
      const err = new Error('Clinic not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    resolvedClinicId = clinicId;
  } else if (
    roleToUse === 'SUPER_ADMIN' &&
    body.clinicId &&
    creatorRole === 'SUPER_ADMIN'
  ) {
    const exists = await clinicService.clinicExists(body.clinicId);
    if (!exists) {
      const err = new Error('Clinic not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    resolvedClinicId = body.clinicId;
  } else if (
    roleToUse === 'PATIENT' &&
    body.clinicId &&
    creatorRole === 'SUPER_ADMIN'
  ) {
    const exists = await clinicService.clinicExists(body.clinicId);
    if (!exists) {
      const err = new Error('Clinic not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    resolvedClinicId = body.clinicId;
  } else if (roleToUse === 'PATIENT') {
    resolvedClinicId = null;
  }

  return prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: roleToUse as 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'PROVIDER' | 'STAFF' | 'PATIENT',
      clinicId: resolvedClinicId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clinicId: true,
      isActive: true,
      createdAt: true,
    },
  });
};
