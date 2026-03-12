import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import { protect, authorize } from '../middleware/auth';
import { requireClinic } from '../middleware/requireClinic';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(requireClinic);

router.post(
  '/',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.create
);

router.post(
  '/:id/items',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.addItem
);

router.put(
  '/:id/items/:itemId',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.updateItem
);

router.delete(
  '/:id/items/:itemId',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.deleteItem
);

router.put(
  '/:id/finalize',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.finalize
);

router.put(
  '/:id/pay',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.pay
);

router.post(
  '/:id/payments/manual',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.recordManualPayment
);

router.get(
  '/',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.listByClinic
);

router.get(
  '/summary/receivables',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.receivablesSummary
);

router.get(
  '/summary/finance',
  authorize(Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.financeSummary
);

router.get(
  '/appointment/:appointmentId',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.getByAppointment
);

router.get(
  '/:id',
  authorize(Role.PROVIDER, Role.FRONT_DESK, Role.SUPER_ADMIN),
  invoiceController.getById
);

export default router;
