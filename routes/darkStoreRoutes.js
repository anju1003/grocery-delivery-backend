const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
} = require('../controllers/darkStoreController');

const router = express.Router();

router.get('/', protect, getStores);
router.get('/:id', protect, getStoreById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [body('name').notEmpty(), body('area').notEmpty()],
  validate,
  createStore
);

router.put('/:id', protect, authorize('admin'), updateStore);
router.delete('/:id', protect, authorize('admin'), deleteStore);

module.exports = router;
