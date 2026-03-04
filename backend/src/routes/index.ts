import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import disciplineRoutes from './disciplines';
import providerRoutes from './providers';
import locationRoutes from './locations';
import serviceRoutes from './services';
import appointmentRoutes from './appointments';
import visitRoutes from './visits';
import prescriptionRoutes from './prescriptions';
import publicRoutes from './public';
import waitlistRoutes from './waitlist';
import paymentRoutes from './payments';
import treatmentPlanRoutes from './treatmentPlans';
import fileRoutes from './files';
import formRoutes from './forms';

const router = Router();

router.use('/health', healthRoutes);
router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/disciplines', disciplineRoutes);
router.use('/providers', providerRoutes);
router.use('/locations', locationRoutes);
router.use('/services', serviceRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/visits', visitRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/payments', paymentRoutes);
router.use('/treatment-plans', treatmentPlanRoutes);
router.use('/files', fileRoutes);
router.use('/forms', formRoutes);

export default router;
