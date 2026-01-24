const mongoose = require('mongoose');

const dailyLossesSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    comment: 'Date de la journée'
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2040
  },
  city: {
    type: String,
    required: true,
    default: 'longuenesse',
    enum: ['arras', 'longuenesse'],
    comment: 'Ville du magasin'
  },
  invendus: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    comment: 'Montant des invendus en euros'
  },
  dons: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    comment: 'Montant des dons en euros'
  },
  caisse1: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    comment: 'Montant caisse 1 en euros'
  },
  caisse2: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    comment: 'Montant caisse 2 en euros'
  },
  caisse3: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    comment: 'Montant caisse 3 en euros'
  },
  caisse4: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    comment: 'Montant caisse 4 en euros'
  },
  // Champs calculés (calculés automatiquement)
  totalPertes: {
    type: Number,
    default: 0,
    comment: 'Total pertes = invendus + dons'
  },
  totalVentes: {
    type: Number,
    default: 0,
    comment: 'Total ventes = caisse1 + caisse2 + caisse3 + caisse4'
  },
  pourcentagePertes: {
    type: Number,
    default: 0,
    comment: 'Pourcentage des pertes par rapport aux ventes (%)'
  }
}, {
  timestamps: true
});

// Index unique sur date + city pour éviter les doublons
dailyLossesSchema.index({ date: 1, city: 1 }, { unique: true });

// Index pour les recherches par mois/année/ville
dailyLossesSchema.index({ month: 1, year: 1, city: 1 });

// Hook pre-save pour calculer les totaux et le pourcentage
dailyLossesSchema.pre('save', function(next) {
  // Calculer le total des pertes
  this.totalPertes = (this.invendus || 0) + (this.dons || 0);
  
  // Calculer le total des ventes
  this.totalVentes = (this.caisse1 || 0) + (this.caisse2 || 0) + 
                     (this.caisse3 || 0) + (this.caisse4 || 0);
  
  // Calculer le pourcentage des pertes
  if (this.totalVentes > 0) {
    this.pourcentagePertes = Math.round((this.totalPertes / this.totalVentes) * 100 * 100) / 100; // 2 décimales
  } else {
    this.pourcentagePertes = 0;
  }
  
  next();
});

module.exports = mongoose.model('DailyLosses', dailyLossesSchema);
