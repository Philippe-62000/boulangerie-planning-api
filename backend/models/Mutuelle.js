const mongoose = require('mongoose');

const mutuelleSchema = new mongoose.Schema({
  // Informations de base
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  // Date d'upload
  uploadDate: {
    type: Date,
    default: Date.now
  },
  
  // Fichier
  fileName: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/jpg', 'application/pdf']
  },
  filePath: {
    type: String,
    required: true // Chemin sur le NAS
  },
  
  // Statut et validation
  status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending'
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  
  // Validation automatique
  autoValidation: {
    isReadable: {
      type: Boolean,
      default: false
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    validationMessage: {
      type: String,
      default: ''
    }
  },
  
  // Validation manuelle
  manualValidation: {
    validatedBy: {
      type: String,
      default: ''
    },
    validatedAt: {
      type: Date
    },
    validationNotes: {
      type: String,
      default: ''
    }
  },
  
  // Rejet
  rejection: {
    rejectedBy: {
      type: String,
      default: ''
    },
    rejectedAt: {
      type: Date
    },
    reason: {
      type: String,
      default: ''
    }
  },
  
  // Date d'expiration (pour rappel annuel)
  expirationDate: {
    type: Date,
    comment: 'Date à laquelle le justificatif expire (1 an après validation)'
  },
  
  // Notification de rappel
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },
  
  // Métadonnées
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
mutuelleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index pour les recherches
mutuelleSchema.index({ employeeId: 1, uploadDate: -1 });
mutuelleSchema.index({ status: 1 });
mutuelleSchema.index({ expirationDate: 1 });

// Méthodes d'instance
mutuelleSchema.methods.markAsValidated = function(validatedBy, notes = '') {
  this.status = 'validated';
  this.isValidated = true;
  this.manualValidation.validatedBy = validatedBy;
  this.manualValidation.validatedAt = new Date();
  this.manualValidation.validationNotes = notes;
  // Définir la date d'expiration à 1 an
  this.expirationDate = new Date();
  this.expirationDate.setFullYear(this.expirationDate.getFullYear() + 1);
  return this.save();
};

mutuelleSchema.methods.markAsRejected = function(rejectedBy, reason = '') {
  this.status = 'rejected';
  this.rejection.rejectedBy = rejectedBy;
  this.rejection.rejectedAt = new Date();
  this.rejection.reason = reason;
  return this.save();
};

// Méthodes statiques
mutuelleSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    pending: 0,
    validated: 0,
    rejected: 0,
    total: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

mutuelleSchema.statics.getExpiringSoon = async function(days = 30) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return await this.find({
    status: 'validated',
    expirationDate: {
      $gte: now,
      $lte: futureDate
    },
    reminderSent: false
  }).populate('employeeId', 'name email');
};

module.exports = mongoose.model('Mutuelle', mutuelleSchema);

