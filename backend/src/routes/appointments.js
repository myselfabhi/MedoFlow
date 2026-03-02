const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');
const { enforceClinicScope } = require('../middleware/clinicScope');

router.use(protect);

const appointmentCreateScope = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId = req.body?.clinicId || null;
  } else if (req.user.role === 'PATIENT') {
    req.bypassClinicScope = false;
    req.clinicId = req.body?.clinicId || null;
    if (!req.clinicId) {
      const err = new Error('Clinic ID is required');
      err.statusCode = 400;
      return next(err);
    }
  } else if (req.user.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user.clinicId;
  } else {
    const err = new Error('Only PATIENT, CLINIC_ADMIN, or SUPER_ADMIN can create appointments');
    err.statusCode = 403;
    return next(err);
  }
  next();
};

router.post('/', authorize('PATIENT', 'SUPER_ADMIN', 'CLINIC_ADMIN'), appointmentCreateScope, appointmentController.create);

router.get('/my', authorize('PATIENT'), (req, res, next) => {
  req.bypassClinicScope = req.user.role === 'SUPER_ADMIN';
  req.clinicId = req.query?.clinicId || req.user?.clinicId;
  next();
}, appointmentController.getMy);

router.get('/provider', authorize('PROVIDER'), (req, res, next) => {
  req.bypassClinicScope = req.user.role === 'SUPER_ADMIN';
  req.clinicId = req.query?.clinicId || req.user?.clinicId;
  next();
}, appointmentController.getProvider);

router.get('/clinic', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), enforceClinicScope, appointmentController.getClinic);

const statusUpdateScope = (req, res, next) => {
  if (req.user.role === 'CLINIC_ADMIN' || req.user.role === 'SUPER_ADMIN') {
    return enforceClinicScope(req, res, next);
  }
  next();
};

router.put('/:id/status', authorize('PATIENT', 'PROVIDER', 'SUPER_ADMIN', 'CLINIC_ADMIN'), statusUpdateScope, appointmentController.updateStatus);

module.exports = router;
