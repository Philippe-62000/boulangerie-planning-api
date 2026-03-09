const mongoose = require('mongoose');

const exchangePartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    comment: 'Nom de la boulangerie partenaire (ex: Boulangerie Liévin)'
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    comment: 'Adresse email du partenaire'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExchangePartner', exchangePartnerSchema);
