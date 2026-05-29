const mongoose = require('mongoose');

const partnerOrderSchema = new mongoose.Schema(
  {
    site: { type: String, enum: ['longuenesse', 'arras'], default: 'longuenesse', index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerCompany', required: true, index: true },

    fulfillment: { type: String, enum: ['delivery', 'pickup'], required: true },
    datetime: { type: Date, required: true, index: true },

    mealType: { type: String, enum: ['breakfast', 'lunch'], required: true },
    tier: { type: String, enum: ['eco', 'classic', 'premium'], required: true },

    /** Nombre de formules commandées (ex. 6 petits déjeuners). */
    quantity: { type: Number, default: 1, min: 1 },

    /** Total mini-viennoiseries attendu (formules × inclus par formule). */
    miniViennoiserieTotal: { type: Number, default: 0 },
    miniViennoiserieDetail: [
      {
        name: { type: String, trim: true },
        quantity: { type: Number, min: 0 }
      }
    ],

    // snapshot: avoid changing past orders when admin edits formulas
    itemsSnapshot: {
      label: { type: String, default: '' },
      priceCents: { type: Number, default: 0 },
      description: { type: String, default: '' },
      items: [{ type: String }],
      miniViennoiserieCountPerFormula: { type: Number, default: 1 },
      miniViennoiserieOptions: [{ type: String }]
    },

    status: {
      type: String,
      enum: ['submitted', 'acknowledged', 'invoiced', 'paid', 'cancelled'],
      default: 'submitted',
      index: true
    },
    statusUpdatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

partnerOrderSchema.index({ site: 1, status: 1, datetime: 1 });

module.exports = mongoose.model('PartnerOrder', partnerOrderSchema);

