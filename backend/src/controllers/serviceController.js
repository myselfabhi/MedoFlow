const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const serviceService = require('../services/serviceService');
const { getClinicWhere } = require('../middleware/clinicScope');

const create = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.body.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const service = await serviceService.createService(req.body, clinicId);
  successResponse(res, 201, 'Service created', { service });
});

const list = asyncHandler(async (req, res) => {
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const services = await serviceService.getServices(where);
  successResponse(res, 200, 'Services retrieved', { services });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const existing = await serviceService.getServiceById(id, where);
  if (!existing) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  const service = await serviceService.updateService(id, req.body, where);
  successResponse(res, 200, 'Service updated', { service });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const existing = await serviceService.getServiceById(id, where);
  if (!existing) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  const service = await serviceService.archiveService(id, where);
  successResponse(res, 200, 'Service archived', { service });
});

module.exports = {
  create,
  list,
  update,
  remove,
};
