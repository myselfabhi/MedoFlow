const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { protect, authorize } = require('../middleware/auth');
const { enforceClinicScope } = require('../middleware/clinicScope');

router.use(protect);
router.use(enforceClinicScope);

router.post('/', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), providerController.create);
router.get('/', providerController.list);
router.get('/:id/services', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), providerController.listServices);
router.post('/:id/services', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), providerController.addService);
router.put('/:id/services/:serviceId', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), providerController.updateService);
router.delete('/:id/services/:serviceId', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), providerController.removeService);
router.get('/:id', providerController.getById);
router.put('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), providerController.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), providerController.remove);

module.exports = router;
