const mongoose = require('mongoose');

const kmTripRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  employeeEmail: {
    type: String,
    default: '',
    trim: true
  },
  tripDate: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  parameterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parameter',
    required: true
  },
  parameterName: {
    type: String,
    required: true,
    trim: true
  },
  kmValue: {
    type: Number,
    default: 0,
    min: 0
  },
  remark: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending',
    index: true
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
  }
}, {
  timestamps: true
});

kmTripRequestSchema.index({ status: 1, createdAt: -1 });
kmTripRequestSchema.index({ employeeId: 1, createdAt: -1 });

module.exports = mongoose.model('KmTripRequest', kmTripRequestSchema);
