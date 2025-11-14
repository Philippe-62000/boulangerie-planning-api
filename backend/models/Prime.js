const mongoose = require('mongoose');

const primeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    comment: 'Nom de la prime'
  },
  frequency: {
    type: String,
    enum: ['annuelle', 'mensuelle'],
    required: true,
    comment: 'Fréquence de la prime (annuelle ou mensuelle)'
  },
  amountLevel0: {
    type: Number,
    default: 0,
    comment: 'Montant pour le niveau 0 (non atteint)'
  },
  amountLevel1: {
    type: Number,
    required: true,
    comment: 'Montant pour le niveau 1 (atteint)'
  },
  amountLevel2: {
    type: Number,
    required: true,
    comment: 'Montant pour le niveau 2 (dépassé)'
  },
  isActive: {
    type: Boolean,
    default: true,
    comment: 'Statut actif de la prime'
  }
}, {
  timestamps: true
});

// Modèle pour l'affectation des primes aux salariés
const primeAssignmentSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  primeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prime',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    comment: 'Le salarié a-t-il accès à cette prime'
  }
}, {
  timestamps: true
});

// Index unique pour éviter les doublons
primeAssignmentSchema.index({ employeeId: 1, primeId: 1 }, { unique: true });

// Modèle pour le calcul mensuel des primes
const primeCalculationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  primeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prime',
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    comment: 'Mois (1-12)'
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2100,
    comment: 'Année'
  },
  level: {
    type: Number,
    enum: [0, 1, 2],
    required: true,
    default: 0,
    comment: 'Niveau atteint : 0 (non atteint), 1 (atteint), 2 (dépassé)'
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
    comment: 'Montant calculé selon le niveau'
  }
}, {
  timestamps: true
});

// Index unique pour éviter les doublons (un salarié ne peut avoir qu'un calcul par prime/mois/année)
primeCalculationSchema.index({ employeeId: 1, primeId: 1, month: 1, year: 1 }, { unique: true });

const Prime = mongoose.model('Prime', primeSchema);
const PrimeAssignment = mongoose.model('PrimeAssignment', primeAssignmentSchema);
const PrimeCalculation = mongoose.model('PrimeCalculation', primeCalculationSchema);

module.exports = {
  Prime,
  PrimeAssignment,
  PrimeCalculation
};

