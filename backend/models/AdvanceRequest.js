const mongoose = require('mongoose');

const advanceRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeEmail: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 5000 // Limite de sécurité
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  deductionMonth: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  managerComment: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Méthodes statiques
advanceRequestSchema.statics.getByEmployeeId = async function(employeeId) {
  return await this.find({ employeeId, isActive: true }).sort({ createdAt: -1 });
};

advanceRequestSchema.statics.getPendingRequests = async function() {
  return await this.find({ status: 'pending', isActive: true })
    .populate('employeeId', 'name email role')
    .sort({ createdAt: -1 });
};

advanceRequestSchema.statics.getByMonth = async function(month) {
  return await this.find({ 
    deductionMonth: month, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('AdvanceRequest', advanceRequestSchema);
