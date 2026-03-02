const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { protect, authorize } = require('../middleware/auth');
const { enforceClinicScope } = require('../middleware/clinicScope');

router.use(protect);

const providerScope = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId = req.body?.clinicId || req.query?.clinicId || null;
  } else if (req.user.role === 'PROVIDER' || req.user.role === 'CLINIC_ADMIN') {
    req.bypassClinicScope = false;
    req.clinicId = req.user.clinicId;
  }
  next();
};

router.post('/', authorize('PROVIDER'), providerScope, visitController.create);
router.get('/appointment/:appointmentId', authorize('PROVIDER', 'SUPER_ADMIN', 'CLINIC_ADMIN'), providerScope, visitController.getByAppointment);
router.put('/:id', authorize('PROVIDER'), providerScope, visitController.update);
router.put('/:id/finalize', authorize('PROVIDER'), providerScope, visitController.finalize);
router.get('/clinic', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), enforceClinicScope, visitController.listClinic);

module.exports = router;
