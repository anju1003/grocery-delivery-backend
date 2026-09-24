const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  createProduct,
  getProducts,
  updateProduct,
  getLowStockAlerts,
  upsertStock,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', protect, getProducts);
router.get('/low-stock', protect, authorize('admin', 'storeStaff'), getLowStockAlerts);

router.post(
  '/',
  protect,
  authorize('admin'),
  [body('name').notEmpty(), body('category').notEmpty(), body('price').isFloat({ min: 0 })],
  validate,
  createProduct
);

router.put('/:id', protect, authorize('admin'), updateProduct);

router.post(
  '/stock',
  protect,
  authorize('admin', 'storeStaff'),
  [
    body('storeId').notEmpty(),
    body('productId').notEmpty(),
    body('quantity').isInt({ min: 0 }),
  ],
  validate,
  upsertStock
);

module.exports = router;
