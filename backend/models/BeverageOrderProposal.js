const mongoose = require('mongoose');

const productLineSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    name: { type: String, required: true },
    ventesQty: { type: Number, default: 0 },
    offertsQty: { type: Number, default: 0 },
    consumedQty: { type: Number, default: 0 },
    /** Conso de la période précédente (pour affichage écart). */
    previousConsumedQty: { type: Number, default: null },
    stockQty: { type: Number, default: 0 },
    marginPercent: { type: Number, default: 10 },
    /** Unités par colis (12 ou 24). */
    packSize: { type: Number, enum: [12, 24], default: 12 },
    /** Ordre d’affichage (bon de commande). */
    sortOrder: { type: Number, default: 9999 },
    /** Unités manquantes avant arrondi colis. */
    toOrderQty: { type: Number, default: 0 },
    /** Nombre de colis à commander (arrondi au-dessus). */
    packsToOrder: { type: Number, default: 0 },
    /** Unités réellement commandées (= packs × packSize). */
    orderUnits: { type: Number, default: 0 }
  },
  { _id: false }
);

const beverageOrderProposalSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['plan', 'lon'], required: true, index: true },
    periodLabel: { type: String, default: '' },
    sourceFileName: { type: String, default: '' },
    marginPercent: { type: Number, default: 10 },
    note: { type: String, default: 'Commande le jeudi pour livraison le mardi' },
    /** Snapshot des ventes de la période immédiatement précédente (pour écarts). */
    previousPeriodLabel: { type: String, default: '' },
    previousSourceFileName: { type: String, default: '' },
    products: [productLineSchema],
    /** true = ventes courantes à réutiliser au prochain chargement de page. */
    isCurrent: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

beverageOrderProposalSchema.index({ siteKey: 1, createdAt: -1 });
beverageOrderProposalSchema.index({ siteKey: 1, isCurrent: 1, updatedAt: -1 });

module.exports = mongoose.model('BeverageOrderProposal', beverageOrderProposalSchema);
