const mongoose = require('mongoose');

// items[] is embedded because line items are always read/written together with
// the order and are never queried independently — a classic embed case.
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot at order time
    price: { type: Number, required: true }, // snapshot at order time
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DarkStore', required: true },
    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['placed', 'picking', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
      default: 'placed',
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', default: null },
    deliveryAddress: { type: String, required: true },
    deliverySlot: {
      date: { type: String }, // e.g. "2026-09-25"
      window: { type: String }, // e.g. "6pm-8pm"
    },
    pickStartedAt: Date,
    packedAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ storeId: 1, status: 1 });
orderSchema.index({ deliveryPartnerId: 1 });

module.exports = mongoose.model('Order', orderSchema);
