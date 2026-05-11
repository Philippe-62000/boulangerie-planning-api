/**
 * Historique des analyses Positive (comptage par photo IA).
 * On NE stocke PAS les photos elles-mêmes (choix produit pour rester léger),
 * uniquement les libellés des fichiers et les résultats JSON.
 */

const mongoose = require('mongoose');

const productLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    count: { type: Number, default: 0 },
    confidence: { type: String, enum: ['haute', 'moyenne', 'basse', ''], default: '' },
    originalName: { type: String, default: '' }
  },
  { _id: false }
);

const incertainLineSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    count: { type: Number, default: 0 }
  },
  { _id: false }
);

const photoResultSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: '' },
    products: { type: [productLineSchema], default: [] },
    incertains: { type: [incertainLineSchema], default: [] },
    remarques: { type: String, default: '' },
    error: { type: String, default: '' }
  },
  { _id: false }
);

const positiveScanSchema = new mongoose.Schema(
  {
    operatorId: { type: mongoose.Schema.Types.ObjectId },
    operatorName: { type: String, default: '' },
    lieu: { type: String, default: '' },
    note: { type: String, default: '' },
    photosCount: { type: Number, default: 0 },
    photos: { type: [photoResultSchema], default: [] },
    totals: {
      type: [
        {
          name: { type: String, required: true },
          count: { type: Number, default: 0 },
          isNewLabel: { type: Boolean, default: false }
        }
      ],
      default: []
    },
    catalogSnapshotSize: { type: Number, default: 0 }
  },
  { timestamps: true }
);

positiveScanSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PositiveScan', positiveScanSchema);
