const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');
const { enforceClinicScope } = require('../middleware/clinicScope');

router.use(protect);
router.use(enforceClinicScope);

router.post('/', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), locationController.create);
router.get('/', locationController.list);

module.exports = router;
