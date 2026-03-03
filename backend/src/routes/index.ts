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

export default router;
