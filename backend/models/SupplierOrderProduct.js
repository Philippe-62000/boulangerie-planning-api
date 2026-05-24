const mongoose = require('mongoose');

const supplierOrderProductSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon', 'plan'], required: true, index: true },
    supplier: { type: String, enum: ['TGT', 'MILLANGE'], default: 'TGT', index: true },
    name: { type: String, required: true, trim: true },
    /** Référence fournisseur (ex. code TGT) */
    supplierCode: { type: String, default: '', trim: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOrderLocation', default: null },
    /** Libellé emplacement (secours si locationId orphelin après recréation des emplacements) */
    locationName: { type: String, default: '', trim: true },
    unit: { type: String, default: 'pièce', trim: true },
    /** Stock cible optionnel (pour aide au calcul futur) */
    targetStock: { type: Number, default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

supplierOrderProductSchema.index({ siteKey: 1, supplier: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SupplierOrderProduct', supplierOrderProductSchema);
