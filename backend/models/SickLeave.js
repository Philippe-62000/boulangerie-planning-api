const mongoose = require('mongoose');

const sickLeaveSchema = new mongoose.Schema({
  // Informations de base
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  employeeEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  // Dates
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
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
    enum: ['pending', 'validated', 'declared', 'rejected'],
    default: 'pending'
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  isDeclared: {
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
  
  // Déclaration
  declaration: {
    declaredBy: {
      type: String,
      default: ''
    },
    declaredAt: {
      type: Date
    },
    declarationNotes: {
      type: String,
      default: ''
    }
  },
  
  // Envoi au comptable
  accountantNotification: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date
    },
    sentTo: {
      type: String,
      default: ''
    }
  },
  
  // Envoi de confirmation au salarié
  confirmationEmail: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date
    },
    messageId: {
      type: String,
      default: ''
    }
  },
  
  // Envoi de validation au salarié
  validationEmail: {
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date
    },
    messageId: {
      type: String,
      default: ''
    }
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
sickLeaveSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index pour les recherches
sickLeaveSchema.index({ employeeName: 1, uploadDate: -1 });
sickLeaveSchema.index({ status: 1 });
sickLeaveSchema.index({ startDate: 1, endDate: 1 });

// Méthodes virtuelles
sickLeaveSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
  }
  return 0;
});

sickLeaveSchema.virtual('isOverdue').get(function() {
  // Considérer comme en retard si plus de 48h sans validation
  const now = new Date();
  const diffHours = (now - this.uploadDate) / (1000 * 60 * 60);
  return diffHours > 48 && this.status === 'pending';
});

// Méthodes d'instance
sickLeaveSchema.methods.markAsValidated = function(validatedBy, notes = '') {
  this.status = 'validated';
  this.isValidated = true;
  this.manualValidation.validatedBy = validatedBy;
  this.manualValidation.validatedAt = new Date();
  this.manualValidation.validationNotes = notes;
  return this.save();
};

sickLeaveSchema.methods.markAsDeclared = function(declaredBy, notes = '') {
  this.status = 'declared';
  this.isDeclared = true;
  this.declaration.declaredBy = declaredBy;
  this.declaration.declaredAt = new Date();
  this.declaration.declarationNotes = notes;
  return this.save();
};

sickLeaveSchema.methods.markAsRejected = function(rejectedBy, reason = '') {
  this.status = 'rejected';
  this.manualValidation.validatedBy = rejectedBy;
  this.manualValidation.validatedAt = new Date();
  this.manualValidation.validationNotes = reason;
  return this.save();
};

// Méthodes statiques
sickLeaveSchema.statics.getStats = async function() {
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
    declared: 0,
    rejected: 0,
    total: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

sickLeaveSchema.statics.getOverdueCount = async function() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
  
  return await this.countDocuments({
    status: 'pending',
    uploadDate: { $lt: twoDaysAgo }
  });
};

module.exports = mongoose.model('SickLeave', sickLeaveSchema);
