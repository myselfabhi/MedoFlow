import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoiceService';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { assertClinicAccess } from '../middleware/clinicScope';
import { ApiError } from '../types/errors';

export const create = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.user!.clinicId!;
    const { appointmentId, providerId, patientId, locationId } = req.body;
    
    if (!providerId) {
      const err = new Error('providerId is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    if (!appointmentId && !patientId) {
      const err = new Error('Either appointmentId or patientId is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }

    const invoice = await invoiceService.createInvoice(
      appointmentId,
      clinicId,
      providerId,
      req.user!.id,
      patientId,
      locationId
    );
    successResponse(res, 201, 'Invoice created', { invoice });
  }
);

export const addItem = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const invoiceId = req.params.id as string;
    const { serviceId, description, unitPrice, quantity } = req.body;
    if (!serviceId || !description || unitPrice === undefined) {
      const err = new Error(
        'serviceId, description, and unitPrice are required'
      ) as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      const err = new Error('Invoice not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    assertClinicAccess(req, invoice.clinicId);
    const item = await invoiceService.addInvoiceItem(
      invoiceId,
      { serviceId, description, unitPrice, quantity },
      req.user!.id
    );
    successResponse(res, 201, 'Invoice item added', { item });
  }
);

export const updateItem = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const invoiceId = req.params.id as string;
    const itemId = req.params.itemId as string;
    const { unitPrice, quantity } = req.body;
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      const err = new Error('Invoice not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    assertClinicAccess(req, invoice.clinicId);
    const item = await invoiceService.updateInvoiceItem(
      invoiceId,
      itemId,
      { unitPrice, quantity },
      req.user!.id
    );
    successResponse(res, 200, 'Invoice item updated', { item });
  }
);

export const deleteItem = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const invoiceId = req.params.id as string;
    const itemId = req.params.itemId as string;
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      const err = new Error('Invoice not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    assertClinicAccess(req, invoice.clinicId);
    await invoiceService.deleteInvoiceItem(invoiceId, itemId, req.user!.id);
    successResponse(res, 200, 'Invoice item deleted');
  }
);

export const finalize = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const invoiceId = req.params.id as string;
    const clinicId = req.user!.clinicId!;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const invoice = await invoiceService.finalizeInvoice(
      invoiceId,
      clinicId,
      req.user!.id
    );
    successResponse(res, 200, 'Invoice finalized', { invoice });
  }
);

export const pay = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const invoiceId = req.params.id as string;
    const clinicId = req.user!.clinicId!;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const invoice = await invoiceService.payInvoice(
      invoiceId,
      clinicId,
      req.user!.id
    );
    successResponse(res, 200, 'Invoice paid', { invoice });
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const id = req.params.id as string;
    const clinicId = req.clinicId!;
    const invoice = await invoiceService.getInvoiceById(id, clinicId ?? undefined);
    if (!invoice) {
      const err = new Error('Invoice not found') as ApiError;
      err.statusCode = 404;
      throw err;
    }
    assertClinicAccess(req, invoice.clinicId);
    successResponse(res, 200, 'Invoice retrieved', { invoice });
  }
);

export const listByClinic = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clinicId = req.clinicId!;
    const status = req.query.status as string | undefined;
    const invoices = await invoiceService.getInvoicesByClinic(clinicId, status);
    successResponse(res, 200, 'Invoices retrieved', { invoices });
  }
);

export const getByAppointment = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const appointmentId = req.params.appointmentId as string;
    const clinicId = req.clinicId!;
    if (!clinicId) {
      const err = new Error('Clinic ID is required') as ApiError;
      err.statusCode = 400;
      throw err;
    }
    const invoices = await invoiceService.getInvoicesByAppointment(
      appointmentId,
      clinicId
    );
    successResponse(res, 200, 'Invoices retrieved', { invoices });
  }
);
