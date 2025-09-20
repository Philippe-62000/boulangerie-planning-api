const mongoose = require('mongoose');

const vacationRequestSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  employeeEmail: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    default: 'Arras'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: 'Congés payés'
  },
  precisions: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending'
  },
  validatedBy: {
    type: String,
    default: null
  },
  validatedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: String,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  originalFileName: {
    type: String,
    default: null
  },
  filePath: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
vacationRequestSchema.index({ employeeName: 1 });
vacationRequestSchema.index({ status: 1 });
vacationRequestSchema.index({ startDate: 1, endDate: 1 });

// Méthode pour marquer comme validé
vacationRequestSchema.methods.markAsValidated = function(validatedBy, notes) {
  this.status = 'validated';
  this.validatedBy = validatedBy;
  this.validatedAt = new Date();
  this.notes = notes;
  return this.save();
};

// Méthode pour marquer comme rejeté
vacationRequestSchema.methods.markAsRejected = function(rejectedBy, reason) {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

module.exports = mongoose.model('VacationRequest', vacationRequestSchema);
