const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  breakMinutes: {
    type: Number,
    default: 0
  },
  hoursWorked: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    // Doit rester aligné avec les rôles possibles du modèle Employee
    enum: [
      'vendeuse',
      'apprenti',
      'manager',
      'responsable',
      'Apprenti Vendeuse',
      'chef prod',
      'boulanger',
      'préparateur',
      'Apprenti Boulanger',
      'Apprenti Préparateur',
      'responsable magasin',
      'responsable magasin adjointe'
    ],
    required: true
  }
});

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    required: true
  },
  shifts: [shiftSchema],
  totalHours: {
    type: Number,
    default: 0
  },
  constraint: {
    type: String,
    enum: ['Repos', 'Formation', 'CP', 'MAL', 'Indisponible'],
    default: undefined
  }
});

const planningSchema = new mongoose.Schema({
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
  employeeName: {
    type: String,
    required: true
  },
  schedule: [dayScheduleSchema],
  totalWeeklyHours: {
    type: Number,
    default: 0
  },
  contractedHours: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['generated', 'validated', 'realized'],
    default: 'generated'
  },
  isValidated: {
    type: Boolean,
    default: false
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
planningSchema.index({ weekNumber: 1, year: 1, employeeId: 1 }, { unique: true });

// Middleware pour mettre à jour updatedAt
planningSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour calculer le total des heures hebdomadaires
planningSchema.methods.calculateTotalHours = function() {
  this.totalWeeklyHours = this.schedule.reduce((total, day) => {
    return total + day.totalHours;
  }, 0);
};

module.exports = mongoose.model('Planning', planningSchema);

