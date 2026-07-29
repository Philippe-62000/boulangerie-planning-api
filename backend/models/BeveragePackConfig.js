const mongoose = require('mongoose');

/** Préférences par référence : taille de colis + ordre d’affichage / commande. */
const beveragePackConfigSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['plan', 'lon'], required: true, index: true },
    name: { type: String, required: true, trim: true },
    packSize: { type: Number, enum: [12, 24], default: 12 },
    /** Ordre dans la liste (aligné sur le bon de commande fournisseur). */
    sortOrder: { type: Number, default: 9999 }
  },
  { timestamps: true }
);

beveragePackConfigSchema.index({ siteKey: 1, name: 1 }, { unique: true });
beveragePackConfigSchema.index({ siteKey: 1, sortOrder: 1 });

module.exports = mongoose.model('BeveragePackConfig', beveragePackConfigSchema);
