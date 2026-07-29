const mongoose = require('mongoose');

/** Taille de colis mémorisée par référence (12 ou 24 typiquement). */
const beveragePackConfigSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['plan', 'lon'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    packSize: { type: Number, enum: [12, 24], default: 12 }
  },
  { timestamps: true }
);

beveragePackConfigSchema.index({ siteKey: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('BeveragePackConfig', beveragePackConfigSchema);
