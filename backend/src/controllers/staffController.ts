import { Request, Response, NextFunction } from 'express';
import * as staffService from '../services/staffService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { frontDeskProvisionSchema, providerCreateSchema } from '../validation/module1Schemas';

export const listAllStaff = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const staff = await staffService.listStaff(req.clinicId!);
    successResponse(res, 200, 'Staff retrieved', { staff });
  }
);

export const deactivateStaff = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const user = await staffService.deactivateStaffUser(
      id,
      req.clinicId!,
      req.user!.id
    );
    successResponse(res, 200, 'Staff user deactivated', { user });
  }
);

export const listFrontDesk = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const staff = await staffService.listFrontDeskStaff(req.clinicId!);
    successResponse(res, 200, 'Front desk staff retrieved', { staff });
  }
);

export const createStaff = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { role } = req.body;
    
    if (role === 'FRONT_DESK') {
      const validatedData = frontDeskProvisionSchema.body.parse(req.body);
      const user = await staffService.provisionFrontDeskUser(
        validatedData,
        req.clinicId!,
        req.user!.id
      );
      successResponse(res, 201, 'Front desk user invited', { user });
    } else if (role === 'PROVIDER') {
      const validatedData = providerCreateSchema.body.parse(req.body);
      const { createProvider } = await import('../services/providerService');
      const provider = await createProvider(
        validatedData,
        req.clinicId!,
        req.user!.id
      );
      successResponse(res, 201, 'Provider invited', { provider });
    } else {
      res.status(400).json({ success: false, message: 'Invalid role for staff creation' });
    }
  }
);
