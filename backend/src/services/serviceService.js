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

const createService = async (data, clinicId) => {
  await validateDisciplineBelongsToClinic(data.disciplineId, clinicId);

  const existing = await prisma.service.findFirst({
    where: { clinicId, name: data.name },
  });
  if (existing) {
    const err = new Error('Service with this name already exists in this clinic');
    err.statusCode = 409;
    throw err;
  }

  return prisma.service.create({
    data: {
      clinicId,
      disciplineId: data.disciplineId,
      name: data.name,
      duration: data.duration,
      defaultPrice: data.defaultPrice,
      taxApplicable: data.taxApplicable ?? false,
    },
    include: {
      discipline: { select: { id: true, name: true } },
    },
  });
};

const getServices = async (where) => {
  return prisma.service.findMany({
    where: { ...where, isActive: true },
    orderBy: { name: 'asc' },
    include: {
      discipline: { select: { id: true, name: true } },
      _count: { select: { providerServices: true } },
    },
  });
};

const getServiceById = async (id, where = {}) => {
  return prisma.service.findFirst({
    where: { id, ...where },
    include: {
      discipline: { select: { id: true, name: true } },
    },
  });
};

const updateService = async (id, data, where) => {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  const clinicId = where.clinicId ?? service.clinicId;

  if (data.name) {
    const existing = await prisma.service.findFirst({
      where: {
        clinicId,
        name: data.name,
        NOT: { id },
      },
    });
    if (existing) {
      const err = new Error('Service with this name already exists in this clinic');
      err.statusCode = 409;
      throw err;
    }
  }

  if (data.disciplineId) {
    await validateDisciplineBelongsToClinic(data.disciplineId, clinicId);
  }

  return prisma.service.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.defaultPrice !== undefined && { defaultPrice: data.defaultPrice }),
      ...(data.taxApplicable !== undefined && { taxApplicable: data.taxApplicable }),
      ...(data.disciplineId && { disciplineId: data.disciplineId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      discipline: { select: { id: true, name: true } },
    },
  });
};

const archiveService = async (id, where) => {
  const service = await getServiceById(id, where);
  if (!service) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  return prisma.service.update({
    where: { id },
    data: { isActive: false },
    include: {
      discipline: { select: { id: true, name: true } },
    },
  });
};

module.exports = {
  createService,
  getServices,
  getServiceById,
  updateService,
  archiveService,
};
