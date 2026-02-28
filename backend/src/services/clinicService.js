const prisma = require('../config/prisma');

const createClinic = async (data) => {
  return prisma.clinic.create({
    data: {
      name: data.name,
      email: data.email,
      subscriptionPlan: data.subscriptionPlan || 'free',
    },
  });
};

const getClinicById = async (id) => {
  return prisma.clinic.findUnique({
    where: { id },
  });
};

const clinicExists = async (id) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true },
  });
  return !!clinic;
};

module.exports = {
  createClinic,
  getClinicById,
  clinicExists,
};
