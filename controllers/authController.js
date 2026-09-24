const bcrypt = require('bcryptjs');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const ApiError = require('../utils/ApiError');
const { generateToken } = require('../utils/token');

// Module 1: User Registration & Authentication
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, serviceableArea, assignedStore } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: role || 'customer',
      serviceableArea,
      assignedStore: role === 'storeStaff' ? assignedStore : undefined,
    });

    // If registering as a delivery partner, create the linked DeliveryPartner doc
    if (user.role === 'deliveryPartner') {
      await DeliveryPartner.create({ userId: user._id, serviceableArea });
    }

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
