import prisma from '../config/prisma';

export interface CreateLocationData {
  name: string;
  address?: string;
  timezone: string;
}

type ClinicWhere = { clinicId?: string } | Record<string, never>;

export const createLocation = async (
  data: CreateLocationData,
  clinicId: string
) => {
  return prisma.location.create({
    data: {
      clinicId,
      name: data.name,
      address: data.address,
      timezone: data.timezone,
    },
  });
};

export const getLocations = async (where: ClinicWhere) => {
  const whereClause = Object.keys(where).length === 0 ? { isActive: true } : { ...where, isActive: true };
  return prisma.location.findMany({
    where: whereClause as { isActive: boolean; clinicId?: string },
    orderBy: { name: 'asc' },
  });
};
