const express = require('express');
const router = express.Router();
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const disciplineRoutes = require('./disciplines');
const providerRoutes = require('./providers');
const locationRoutes = require('./locations');
const serviceRoutes = require('./services');
const appointmentRoutes = require('./appointments');
const visitRoutes = require('./visits');
const prescriptionRoutes = require('./prescriptions');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/disciplines', disciplineRoutes);
router.use('/providers', providerRoutes);
router.use('/locations', locationRoutes);
router.use('/services', serviceRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/visits', visitRoutes);
router.use('/prescriptions', prescriptionRoutes);

module.exports = router;
