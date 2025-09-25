const mongoose = require('mongoose');

const absenceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['MAL', 'ABS', 'RET'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    trim: true
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

// Index pour optimiser les requêtes
absenceSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
absenceSchema.index({ type: 1, startDate: 1 });

// Middleware pour mettre à jour updatedAt
absenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Absence', absenceSchema);



