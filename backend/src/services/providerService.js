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

  const hasServices = data.serviceIds && Array.isArray(data.serviceIds) && data.serviceIds.length > 0;

  const provider = await prisma.provider.create({
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

  if (hasServices) {
    for (const serviceId of data.serviceIds) {
      await validateServiceBelongsToClinic(serviceId, clinicId);
      await prisma.providerService.create({
        data: { providerId: provider.id, serviceId },
      });
    }
    return prisma.provider.findUnique({
      where: { id: provider.id },
      include: {
        discipline: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        providerServices: {
          include: { service: { include: { discipline: { select: { id: true, name: true } } } } },
        },
      },
    });
  }

  return provider;
};

const getProviders = async (where) => {
  return prisma.provider.findMany({
    where: { ...where, isActive: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      discipline: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
      providerServices: {
        include: { service: { select: { id: true, name: true, defaultPrice: true } } },
      },
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

const validateServiceBelongsToClinic = async (serviceId, clinicId) => {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, clinicId, isActive: true },
  });
  if (!service) {
    const err = new Error('Service not found or does not belong to this clinic');
    err.statusCode = 404;
    throw err;
  }
  return service;
};

const addProviderService = async (providerId, serviceId, priceOverride, clinicId) => {
  const provider = await getProviderById(providerId, { clinicId });
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }
  await validateServiceBelongsToClinic(serviceId, clinicId);

  const existing = await prisma.providerService.findFirst({
    where: { providerId, serviceId },
  });
  if (existing) {
    const err = new Error('Provider already has this service assigned');
    err.statusCode = 409;
    throw err;
  }

  return prisma.providerService.create({
    data: {
      providerId,
      serviceId,
      priceOverride: priceOverride ?? null,
    },
    include: {
      service: {
        include: { discipline: { select: { id: true, name: true } } },
      },
    },
  });
};

const updateProviderService = async (providerId, serviceId, priceOverride, clinicId) => {
  const provider = await getProviderById(providerId, { clinicId });
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }
  await validateServiceBelongsToClinic(serviceId, clinicId);

  const existing = await prisma.providerService.findFirst({
    where: { providerId, serviceId },
  });
  if (!existing) {
    const err = new Error('Provider service assignment not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.providerService.update({
    where: { id: existing.id },
    data: { priceOverride: priceOverride ?? null },
    include: {
      service: {
        include: { discipline: { select: { id: true, name: true } } },
      },
    },
  });
};

const removeProviderService = async (providerId, serviceId, clinicId) => {
  const provider = await getProviderById(providerId, { clinicId });
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }

  const count = await prisma.providerService.count({
    where: { providerId },
  });
  if (count <= 1) {
    const err = new Error('Provider must have at least one service');
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.providerService.findFirst({
    where: { providerId, serviceId },
  });
  if (!existing) {
    const err = new Error('Provider service assignment not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.providerService.delete({
    where: { id: existing.id },
  });
};

const getProviderServices = async (providerId, clinicId) => {
  const provider = await getProviderById(providerId, { clinicId });
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.providerService.findMany({
    where: { providerId },
    include: {
      service: {
        include: { discipline: { select: { id: true, name: true } } },
      },
    },
  });
};

module.exports = {
  createProvider,
  getProviders,
  getProviderById,
  updateProvider,
  softDeleteProvider,
  addProviderService,
  updateProviderService,
  removeProviderService,
  getProviderServices,
};
