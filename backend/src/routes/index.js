const express = require('express');
const router = express.Router();
const healthRoutes = require('./health');
const authRoutes = require('./auth');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

module.exports = router;
