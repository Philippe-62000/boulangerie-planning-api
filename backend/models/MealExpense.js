const mongoose = require('mongoose');

const mealExpenseSchema = new mongoose.Schema({
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
  dailyExpenses: [{
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 31
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  totalAmount: {
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
mealExpenseSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Middleware pour mettre à jour updatedAt
mealExpenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware pour calculer le total automatiquement
mealExpenseSchema.pre('save', function(next) {
  this.totalAmount = this.dailyExpenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  next();
});

module.exports = mongoose.model('MealExpense', mealExpenseSchema);

