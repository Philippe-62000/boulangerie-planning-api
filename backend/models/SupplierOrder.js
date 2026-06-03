const mongoose = require('mongoose');

const supplierOrderLineSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOrderProduct' },
    productName: { type: String, required: true, trim: true },
    supplierCode: { type: String, default: '' },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOrderLocation' },
    locationName: { type: String, default: '' },
    /** Quantité reçue à la livraison (lundi) — BL ou reprise commande validée */
    receivedQty: { type: Number, default: null },
    /** @deprecated Utiliser cartonQty + unitQty ; conservé pour anciennes commandes */
    stockQty: { type: Number, default: null },
    cartonQty: { type: Number, default: null },
    unitQty: { type: Number, default: null },
    /** Consommation = reçu − stock restant */
    consumptionQty: { type: Number, default: null },
    /** Moyenne conso sur 3 semaines glissantes (commandes validées) */
    avgConsumptionQty: { type: Number, default: null },
    /** Prévision prochaine commande (moy. 3 sem. ou conso semaine en cours) */
    suggestedOrderQty: { type: Number, default: null },
    /** Cmd -1 … -6 : quantités des 6 derniers BL (tri par date commande) */
    lastOrderQty: { type: Number, default: null },
    prevOrderQty: { type: Number, default: null },
    cmdQty3: { type: Number, default: null },
    cmdQty4: { type: Number, default: null },
    cmdQty5: { type: Number, default: null },
    cmdQty6: { type: Number, default: null },
    orderQty: { type: Number, default: 0 }
  },
  { _id: false }
);

const supplierOrderSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon', 'plan'], required: true, index: true },
    supplier: { type: String, default: 'TGT', trim: true },
    /** Clé semaine de livraison (vendredi) : YYYY-MM-DD du vendredi */
    deliveryWeekKey: { type: String, required: true, index: true },
    deliveryDate: { type: Date, required: true },
    orderPlacedDate: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    lines: { type: [supplierOrderLineSchema], default: [] },
    createdByName: { type: String, default: '' },
    submittedByName: { type: String, default: '' },
    note: { type: String, default: '', maxlength: 500 },
    /** Imports Stocks TGT salariés cumulés pour le stock de la commande courante */
    employeeStockEntryIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TgtStockEntry' }],
      default: []
    }
  },
  { timestamps: true }
);

supplierOrderSchema.index({ siteKey: 1, deliveryWeekKey: 1, supplier: 1 }, { unique: true });
supplierOrderSchema.index({ siteKey: 1, status: 1, deliveryDate: -1 });

module.exports = mongoose.model('SupplierOrder', supplierOrderSchema);
