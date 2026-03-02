const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const visitService = require('../services/visitService');

const create = asyncHandler(async (req, res) => {
  const provider = await visitService.getProviderByUserId(req.user.id);
  if (!provider) {
    const err = new Error('Provider profile not found');
    err.statusCode = 404;
    throw err;
  }
  const clinicId = req.bypassClinicScope ? req.body.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const visitRecord = await visitService.createVisitRecord(req.body, provider.id, clinicId);
  successResponse(res, 201, 'Visit record created', { visitRecord });
});

const getByAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const clinicId = req.bypassClinicScope ? req.query.clinicId : req.clinicId;
  const visitRecord = await visitService.getVisitRecordByAppointment(appointmentId, clinicId);
  if (!visitRecord) {
    const err = new Error('Visit record not found');
    err.statusCode = 404;
    throw err;
  }
  if (req.user.role === 'PROVIDER') {
    const provider = await visitService.getProviderByUserId(req.user.id);
    if (!provider || visitRecord.providerId !== provider.id) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }
  }
  successResponse(res, 200, 'Visit record retrieved', { visitRecord });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const provider = await visitService.getProviderByUserId(req.user.id);
  if (!provider) {
    const err = new Error('Provider profile not found');
    err.statusCode = 404;
    throw err;
  }
  const clinicId = req.bypassClinicScope ? req.body.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const visitRecord = await visitService.updateVisitRecord(id, req.body, provider.id, clinicId);
  successResponse(res, 200, 'Visit record updated', { visitRecord });
});

const finalize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const provider = await visitService.getProviderByUserId(req.user.id);
  if (!provider) {
    const err = new Error('Provider profile not found');
    err.statusCode = 404;
    throw err;
  }
  const clinicId = req.bypassClinicScope ? req.body.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const visitRecord = await visitService.finalizeVisitRecord(id, provider.id, clinicId);
  successResponse(res, 200, 'Visit record finalized', { visitRecord });
});

const listClinic = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.query.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const visitRecords = await visitService.getVisitRecordsByClinic(clinicId);
  successResponse(res, 200, 'Visit records retrieved', { visitRecords });
});

module.exports = {
  create,
  getByAppointment,
  update,
  finalize,
  listClinic,
};
