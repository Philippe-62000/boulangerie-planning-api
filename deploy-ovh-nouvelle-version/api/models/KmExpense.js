const mongoose = require('mongoose');

const kmExpenseSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
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
    max: 2030
  },
  parameterValues: [{
    parameterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parameter',
      required: true
    },
    parameterName: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    kmValue: {
      type: Number,
      default: 0,
      min: 0
    },
    totalKm: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  totalKm: {
    type: Number,
    default: 0,
    min: 0
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
kmExpenseSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Middleware pour mettre à jour updatedAt
kmExpenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware pour calculer le total automatiquement
kmExpenseSchema.pre('save', function(next) {
  // Calculer le total pour chaque paramètre
  this.parameterValues.forEach(param => {
    param.totalKm = param.count * param.kmValue;
  });
  
  // Calculer le total général
  this.totalKm = this.parameterValues.reduce((total, param) => total + param.totalKm, 0);
  next();
});

module.exports = mongoose.model('KmExpense', kmExpenseSchema);
