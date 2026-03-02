const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');
const { enforceClinicScope } = require('../middleware/clinicScope');

router.use(protect);

const providerScope = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId = req.body?.clinicId || req.query?.clinicId || null;
  } else if (req.user.role === 'PROVIDER') {
    req.bypassClinicScope = false;
    req.clinicId = req.user.clinicId;
  } else if (req.user.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user.clinicId;
  }
  next();
};

router.post('/', authorize('PROVIDER'), providerScope, prescriptionController.create);
router.get('/my', authorize('PATIENT'), (req, res, next) => {
  req.bypassClinicScope = req.user.role === 'SUPER_ADMIN';
  req.clinicId = req.query?.clinicId || req.user?.clinicId;
  next();
}, prescriptionController.getMy);
router.get('/provider', authorize('PROVIDER'), providerScope, prescriptionController.getProvider);
router.get('/clinic', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), enforceClinicScope, prescriptionController.listClinic);

module.exports = router;
