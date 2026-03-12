import { Request, Response, NextFunction } from 'express';
import * as packageService from '../services/packageService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getAll = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.user!.clinicId!;
    const packages = await packageService.getPackages(clinicId);
    successResponse(res, 200, 'Packages retrieved successfully', { packages });
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.user!.clinicId!;
    const id = req.params.id as string;
    const pkg = await packageService.getPackageById(id, clinicId);
    successResponse(res, 200, 'Package retrieved successfully', { package: pkg });
  }
);

export const create = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.user!.clinicId!;
    const pkg = await packageService.createPackage(clinicId, req.body);
    successResponse(res, 201, 'Package created successfully', { package: pkg });
  }
);

export const update = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.user!.clinicId!;
    const id = req.params.id as string;
    const pkg = await packageService.updatePackage(id, clinicId, req.body);
    successResponse(res, 200, 'Package updated successfully', { package: pkg });
  }
);

export const remove = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.user!.clinicId!;
    const id = req.params.id as string;
    await packageService.deletePackage(id, clinicId);
    successResponse(res, 200, 'Package deleted successfully');
  }
);
