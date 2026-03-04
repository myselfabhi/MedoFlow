import { Request, Response, NextFunction } from 'express';
import * as formService from '../services/formService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getClinicWhere } from '../middleware/clinicScope';
import { ApiError } from '../types/errors';

export const createTemplate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.bypassClinicScope
      ? (req.body.clinicId as string)
      : req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const template = await formService.createTemplate(
      req.body,
      clinicId,
      req.user!.id
    );
    successResponse(res, 201, 'Form template created', { template });
  }
);

export const listTemplates = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const where = getClinicWhere(req);
    if (Object.keys(where).length === 0) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const templates = await formService.listTemplates(where);
    successResponse(res, 200, 'Templates retrieved', { templates });
  }
);

export const updateTemplate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const where = getClinicWhere(req);
    if (Object.keys(where).length === 0) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const template = await formService.updateTemplate(
      id,
      req.body,
      where,
      req.user!.id
    );
    successResponse(res, 200, 'Template updated', { template });
  }
);

export const disableTemplate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const where = getClinicWhere(req);
    if (Object.keys(where).length === 0) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    await formService.disableTemplate(id, where, req.user!.id);
    successResponse(res, 200, 'Template disabled');
  }
);

export const submitResponse = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { templateId, appointmentId, responses } = req.body;
    if (!templateId || !responses) {
      const err = new Error('templateId and responses are required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const resolvedPatientId = req.user!.id;
    const template = await formService.getTemplateById(templateId, {});
    if (!template) {
      const err = new Error('Form template not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    if (resolvedPatientId !== req.user!.id) {
      const err = new Error(
        'Patients can only submit for themselves'
      ) as ApiError;
      err.statusCode = 403;
      throw err;
    }
    const response = await formService.submitResponse({
      clinicId: template.clinicId,
      templateId,
      patientId: resolvedPatientId,
      appointmentId: appointmentId || undefined,
      responses,
      performedById: req.user!.id,
    });
    successResponse(res, 201, 'Response submitted', { response });
  }
);

export const getResponsesByPatient = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const patientId = req.params.patientId as string;
    const clinicId = req.bypassClinicScope
      ? (req.query.clinicId as string)
      : req.clinicId;
    if (!clinicId) {
      const err = new Error('Clinic scope required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const responses = await formService.getResponsesByPatient(
      clinicId,
      patientId
    );
    successResponse(res, 200, 'Responses retrieved', { responses });
  }
);
