const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: { type: String, trim: true, default: '' },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  label: { type: String, required: true, trim: true, maxlength: 200 },
  quantity: { type: Number, required: true, min: 0.01, max: 99999 }
}, { timestamps: true });

workLogSchema.index({ employeeId: 1, date: 1 });
workLogSchema.index({ date: 1, employeeName: 1 });

module.exports = mongoose.model('WorkLog', workLogSchema);
