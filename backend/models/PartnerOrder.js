const mongoose = require('mongoose');

const partnerOrderSchema = new mongoose.Schema(
  {
    site: { type: String, enum: ['longuenesse', 'arras'], default: 'longuenesse', index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerCompany', required: true, index: true },
    /** Snapshot à la commande (affichage admin même si le compte change). */
    companyName: { type: String, trim: true, default: '' },
    /** Personne à contacter pour cette livraison (saisie sur le site entreprise). */
    contactName: { type: String, trim: true, default: '' },

    fulfillment: { type: String, enum: ['delivery', 'pickup'], required: true },
    datetime: { type: Date, required: true, index: true },

    orderKind: {
      type: String,
      enum: ['formula', 'devis', 'commande', 'liste'],
      default: 'formula',
      index: true
    },
    requestDetail: { type: String, trim: true, default: '' },
    prospectFirstName: { type: String, trim: true, default: '' },
    prospectLastName: { type: String, trim: true, default: '' },
    prospectStructureName: { type: String, trim: true, default: '' },
    prospectPhone: { type: String, trim: true, default: '' },
    prospectEmail: { type: String, trim: true, default: '' },

    mealType: { type: String, enum: ['breakfast', 'lunch', null], default: null },
    tier: { type: String, enum: ['eco', 'classic', 'premium', null], default: null },

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
    statusUpdatedAt: { type: Date, default: Date.now },
    /** Historique des changements de statut (admin Filmara). */
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['submitted', 'acknowledged', 'invoiced', 'paid', 'cancelled'],
          required: true
        },
        at: { type: Date, required: true }
      }
    ],
    /** Échanges boulangerie ↔ client (site Vercel). */
    messages: [
      {
        from: { type: String, enum: ['bakery', 'client'], required: true },
        text: { type: String, required: true, trim: true, maxlength: 2000 },
        at: { type: Date, default: Date.now }
      }
    ],
    /** Masque l’alerte dashboard après lecture ou changement de statut. */
    messageAlertClearedAt: { type: Date, default: null },
    /** Id commande sur le site client Vercel (si Mongo distinct). */
    vercelOrderId: { type: String, trim: true, default: '', index: true }
  },
  { timestamps: true }
);

partnerOrderSchema.index({ site: 1, status: 1, datetime: 1 });

module.exports = mongoose.model('PartnerOrder', partnerOrderSchema);

