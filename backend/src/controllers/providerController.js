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

const addService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { serviceId, priceOverride } = req.body;
  const clinicId = req.bypassClinicScope ? req.body.clinicId || req.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  if (!serviceId) {
    const err = new Error('Service ID is required');
    err.statusCode = 400;
    throw err;
  }
  const assignment = await providerService.addProviderService(id, serviceId, priceOverride, clinicId);
  successResponse(res, 201, 'Service assigned to provider', { providerService: assignment });
});

const updateService = asyncHandler(async (req, res) => {
  const { id, serviceId } = req.params;
  const { priceOverride } = req.body;
  const clinicId = req.bypassClinicScope ? req.body.clinicId || req.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const assignment = await providerService.updateProviderService(id, serviceId, priceOverride, clinicId);
  successResponse(res, 200, 'Provider service updated', { providerService: assignment });
});

const removeService = asyncHandler(async (req, res) => {
  const { id, serviceId } = req.params;
  const clinicId = req.bypassClinicScope ? req.query.clinicId || req.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  await providerService.removeProviderService(id, serviceId, clinicId);
  successResponse(res, 200, 'Service removed from provider');
});

const listServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clinicId = req.bypassClinicScope ? req.query.clinicId || req.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const providerServices = await providerService.getProviderServices(id, clinicId);
  successResponse(res, 200, 'Provider services retrieved', { providerServices });
});

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  addService,
  updateService,
  removeService,
  listServices,
};
