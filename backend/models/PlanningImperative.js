const mongoose = require('mongoose');

const planningImperativeSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  kind: {
    type: String,
    enum: ['rest', 'unavailable'],
    required: true
  },
  startTime: {
    type: String,
    default: ''
  },
  endTime: {
    type: String,
    default: ''
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

planningImperativeSchema.index(
  { employeeId: 1, date: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

planningImperativeSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('PlanningImperative', planningImperativeSchema);
