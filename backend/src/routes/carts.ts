import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as cartController from '../controllers/cartController';

const router = Router();

router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);
router.post('/checkout', cartController.checkout);

export default router;
