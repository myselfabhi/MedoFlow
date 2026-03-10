import { Request, Response, NextFunction } from 'express';
import * as staffService from '../services/staffService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const listFrontDesk = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const staff = await staffService.listFrontDeskStaff(req.clinicId!);
    successResponse(res, 200, 'Front desk staff retrieved', { staff });
  }
);

export const createFrontDesk = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const user = await staffService.provisionFrontDeskUser(
      req.body,
      req.clinicId!,
      req.user!.id
    );
    successResponse(res, 201, 'Front desk user invited', { user });
  }
);
