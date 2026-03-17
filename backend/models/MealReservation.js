const mongoose = require('mongoose');

const mealReservationSchema = new mongoose.Schema({
  clientProId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientPro',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  formuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formule',
    required: true
  },
  optionsChoisies: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  produitsAjoutes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit'
  }],
  produitsRetires: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit'
  }],
  quantite: {
    type: Number,
    required: true,
    min: 1
  },
  forfaitInstallation: {
    nbTables: Number,
    prix: Number
  },
  remarques: {
    type: String,
    default: ''
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmee', 'livree', 'annulee'],
    default: 'en_attente'
  },
  site: {
    type: String,
    enum: ['longuenesse', 'arras'],
    required: true
  }
}, {
  timestamps: true
});

mealReservationSchema.index({ clientProId: 1, date: 1 });
mealReservationSchema.index({ site: 1, date: 1 });
mealReservationSchema.index({ statut: 1 });

module.exports = mongoose.model('MealReservation', mealReservationSchema);
