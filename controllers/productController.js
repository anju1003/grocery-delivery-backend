const Product = require('../models/Product');
const StoreStock = require('../models/StoreStock');
const ApiError = require('../utils/ApiError');

// Module 3: Product Catalog & Store-Wise Stock

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// GET /api/products?storeId=... -> returns products with that store's stock quantity
const getProducts = async (req, res, next) => {
  try {
    const { storeId, category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const products = await Product.find(filter).lean();

    if (!storeId) {
      return res.json({ success: true, data: products });
    }

    const stockDocs = await StoreStock.find({ storeId }).lean();
    const stockMap = {};
    stockDocs.forEach((s) => {
      stockMap[s.productId.toString()] = s.quantity;
    });

    const merged = products.map((p) => ({
      ...p,
      storeStock: stockMap[p._id.toString()] ?? 0,
    }));

    res.json({ success: true, data: merged });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new ApiError(404, 'Product not found');
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Module 9: Stock Replenishment Alerts
// GET /api/products/low-stock?storeId=...
const getLowStockAlerts = async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const filter = {};
    if (storeId) filter.storeId = storeId;

    const stockDocs = await StoreStock.find(filter)
      .populate('productId', 'name category')
      .populate('storeId', 'name area');

    const lowStock = stockDocs.filter((s) => s.quantity <= s.reorderPoint);

    res.json({ success: true, data: lowStock });
  } catch (err) {
    next(err);
  }
};

// Store staff/admin sets or updates stock quantity for a product at a store
const upsertStock = async (req, res, next) => {
  try {
    const { storeId, productId, quantity, reorderPoint } = req.body;
    const stock = await StoreStock.findOneAndUpdate(
      { storeId, productId },
      { $set: { quantity, ...(reorderPoint !== undefined && { reorderPoint }) } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: stock });
  } catch (err) {
    next(err);
  }
};

module.exports = { createProduct, getProducts, updateProduct, getLowStockAlerts, upsertStock };
