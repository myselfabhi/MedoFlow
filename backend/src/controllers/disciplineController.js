const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const disciplineService = require('../services/disciplineService');
const { getClinicWhere } = require('../middleware/clinicScope');

const create = asyncHandler(async (req, res) => {
  const clinicId = req.bypassClinicScope ? req.body.clinicId : req.clinicId;
  if (!clinicId) {
    const err = new Error('Clinic ID is required');
    err.statusCode = 400;
    throw err;
  }
  const discipline = await disciplineService.createDiscipline(req.body, clinicId);
  successResponse(res, 201, 'Discipline created', { discipline });
});

const list = asyncHandler(async (req, res) => {
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const disciplines = await disciplineService.getDisciplines(where);
  successResponse(res, 200, 'Disciplines retrieved', { disciplines });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const existing = await disciplineService.getDisciplineById(id, where);
  if (!existing) {
    const err = new Error('Discipline not found');
    err.statusCode = 404;
    throw err;
  }
  const discipline = await disciplineService.updateDiscipline(id, req.body, where);
  successResponse(res, 200, 'Discipline updated', { discipline });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const where = getClinicWhere(req);
  if (Object.keys(where).length === 0) {
    const err = new Error('Clinic scope required');
    err.statusCode = 400;
    throw err;
  }
  const existing = await disciplineService.getDisciplineById(id, where);
  if (!existing) {
    const err = new Error('Discipline not found');
    err.statusCode = 404;
    throw err;
  }
  await disciplineService.deleteDiscipline(id, where);
  successResponse(res, 200, 'Discipline deleted');
});

module.exports = {
  create,
  list,
  update,
  remove,
};
