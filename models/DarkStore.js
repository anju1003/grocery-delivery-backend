const mongoose = require('mongoose');

const darkStoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true }, // serviceable area / pincode-like key
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

darkStoreSchema.index({ name: 1 });
darkStoreSchema.index({ area: 1 });

module.exports = mongoose.model('DarkStore', darkStoreSchema);
