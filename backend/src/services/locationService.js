const prisma = require('../config/prisma');

const createLocation = async (data, clinicId) => {
  return prisma.location.create({
    data: {
      clinicId,
      name: data.name,
      address: data.address,
      timezone: data.timezone,
    },
  });
};

const getLocations = async (where) => {
  return prisma.location.findMany({
    where: { ...where, isActive: true },
    orderBy: { name: 'asc' },
  });
};

module.exports = {
  createLocation,
  getLocations,
};
