import { Request, Response, NextFunction } from 'express';
import * as packageUsageService from '../services/packageUsageService';
import prisma from '../config/prisma';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getMyPackages = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const patientId = req.user!.id;
    const packages = await packageUsageService.getAvailablePatientPackages(clinicId, patientId);
    successResponse(res, 200, 'Patient packages retrieved', { packages });
  }
);

export const listClinicPatients = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const memberships = await prisma.patientClinicMembership.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        patient: {
          name: 'asc',
        },
      },
    });
    const patients = memberships.map((membership) => membership.patient);
    successResponse(res, 200, 'Patients retrieved', { patients });
  }
);
