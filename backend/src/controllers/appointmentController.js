const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const appointmentService = require('../services/appointmentService');
const { getClinicWhere } = require('../middleware/clinicScope');

const create = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.body.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const { patientId, ...rest } = req.body;
  const resolvedPatientId = patientId || req.user.id;
  const appointment = await appointmentService.createAppointment(
    { ...rest, patientId: resolvedPatientId },
    clinicId
  );
  successResponse(res, 201, 'Appointment created', { appointment });
});

const getMy = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.query.clinicId : req.clinicId;
  const appointments = await appointmentService.getAppointmentsByPatient(req.user.id, clinicId);
  successResponse(res, 200, 'Appointments retrieved', { appointments });
});

const getProvider = asyncHandler(async (req, res) => {
  const provider = await appointmentService.getProviderByUserId(req.user.id);
  if (!provider) {
    const err = new Error('Provider profile not found');
    err.statusCode = 404;
    throw err;
  }
  const clinicId = req.bypassClinicScope ? req.query.clinicId : req.clinicId;
  const appointments = await appointmentService.getAppointmentsByProvider(provider.id, clinicId);
  successResponse(res, 200, 'Appointments retrieved', { appointments });
});

const getClinic = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.query.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const appointments = await appointmentService.getAppointmentsByClinic(clinicId);
  successResponse(res, 200, 'Appointments retrieved', { appointments });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    const err = new Error('Status is required');
    err.statusCode = 400;
    throw err;
  }
  const validStatuses = ['DRAFT', 'PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'];
  if (!validStatuses.includes(status)) {
    const err = new Error('Invalid status');
    err.statusCode = 400;
    throw err;
  }
  const appointment = await appointmentService.updateAppointmentStatus(id, status, req);
  successResponse(res, 200, 'Appointment status updated', { appointment });
});

module.exports = {
  create,
  getMy,
  getProvider,
  getClinic,
  updateStatus,
};
