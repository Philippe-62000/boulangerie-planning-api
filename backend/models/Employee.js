jconst mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contractType: {
    type: String,
    enum: ['CDI', 'Apprentissage'],
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 16,
    max: 65
  },
  skills: [{
    type: String,
    enum: ['Ouverture', 'Fermeture', 'Management']
  }],
  role: {
    type: String,
    enum: ['vendeuse', 'apprenti', 'responsable', 'manager'],
    required: true
  },
  weeklyHours: {
    type: Number,
    required: true,
    min: 20,
    max: 39
  },
  trainingDays: [{
    type: String,
    enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  }],
  contractEndDate: {
    type: Date
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: function() {
      return this.contractType === 'Apprentissage';
    }
  },
  sickLeave: {
    isOnSickLeave: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

// Middleware pour mettre à jour updatedAt
employeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);

