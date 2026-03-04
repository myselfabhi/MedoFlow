import { Router, Request, Response, NextFunction } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import { protect, authorize } from '../middleware/auth';
import { enforceClinicScope } from '../middleware/clinicScope';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

const invoiceScope = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user!.role === 'SUPER_ADMIN') {
    req.bypassClinicScope = true;
    req.clinicId =
      (req.body?.clinicId as string) ||
      (req.query?.clinicId as string) ||
      null;
  } else if (
    req.user!.role === 'PROVIDER' ||
    req.user!.role === 'CLINIC_ADMIN' ||
    req.user!.role === 'STAFF'
  ) {
    req.bypassClinicScope = false;
    req.clinicId = req.user!.clinicId;
  }
  next();
};

router.post(
  '/',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  invoiceScope,
  enforceClinicScope,
  invoiceController.create
);

router.post(
  '/:id/items',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  invoiceScope,
  invoiceController.addItem
);

router.put(
  '/:id/items/:itemId',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  invoiceScope,
  invoiceController.updateItem
);

router.delete(
  '/:id/items/:itemId',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  invoiceScope,
  invoiceController.deleteItem
);

router.put(
  '/:id/finalize',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.SUPER_ADMIN),
  invoiceScope,
  invoiceController.finalize
);

router.put(
  '/:id/pay',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.STAFF, Role.SUPER_ADMIN),
  invoiceScope,
  invoiceController.pay
);

router.get(
  '/',
  authorize(Role.CLINIC_ADMIN, Role.STAFF, Role.SUPER_ADMIN),
  invoiceScope,
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN' && !req.clinicId) {
      req.clinicId = req.query.clinicId as string;
    }
    next();
  },
  invoiceController.listByClinic
);

router.get(
  '/appointment/:appointmentId',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.STAFF, Role.SUPER_ADMIN),
  invoiceScope,
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN' && !req.clinicId) {
      req.clinicId = req.query.clinicId as string;
    }
    next();
  },
  invoiceController.getByAppointment
);

router.get(
  '/:id',
  authorize(Role.PROVIDER, Role.CLINIC_ADMIN, Role.STAFF, Role.SUPER_ADMIN),
  invoiceScope,
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.user!.role === 'SUPER_ADMIN' && !req.clinicId) {
      req.clinicId = req.query.clinicId as string;
    }
    next();
  },
  invoiceController.getById
);

export default router;
