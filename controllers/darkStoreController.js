const DarkStore = require('../models/DarkStore');
const ApiError = require('../utils/ApiError');

// Module 2: Dark-Store Management (Admin)

const createStore = async (req, res, next) => {
  try {
    const { name, area, location } = req.body;
    const store = await DarkStore.create({ name, area, location });
    res.status(201).json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

const getStores = async (req, res, next) => {
  try {
    const { area } = req.query;
    const filter = { isActive: true };
    if (area) filter.area = area;
    const stores = await DarkStore.find(filter);
    res.json({ success: true, data: stores });
  } catch (err) {
    next(err);
  }
};

const getStoreById = async (req, res, next) => {
  try {
    const store = await DarkStore.findById(req.params.id);
    if (!store) throw new ApiError(404, 'Dark store not found');
    res.json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

const updateStore = async (req, res, next) => {
  try {
    const store = await DarkStore.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!store) throw new ApiError(404, 'Dark store not found');
    res.json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

const deleteStore = async (req, res, next) => {
  try {
    const store = await DarkStore.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!store) throw new ApiError(404, 'Dark store not found');
    res.json({ success: true, data: { message: 'Store deactivated' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createStore, getStores, getStoreById, updateStore, deleteStore };
