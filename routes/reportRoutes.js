const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getPerformanceReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/performance', protect, authorize('admin'), getPerformanceReport);

module.exports = router;
