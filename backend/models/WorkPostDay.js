const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'done', 'not_done', 'skipped'],
    default: 'pending'
  },
  reason: { type: String, default: '', maxlength: 500 }
}, { _id: false });

const workPostDaySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: { type: String, trim: true, default: '' },
  employeeRole: { type: String, default: '' },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  postes: [{ type: String }],
  answers: [answerSchema],
  validatedAt: { type: Date, default: null }
}, { timestamps: true });

workPostDaySchema.index({ employeeId: 1, date: 1 }, { unique: true });
workPostDaySchema.index({ date: 1 });

module.exports = mongoose.model('WorkPostDay', workPostDaySchema);
