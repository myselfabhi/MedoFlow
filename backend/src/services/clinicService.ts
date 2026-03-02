import prisma from '../config/prisma';
import { Clinic } from '@prisma/client';

export interface CreateClinicData {
  name: string;
  email: string;
  subscriptionPlan?: string;
}

export const createClinic = async (
  data: CreateClinicData
): Promise<Clinic> => {
  return prisma.clinic.create({
    data: {
      name: data.name,
      email: data.email,
      subscriptionPlan: data.subscriptionPlan || 'free',
    },
  });
};

export const getClinicById = async (id: string) => {
  return prisma.clinic.findUnique({
    where: { id },
  });
};

export const clinicExists = async (id: string): Promise<boolean> => {
  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true },
  });
  return !!clinic;
};
