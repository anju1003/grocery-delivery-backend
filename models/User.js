const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['customer', 'storeStaff', 'deliveryPartner', 'admin'],
      default: 'customer',
    },
    // Used for storeStaff to know which store they work at
    assignedStore: { type: mongoose.Schema.Types.ObjectId, ref: 'DarkStore' },
    serviceableArea: { type: String, trim: true }, // used to find nearest store for customers
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
