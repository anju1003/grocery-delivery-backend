const mongoose = require('mongoose');

// Module 3: Product Catalog & Store-Wise Stock
const storeStockSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DarkStore', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    reorderPoint: { type: Number, required: true, default: 10 },
  },
  { timestamps: true }
);

// A given product can only have one stock record per store
storeStockSchema.index({ storeId: 1, productId: 1 }, { unique: true });
storeStockSchema.index({ storeId: 1 });

module.exports = mongoose.model('StoreStock', storeStockSchema);
