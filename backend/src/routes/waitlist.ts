import { Router, Request, Response, NextFunction } from 'express';
import * as waitlistController from '../controllers/waitlistController';
import { protect, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);
router.use(authorize(Role.PATIENT));

router.post('/', (req: Request, _res: Response, next: NextFunction): void => {
  req.clinicId = (req.body?.clinicId as string) || null;
  next();
}, waitlistController.add);

router.get('/my', waitlistController.getMy);

router.post('/:id/claim', waitlistController.claim);

export default router;
