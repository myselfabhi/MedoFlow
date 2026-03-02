const prisma = require('../config/prisma');

const validateDisciplineBelongsToClinic = async (disciplineId, clinicId) => {
  const discipline = await prisma.discipline.findFirst({
    where: { id: disciplineId, clinicId },
  });
  if (!discipline) {
    const err = new Error('Discipline not found or does not belong to this clinic');
    err.statusCode = 404;
    throw err;
  }
  return discipline;
};

const validateUserBelongsToClinic = async (userId, clinicId) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, clinicId },
  });
  if (!user) {
    const err = new Error('User not found or does not belong to this clinic');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const checkDuplicateProviderUserLink = async (userId) => {
  const existing = await prisma.provider.findFirst({
    where: { userId },
  });
  if (existing) {
    const err = new Error('User is already linked to another provider');
    err.statusCode = 409;
    throw err;
  }
};

const createProvider = async (data, clinicId) => {
  await validateDisciplineBelongsToClinic(data.disciplineId, clinicId);

  if (data.userId) {
    await validateUserBelongsToClinic(data.userId, clinicId);
    await checkDuplicateProviderUserLink(data.userId);
  }

  return prisma.provider.create({
    data: {
      clinicId,
      userId: data.userId || null,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      disciplineId: data.disciplineId,
    },
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

const getProviders = async (where) => {
  return prisma.provider.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

const getProviderById = async (id, where = {}) => {
  return prisma.provider.findFirst({
    where: { id, ...where },
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

const updateProvider = async (id, data, where) => {
  const provider = await getProviderById(id, where);
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.disciplineId) {
    await validateDisciplineBelongsToClinic(data.disciplineId, where.clinicId);
  }

  if (data.userId !== undefined) {
    if (data.userId) {
      await validateUserBelongsToClinic(data.userId, where.clinicId);
      if (data.userId !== provider.userId) {
        await checkDuplicateProviderUserLink(data.userId);
      }
    }
  }

  return prisma.provider.update({
    where: { id },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.disciplineId && { disciplineId: data.disciplineId }),
      ...(data.userId !== undefined && { userId: data.userId || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

const softDeleteProvider = async (id, where) => {
  const provider = await getProviderById(id, where);
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.provider.update({
    where: { id },
    data: { isActive: false },
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

module.exports = {
  createProvider,
  getProviders,
  getProviderById,
  updateProvider,
  softDeleteProvider,
};
