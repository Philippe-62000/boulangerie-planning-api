const mongoose = require('mongoose');

const employeeMessageSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: 120,
    default: 'Information'
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  startDate: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now;
    }
  },
  endDate: {
    type: Date,
    default: null
  },
  untilRead: {
    type: Boolean,
    default: false
  },
  recipientsType: {
    type: String,
    enum: ['all', 'selected'],
    default: 'all'
  },
  selectedEmployees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'Administrateur'
  }
});

employeeMessageSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('EmployeeMessage', employeeMessageSchema);

