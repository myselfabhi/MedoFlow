const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const providerService = require('../services/providerService');
const { getClinicWhere, assertClinicAccess } = require('../middleware/clinicScope');

const create = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.body.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const provider = await providerService.createProvider(req.body, clinicId);
  successResponse(res, 201, 'Provider created', { provider });
});

const list = asyncHandler(async (req, res) => {
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const providers = await providerService.getProviders(where);
  successResponse(res, 200, 'Providers retrieved', { providers });
});

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const provider = await providerService.getProviderById(id);
  if (!provider) {
    const err = new Error('Provider not found');
    err.statusCode = 404;
    throw err;
  }
  assertClinicAccess(req, provider.clinicId);
  successResponse(res, 200, 'Provider retrieved', { provider });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const provider = await providerService.updateProvider(id, req.body, where);
  successResponse(res, 200, 'Provider updated', { provider });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const provider = await providerService.softDeleteProvider(id, where);
  successResponse(res, 200, 'Provider deactivated', { provider });
});

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
};
