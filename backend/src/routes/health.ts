import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/apiResponse';

const router = Router();
const startTime = Date.now();

router.get('/', (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  successResponse(res, 200, 'Medoflow API is operational', {
    uptime,
    timestamp: new Date().toISOString(),
  });
});

export default router;
