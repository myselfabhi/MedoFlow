const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');
const { enforceClinicScope } = require('../middleware/clinicScope');

router.use(protect);
router.use(enforceClinicScope);

router.post('/', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), serviceController.create);
router.get('/', serviceController.list);
router.put('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), serviceController.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), serviceController.remove);

module.exports = router;
