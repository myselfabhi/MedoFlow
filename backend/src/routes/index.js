const express = require('express');
const router = express.Router();
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const disciplineRoutes = require('./disciplines');
const providerRoutes = require('./providers');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/disciplines', disciplineRoutes);
router.use('/providers', providerRoutes);

module.exports = router;
