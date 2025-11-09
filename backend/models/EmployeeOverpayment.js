const mongoose = require('mongoose');

const employeeOverpaymentSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2040
  },
  amount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

employeeOverpaymentSchema.index(
  { employeeId: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model('EmployeeOverpayment', employeeOverpaymentSchema);







