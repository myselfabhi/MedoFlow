const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/auth');
const { enforceClinicScope } = require('../middleware/clinicScope');

router.post('/register', optionalProtect, authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', protect, enforceClinicScope, authController.me);

module.exports = router;
