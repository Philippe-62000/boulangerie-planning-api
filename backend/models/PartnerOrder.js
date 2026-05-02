const mongoose = require('mongoose');

const partnerOrderSchema = new mongoose.Schema(
  {
    site: { type: String, enum: ['longuenesse', 'arras'], default: 'longuenesse', index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerCompany', required: true, index: true },

    // External source tracking (e.g. Vercel quick-order app)
    source: { type: String, default: 'filmara', index: true },
    sourceId: { type: String, default: null, index: true },

    fulfillment: { type: String, enum: ['delivery', 'pickup'], required: true },
    datetime: { type: Date, required: true, index: true },

    mealType: { type: String, enum: ['breakfast', 'lunch'], required: true },
    tier: { type: String, enum: ['eco', 'classic', 'premium'], required: true },

    // snapshot: avoid changing past orders when admin edits formulas
    itemsSnapshot: {
      label: { type: String, default: '' },
      priceCents: { type: Number, default: 0 },
      description: { type: String, default: '' },
      items: [{ type: String }],
      quantity: { type: Number, default: 1 },
      remarks: { type: String, default: '' },
      selections: { type: mongoose.Schema.Types.Mixed, default: undefined }
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
partnerOrderSchema.index({ source: 1, sourceId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PartnerOrder', partnerOrderSchema);

