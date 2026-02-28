const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const clinicService = require('./clinicService');

const VALID_ROLES = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'PROVIDER', 'STAFF'];

const validateRegistration = (body, creatorRole) => {
  const { name, email, password, role, clinicId, clinicName, clinicEmail } = body;

  if (!name || !email || !password) {
    const err = new Error('Name, email, and password are required');
    err.statusCode = 400;
    throw err;
  }

  const roleToUse = role && VALID_ROLES.includes(role) ? role : 'STAFF';

  if (roleToUse === 'CLINIC_ADMIN') {
    if (!clinicName || !clinicEmail) {
      const err = new Error('Clinic name and email are required for CLINIC_ADMIN registration');
      err.statusCode = 400;
      throw err;
    }
  }

  if (roleToUse === 'PROVIDER' || roleToUse === 'STAFF') {
    if (!clinicId) {
      const err = new Error('Clinic ID is required for PROVIDER and STAFF roles');
      err.statusCode = 400;
      throw err;
    }
  }

  if (roleToUse === 'SUPER_ADMIN' && creatorRole !== 'SUPER_ADMIN') {
    const err = new Error('Only SUPER_ADMIN can create SUPER_ADMIN users');
    err.statusCode = 403;
    throw err;
  }

  return { roleToUse, clinicId, clinicName, clinicEmail };
};

const registerUser = async (body, creator = null) => {
  const creatorRole = creator?.role || null;
  const { roleToUse, clinicId, clinicName, clinicEmail } = validateRegistration(body, creatorRole);

  const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
  if (existingUser) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);

  let resolvedClinicId = null;

  if (roleToUse === 'CLINIC_ADMIN') {
    const clinic = await clinicService.createClinic({
      name: clinicName,
      email: clinicEmail,
    });
    resolvedClinicId = clinic.id;
  } else if (roleToUse === 'PROVIDER' || roleToUse === 'STAFF') {
    const exists = await clinicService.clinicExists(clinicId);
    if (!exists) {
      const err = new Error('Clinic not found');
      err.statusCode = 404;
      throw err;
    }
    resolvedClinicId = clinicId;
  } else if (roleToUse === 'SUPER_ADMIN' && body.clinicId && creatorRole === 'SUPER_ADMIN') {
    const exists = await clinicService.clinicExists(body.clinicId);
    if (!exists) {
      const err = new Error('Clinic not found');
      err.statusCode = 404;
      throw err;
    }
    resolvedClinicId = body.clinicId;
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: roleToUse,
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

  return user;
};

module.exports = {
  registerUser,
  validateRegistration,
};
