import { Router } from 'express'
import { protect, requireClinicScope } from '../middleware/auth'
import * as cartController from '../controllers/cartController'

const router = Router()

router.use(protect)

// GET /carts is permissive: it returns an empty payload for users without a
// clinic (see cartController.getCart). All mutations must be clinic-scoped.
router.get('/', cartController.getCart)
router.post('/items', requireClinicScope, cartController.addItem)
router.put('/items/:itemId', requireClinicScope, cartController.updateItem)
router.delete('/items/:itemId', requireClinicScope, cartController.removeItem)
router.delete('/', requireClinicScope, cartController.clearCart)
router.post('/checkout', requireClinicScope, cartController.checkout)
router.post('/checkout-demo', requireClinicScope, cartController.demoCheckout)

export default router
