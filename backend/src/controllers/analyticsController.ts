import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types/errors';

export const getOverview = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const overview = await analyticsService.getOverview(clinicId);
    successResponse(res, 200, 'Analytics overview', overview);
  }
);

export const getRevenueByService = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const data = await analyticsService.getRevenueByService(clinicId);
    successResponse(res, 200, 'Revenue by service', { data });
  }
);

export const getRevenueByProvider = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const data = await analyticsService.getRevenueByProvider(clinicId);
    successResponse(res, 200, 'Revenue by provider', { data });
  }
);

export const getAppointmentsByDiscipline = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const data = await analyticsService.getAppointmentsByDiscipline(clinicId);
    successResponse(res, 200, 'Appointments by discipline', { data });
  }
);

const toCsv = (rows: Record<string, string | number>[]) => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? '')).join(',')),
  ];
  return lines.join('\n');
};

export const exportReport = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const type = String(req.query.type || 'overview');
    let rows: Record<string, string | number>[] = [];

    if (type === 'overview') {
      const overview = await analyticsService.getOverview(clinicId);
      rows = Object.entries(overview).map(([metric, value]) => ({
        metric,
        value: Number(value),
      }));
    } else if (type === 'revenue-by-service') {
      const data = await analyticsService.getRevenueByService(clinicId);
      rows = data.map((item) => ({
        serviceName: item.serviceName,
        total: item.total,
      }));
    } else if (type === 'revenue-by-provider') {
      const data = await analyticsService.getRevenueByProvider(clinicId);
      rows = data.map((item) => ({
        providerName: item.providerName,
        total: item.total,
      }));
    } else if (type === 'appointments-by-discipline') {
      const data = await analyticsService.getAppointmentsByDiscipline(clinicId);
      rows = data.map((item) => ({
        disciplineName: item.disciplineName,
        count: item.count,
      }));
    } else {
      const err = new Error('Invalid report type') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const csv = toCsv(rows);
    const filename = `analytics-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }
);
