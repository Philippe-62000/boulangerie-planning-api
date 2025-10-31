const mongoose = require('mongoose');

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
  // CHAMP VACATION - CRÉÉ POUR LA SYNCHRONISATION DES CONGÉS
  // Ce champ permet de stocker l'état des congés de l'employé directement dans le modèle Employee
  // Il est synchronisé avec les VacationRequest validées via la route /sync-employees
  vacation: {
    isOnVacation: {
      type: Boolean,
      default: false,
      comment: 'Indique si l\'employé est actuellement en congés'
    },
    startDate: {
      type: Date,
      comment: 'Date de début des congés actuels'
    },
    endDate: {
      type: Date,
      comment: 'Date de fin des congés actuels'
    },
    vacationRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VacationRequest',
      comment: 'Référence vers la demande de congés validée'
    }
  },
  // CHAMP DELAYS - POUR LE SUIVI DES RETARDS
  // Stocke les retards de l'employé avec date et durée
  delays: [{
    date: {
      type: Date,
      required: true,
      comment: 'Date du retard'
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      comment: 'Durée du retard en minutes'
    },
    reason: {
      type: String,
      default: '',
      comment: 'Raison du retard (optionnel)'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      comment: 'Date de création de l\'enregistrement'
    }
  }],
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Format d\'email invalide'
    }
  },
  // Contact d'urgence
  emergencyContact: {
    lastName: {
      type: String,
      trim: true,
      comment: 'Nom de la personne à contacter en cas d\'urgence'
    },
    firstName: {
      type: String,
      trim: true,
      comment: 'Prénom de la personne à contacter en cas d\'urgence'
    },
    phone: {
      type: String,
      trim: true,
      comment: 'Numéro de téléphone de la personne à contacter en cas d\'urgence'
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Format d\'email invalide pour le contact d\'urgence'
      },
      comment: 'Email de la personne à contacter en cas d\'urgence'
    }
  },
  password: {
    type: String,
    select: false // Ne pas inclure par défaut dans les requêtes
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

