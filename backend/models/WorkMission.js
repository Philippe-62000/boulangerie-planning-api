const mongoose = require('mongoose');

const workMissionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: { type: String, trim: true, default: '' },
  title: { type: String, required: true, trim: true, maxlength: 300 },
  detail: { type: String, default: '', maxlength: 1000 },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  employeeStatus: {
    type: String,
    enum: ['pending', 'done', 'not_done'],
    default: 'pending'
  },
  employeeNote: { type: String, default: '', maxlength: 500 },
  employeeUpdatedAt: { type: Date, default: null },
  supervisorStatus: {
    type: String,
    enum: ['', 'not_done', 'incomplete'],
    default: ''
  },
  supervisorNote: { type: String, default: '', maxlength: 500 },
  supervisedAt: { type: Date, default: null },
  createdByName: { type: String, default: '', maxlength: 120 }
}, { timestamps: true });

workMissionSchema.index({ employeeId: 1, date: 1 });
workMissionSchema.index({ date: 1, employeeName: 1 });

module.exports = mongoose.model('WorkMission', workMissionSchema);
