const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  placeOrder,
  startPicking,
  markPacked,
  assignDeliveryPartner,
  updateDeliveryStatus,
  getOrderById,
  getMyOrders,
  reorder,
  getStoreOrders,
} = require('../controllers/orderController');

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('customer'),
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('deliveryAddress').notEmpty(),
  ],
  validate,
  placeOrder
);

router.get('/my', protect, authorize('customer'), getMyOrders);
router.get('/store', protect, authorize('admin', 'storeStaff'), getStoreOrders);
router.get('/:id', protect, getOrderById);

router.put('/:id/pick', protect, authorize('storeStaff', 'admin'), startPicking);
router.put('/:id/pack', protect, authorize('storeStaff', 'admin'), markPacked);
router.put('/:id/assign', protect, authorize('storeStaff', 'admin'), assignDeliveryPartner);
router.put(
  '/:id/status',
  protect,
  authorize('deliveryPartner', 'admin'),
  [body('status').notEmpty()],
  validate,
  updateDeliveryStatus
);
router.post('/:id/reorder', protect, authorize('customer'), reorder);

module.exports = router;
