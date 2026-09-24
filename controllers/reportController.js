const Order = require('../models/Order');

// Module 12: Store & Delivery Performance Reports
// GET /api/admin/reports/performance?storeId=...
const getPerformanceReport = async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const match = {};
    if (storeId) match.storeId = require('mongoose').Types.ObjectId.createFromHexString(storeId);

    const report = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$storeId',
          totalOrders: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          avgOrderValue: { $avg: '$totalAmount' },
          avgDeliveryMinutes: {
            $avg: {
              $cond: [
                { $and: ['$deliveredAt', '$createdAt'] },
                { $divide: [{ $subtract: ['$deliveredAt', '$createdAt'] }, 60000] },
                null,
              ],
            },
          },
          avgPickMinutes: {
            $avg: {
              $cond: [
                { $and: ['$packedAt', '$pickStartedAt'] },
                { $divide: [{ $subtract: ['$packedAt', '$pickStartedAt'] }, 60000] },
                null,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'darkstores',
          localField: '_id',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          storeId: '$_id',
          storeName: '$store.name',
          totalOrders: 1,
          delivered: 1,
          failed: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] },
          avgDeliveryMinutes: { $round: ['$avgDeliveryMinutes', 1] },
          avgPickMinutes: { $round: ['$avgPickMinutes', 1] },
        },
      },
    ]);

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPerformanceReport };
