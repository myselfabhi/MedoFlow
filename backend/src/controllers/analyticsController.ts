import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import * as analyticsService from '../services/analyticsService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';

const getRangeFromRequest = (req: Request) =>
  analyticsService.parseAnalyticsDateRange({
    dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
    dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
  });

const getFiltersFromRequest = (req: Request) => ({
  providerId: req.query.providerId ? String(req.query.providerId) : undefined,
  serviceId: req.query.serviceId ? String(req.query.serviceId) : undefined,
  disciplineId: req.query.disciplineId ? String(req.query.disciplineId) : undefined,
});

const resolveScope = async (req: Request) =>
  analyticsService.resolveAnalyticsScope({
    clinicId: req.clinicId!,
    role: req.user!.role,
    userId: req.user!.id,
    requestedProviderId: req.query.providerId ? String(req.query.providerId) : undefined,
  });

export const getDashboard = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const scope = await resolveScope(req);
    const range = getRangeFromRequest(req);

    if (scope.role === Role.PROVIDER) {
      const providerAnalytics = await analyticsService.getProviderAnalytics(scope, range);
      successResponse(res, 200, 'Provider analytics retrieved', { mode: 'provider', providerAnalytics });
      return;
    }

    const dashboard = await analyticsService.getClinicCommandCenter(scope, range, getFiltersFromRequest(req));
    successResponse(res, 200, 'Analytics dashboard retrieved', { mode: 'clinic', dashboard });
  }
);

export const getProviderSelf = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const scope = await analyticsService.resolveAnalyticsScope({
      clinicId: req.clinicId!,
      role: Role.PROVIDER,
      userId: req.user!.id,
    });
    const range = getRangeFromRequest(req);
    const providerAnalytics = await analyticsService.getProviderAnalytics(scope, range);
    successResponse(res, 200, 'Provider analytics retrieved', { providerAnalytics });
  }
);

export const exportReport = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const scope = await resolveScope(req);
    const range = getRangeFromRequest(req);
    const type = String(req.query.type || 'command-center') as
      | 'command-center'
      | 'provider'
      | 'finance'
      | 'commerce'
      | 'patients'
      | 'commissions';

    if (scope.role === Role.PROVIDER && type !== 'provider') {
      const err = new Error('Providers can only export their own analytics') as ApiError;
      err.statusCode = 403;
      err.code = 'forbidden';
      throw err;
    }

    const report = await analyticsService.exportAnalyticsReport(scope, range, type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.status(200).send(report.csv);
  }
);
