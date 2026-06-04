const mongoose = require('mongoose');

const tgtStockEntryItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOrderProduct', required: true },
    productName: { type: String, required: true, trim: true },
    supplierCode: { type: String, default: '', trim: true },
    locationName: { type: String, default: '', trim: true },
    /** @deprecated — anciennes saisies ; préférer cartonQty + unitQty */
    stockQty: { type: Number, default: null, min: 0 },
    cartonQty: { type: Number, default: null, min: 0 },
    unitQty: { type: Number, default: null, min: 0 }
  },
  { _id: false }
);

const tgtStockEntrySchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      enum: ['lon', 'plan'],
      required: true,
      index: true
    },
    supplier: { type: String, enum: ['TGT', 'MILLANGE'], default: 'TGT', index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    employeeName: { type: String, required: true, trim: true },
    comment: { type: String, default: '', trim: true, maxlength: 500 },
    items: {
      type: [tgtStockEntryItemSchema],
      default: []
    },
    itemsCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

tgtStockEntrySchema.index({ siteKey: 1, supplier: 1, createdAt: -1 });

module.exports = mongoose.model('TgtStockEntry', tgtStockEntrySchema);
