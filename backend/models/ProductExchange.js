const mongoose = require('mongoose');

const productExchangeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    comment: 'Date de l\'échange'
  },
  productName: {
    type: String,
    required: true,
    trim: true,
    comment: 'Nom du produit'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Quantité'
  },
  detail: {
    type: String,
    default: '',
    trim: true,
    comment: 'Détail complémentaire'
  },
  fromPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExchangePartner',
    default: null,
    comment: 'Partenaire source (null = site actuel)'
  },
  toPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExchangePartner',
    default: null,
    comment: 'Partenaire destination (null = site actuel)'
  },
  settledAt: {
    type: Date,
    default: null,
    comment: 'Date de soldé'
  },
  invoicedAt: {
    type: Date,
    default: null,
    comment: 'Date de facturation'
  },
  paidAt: {
    type: Date,
    default: null,
    comment: 'Date de paiement'
  },
  // Pour tracer les envois d'emails (éviter doublons)
  emailSentOnCreate: { type: Boolean, default: false },
  emailSentOnSettled: { type: Boolean, default: false },
  emailSentOnInvoiced: { type: Boolean, default: false },
  emailSentOnPaid: { type: Boolean, default: false }
}, {
  timestamps: true
});

productExchangeSchema.index({ date: -1 });
productExchangeSchema.index({ fromPartnerId: 1, toPartnerId: 1 });

module.exports = mongoose.model('ProductExchange', productExchangeSchema);
