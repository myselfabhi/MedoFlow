const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const locationService = require('../services/locationService');
const { getClinicWhere } = require('../middleware/clinicScope');

const create = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.body.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const location = await locationService.createLocation(req.body, clinicId);
  successResponse(res, 201, 'Location created', { location });
});

const list = asyncHandler(async (req, res) => {
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const locations = await locationService.getLocations(where);
  successResponse(res, 200, 'Locations retrieved', { locations });
});

module.exports = {
  create,
  list,
};
