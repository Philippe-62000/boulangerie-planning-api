const mongoose = require('mongoose');

const supplierOrderLocationSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon', 'plan'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

supplierOrderLocationSchema.index({ siteKey: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SupplierOrderLocation', supplierOrderLocationSchema);
