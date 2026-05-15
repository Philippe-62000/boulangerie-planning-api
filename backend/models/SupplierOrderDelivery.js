const mongoose = require('mongoose');

const deliveryLineSchema = new mongoose.Schema(
  {
    supplierCode: { type: String, default: '' },
    productName: { type: String, required: true },
    unit: { type: String, default: '' },
    orderedQty: { type: Number, default: 0 },
    deliveredQty: { type: Number, default: 0 },
    receivedQty: { type: Number, default: 0 }
  },
  { _id: false }
);

const supplierOrderDeliverySchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon', 'plan'], required: true, index: true },
    supplier: { type: String, default: 'TGT' },
    orderNumber: { type: String, default: '', index: true },
    orderDate: { type: String, default: '' },
    receptionDate: { type: String, default: '' },
    source: { type: String, enum: ['pdf', 'manual'], default: 'pdf' },
    fileName: { type: String, default: '' },
    lines: { type: [deliveryLineSchema], default: [] }
  },
  { timestamps: true }
);

supplierOrderDeliverySchema.index({ siteKey: 1, orderNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SupplierOrderDelivery', supplierOrderDeliverySchema);
