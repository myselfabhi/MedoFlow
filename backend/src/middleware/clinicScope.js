const assertClinicAccess = (req, resourceClinicId) => {
  if (!req.user) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    throw err;
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return;
  }

  if (!resourceClinicId) {
    const err = new Error('Resource does not belong to any clinic');
    err.statusCode = 403;
    throw err;
  }

  if (req.user.clinicId !== resourceClinicId) {
    const err = new Error('Access denied: resource belongs to another clinic');
    err.statusCode = 403;
    throw err;
  }
};

const enforceClinicScope = (req, res, next) => {
  if (!req.user) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }

  if (req.user.role === 'SUPER_ADMIN') {
    req.clinicId = req.query.clinicId || req.body?.clinicId || null;
    req.bypassClinicScope = true;
    return next();
  }

  if (!req.user.clinicId) {
    const err = new Error('User is not assigned to a clinic');
    err.statusCode = 403;
    return next(err);
  }

  req.clinicId = req.user.clinicId;
  req.bypassClinicScope = false;
  next();
};

const getClinicWhere = (req) => {
  if (req.bypassClinicScope && req.user?.role === 'SUPER_ADMIN' && !req.clinicId) {
    return {};
  }
  if (req.clinicId) {
    return { clinicId: req.clinicId };
  }
  return { clinicId: null };
};

module.exports = {
  enforceClinicScope,
  assertClinicAccess,
  getClinicWhere,
};
