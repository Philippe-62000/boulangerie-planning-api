const mongoose = require('mongoose');

const stockInventoryItemSchema = new mongoose.Schema(
  {
    flourConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlourConfig',
      required: true,
      index: true
    },
    sacks: { type: Number, default: 0, min: 0 },
    pallets: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const stockInventorySchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      enum: ['lon', 'plan'],
      required: true,
      unique: true,
      index: true
    },
    items: {
      type: [stockInventoryItemSchema],
      default: []
    },
    updatedByName: { type: String, default: '', trim: true },
    updatedByEmail: { type: String, default: '', trim: true },
    urgent: { type: Boolean, default: false },
    urgentReason: { type: String, default: '', trim: true },
    lastEntryAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockInventory', stockInventorySchema);

