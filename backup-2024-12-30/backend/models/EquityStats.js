const mongoose = require('mongoose');

const employeeStatsSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  weekendOffCount: {
    type: Number,
    default: 0
  },
  lastWeekendOff: {
    type: Date,
    default: null
  },
  holidayWorkedCount: {
    type: Number,
    default: 0
  },
  lastHolidayWorked: {
    type: Date,
    default: null
  },
  mondayOffAfterSunday: {
    type: Number,
    default: 0
  },
  morningShifts: {
    type: Number,
    default: 0
  },
  closingShifts: {
    type: Number,
    default: 0
  },
  absences: {
    sickDays: {
      type: Number,
      default: 0
    },
    unauthorizedAbsences: {
      type: Number,
      default: 0
    },
    lateArrivals: {
      type: Number,
      default: 0
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const equityStatsSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  employeeStats: [employeeStatsSchema],
  globalStats: {
    totalWeekendOff: {
      type: Number,
      default: 0
    },
    totalHolidaysWorked: {
      type: Number,
      default: 0
    },
    averageWeekendOffPerEmployee: {
      type: Number,
      default: 0
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

// Index composé
equityStatsSchema.index({ weekNumber: 1, year: 1 }, { unique: true });

// Middleware pour mettre à jour updatedAt
equityStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour calculer les statistiques globales
equityStatsSchema.methods.calculateGlobalStats = function() {
  const totalEmployees = this.employeeStats.length;
  if (totalEmployees === 0) return;

  this.globalStats.totalWeekendOff = this.employeeStats.reduce((sum, emp) => sum + emp.weekendOffCount, 0);
  this.globalStats.totalHolidaysWorked = this.employeeStats.reduce((sum, emp) => sum + emp.holidayWorkedCount, 0);
  this.globalStats.averageWeekendOffPerEmployee = this.globalStats.totalWeekendOff / totalEmployees;
};

module.exports = mongoose.model('EquityStats', equityStatsSchema);

