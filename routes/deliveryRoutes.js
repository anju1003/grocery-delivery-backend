const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getAvailablePartners, getMyPartnerProfile } = require('../controllers/deliveryController');

const router = express.Router();

router.get('/available', protect, authorize('admin', 'storeStaff'), getAvailablePartners);
router.get('/me', protect, authorize('deliveryPartner'), getMyPartnerProfile);

module.exports = router;
