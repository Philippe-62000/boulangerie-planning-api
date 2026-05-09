const mongoose = require('mongoose');

const stockEntryItemSchema = new mongoose.Schema(
  {
    flourConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlourConfig',
      required: true,
      index: true
    },
    sacks: { type: Number, default: 0, min: 0 },
    pallets: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const stockEntrySchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      enum: ['lon', 'plan'],
      required: true,
      index: true
    },
    items: {
      type: [stockEntryItemSchema],
      default: []
    },
    createdByName: { type: String, default: '', trim: true },
    createdByEmail: { type: String, default: '', trim: true },
    urgent: { type: Boolean, default: false },
    urgentReason: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

stockEntrySchema.index({ siteKey: 1, createdAt: -1 });

module.exports = mongoose.model('StockEntry', stockEntrySchema);

