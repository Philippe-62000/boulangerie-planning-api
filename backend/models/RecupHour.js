const mongoose = require('mongoose');

const recupHourSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  weekStart: {
    type: Date,
    required: true,
    index: true
  },
  hours: {
    type: Number,
    default: 0
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    default: null
  }
}, {
  timestamps: true
});

recupHourSchema.index({ employeeId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('RecupHour', recupHourSchema);


