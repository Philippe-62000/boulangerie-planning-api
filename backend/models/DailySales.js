const mongoose = require('mongoose');

const dailySalesSchema = new mongoose.Schema({
  saleCode: {
    type: String,
    required: true,
    trim: true,
    length: 3,
    comment: 'Code vendeuse à 3 chiffres'
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true,
    comment: 'Date de la vente'
  },
  nbPromo: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    comment: 'Nombre de Promo Quinzaine du jour'
  },
  nbCartesFid: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    comment: 'Nombre de Cartes Fidélité du jour'
  },
  nbChallenge: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
    comment: 'Nombre de Challenge du jour'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour éviter les doublons (une vendeuse ne peut pas saisir deux fois le même jour)
dailySalesSchema.index({ saleCode: 1, date: 1 }, { unique: true });

// Index pour les recherches par date
dailySalesSchema.index({ date: 1 });

// Index pour les recherches par employé
dailySalesSchema.index({ employeeId: 1 });

// Index composé pour les recherches par semaine
dailySalesSchema.index({ date: 1, employeeId: 1 });

module.exports = mongoose.model('DailySales', dailySalesSchema);




