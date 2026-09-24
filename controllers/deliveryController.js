const DeliveryPartner = require('../models/DeliveryPartner');
const ApiError = require('../utils/ApiError');

// GET /api/delivery-partners/available?area=...
const getAvailablePartners = async (req, res, next) => {
  try {
    const { area } = req.query;
    const filter = { isAvailable: true };
    if (area) filter.serviceableArea = area;
    const partners = await DeliveryPartner.find(filter).populate('userId', 'name phone');
    res.json({ success: true, data: partners });
  } catch (err) {
    next(err);
  }
};

// GET /api/delivery-partners/me -> the logged-in delivery partner's own profile + current order
const getMyPartnerProfile = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id }).populate('currentOrderId');
    if (!partner) throw new ApiError(404, 'Delivery partner profile not found');
    res.json({ success: true, data: partner });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAvailablePartners, getMyPartnerProfile };
