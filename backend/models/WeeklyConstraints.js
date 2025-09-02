const mongoose = require('mongoose');

const constraintSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  constraints: {
    Lundi: {
      type: String,
      enum: ['Repos', 'Formation', 'CP', 'MAL', 'Indisponible'],
      default: undefined
    },
    Mardi: {
      type: String,
      enum: ['Repos', 'Formation', 'CP', 'MAL', 'Indisponible'],
      default: undefined
    },
    Mercredi: {
      type: String,
      enum: ['Repos', 'Formation', 'CP', 'MAL', 'Indisponible'],
      default: undefined
    },
    Jeudi: {
      type: String,
      enum: ['Repos', 'Formation', 'CP', 'MAL', 'Indisponible'],
      default: undefined
    },
    Vendredi: {
      type: String,
      enum: ['Repos', 'Formation', 'CP', 'MAL', 'Indisponible'],
      default: undefined
    },
    Samedi: {
      type: String,
      enum: ['Repos', 'Formation', 'CP', 'MAL', 'Indisponible'],
      default: undefined
    },
    Dimanche: {
      type: String,
      enum: ['Repos', 'Formation', 'CP', 'MAL', 'Indisponible'],
      default: undefined
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index composé pour éviter les doublons
constraintSchema.index({ weekNumber: 1, year: 1, employeeId: 1 }, { unique: true });

// Middleware pour mettre à jour updatedAt
constraintSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WeeklyConstraints', constraintSchema);

