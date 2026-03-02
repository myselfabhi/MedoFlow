const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const prescriptionService = require('../services/prescriptionService');
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
  const prescription = await prescriptionService.createPrescription(req.body, provider.id, clinicId);
  successResponse(res, 201, 'Prescription created', { prescription });
});

const getMy = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.query.clinicId : req.user?.clinicId;
  const prescriptions = await prescriptionService.getPrescriptionsByPatient(req.user.id, clinicId);
  successResponse(res, 200, 'Prescriptions retrieved', { prescriptions });
});

const getProvider = asyncHandler(async (req, res) => {
  const provider = await visitService.getProviderByUserId(req.user.id);
  if (!provider) {
    const err = new Error('Provider profile not found');
    err.statusCode = 404;
    throw err;
  }
  const clinicId = req.bypassClinicScope ? req.query.clinicId : req.clinicId;
  const prescriptions = await prescriptionService.getPrescriptionsByProvider(provider.id, clinicId);
  successResponse(res, 200, 'Prescriptions retrieved', { prescriptions });
});

const listClinic = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.query.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const prescriptions = await prescriptionService.getPrescriptionsByClinic(clinicId);
  successResponse(res, 200, 'Prescriptions retrieved', { prescriptions });
});

module.exports = {
  create,
  getMy,
  getProvider,
  listClinic,
};
