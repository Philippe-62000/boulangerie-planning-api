const mongoose = require('mongoose');

const flourConfigSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      enum: ['lon', 'plan'],
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    unit: {
      type: String,
      enum: ['sacks', 'pallets_and_sacks'],
      default: 'sacks',
      required: true
    },
    dailyConsumptionSacks: {
      type: Number,
      default: 0,
      min: 0
    },
    criticalThresholdSacks: {
      type: Number,
      default: 0,
      min: 0
    },
    supplierType: {
      type: String,
      enum: ['standard', 'next_day'],
      default: 'standard',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    order: {
      type: Number,
      default: 0
    },
    /** Si true : conso 7j/7 ; sinon dimanche fermé (6j de production / 7 calendaires). */
    openSunday: {
      type: Boolean,
      default: false
    },
    // Anti-spam: dernier envoi d'alerte seuil critique pour cette farine (par site)
    lastCriticalAlertAt: {
      type: Date,
      default: null
    },
    lastCriticalAlertStockSacks: {
      type: Number,
      default: null,
      min: 0
    }
  },
  { timestamps: true }
);

flourConfigSchema.index({ siteKey: 1, name: 1 }, { unique: true });
flourConfigSchema.index({ siteKey: 1, order: 1 });

module.exports = mongoose.model('FlourConfig', flourConfigSchema);

