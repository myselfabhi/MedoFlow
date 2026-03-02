const prisma = require('../config/prisma');

const createDiscipline = async (data, clinicId) => {
  const existing = await prisma.discipline.findFirst({
    where: { clinicId, name: data.name },
  });
  if (existing) {
    const err = new Error('Discipline with this name already exists in this clinic');
    err.statusCode = 409;
    throw err;
  }
  return prisma.discipline.create({
    data: {
      clinicId,
      name: data.name,
      description: data.description,
    },
  });
};

const getDisciplines = async (where) => {
  return prisma.discipline.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { providers: true } } },
  });
};

const getDisciplineById = async (id, where = {}) => {
  return prisma.discipline.findFirst({
    where: { id, ...where },
  });
};

const updateDiscipline = async (id, data, where) => {
  const discipline = await prisma.discipline.findUnique({ where: { id } });
  if (!discipline) {
    const err = new Error('Discipline not found');
    err.statusCode = 404;
    throw err;
  }
  const clinicId = where.clinicId ?? discipline.clinicId;
  if (data.name) {
    const existing = await prisma.discipline.findFirst({
      where: {
        clinicId,
        name: data.name,
        NOT: { id },
      },
    });
    if (existing) {
      const err = new Error('Discipline with this name already exists in this clinic');
      err.statusCode = 409;
      throw err;
    }
  }
  return prisma.discipline.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
};

const deleteDiscipline = async (id, where) => {
  return prisma.discipline.delete({
    where: { id },
  });
};

module.exports = {
  createDiscipline,
  getDisciplines,
  getDisciplineById,
  updateDiscipline,
  deleteDiscipline,
};
