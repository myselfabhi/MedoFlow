const express = require('express');
const router = express.Router();
const disciplineController = require('../controllers/disciplineController');
const { protect, authorize } = require('../middleware/auth');
const { enforceClinicScope } = require('../middleware/clinicScope');

router.use(protect);
router.use(enforceClinicScope);

router.post('/', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), disciplineController.create);
router.get('/', disciplineController.list);
router.put('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), disciplineController.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), disciplineController.remove);

module.exports = router;
