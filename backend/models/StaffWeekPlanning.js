const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true }
}, { _id: false });

const shiftSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    required: true
  },
  date: { type: String, required: true },
  kind: {
    type: String,
    enum: ['empty', 'shifts', 'code', 'hours'],
    default: 'empty'
  },
  code: { type: String, default: '' },
  shifts: { type: [shiftSchema], default: [] },
  volumeHours: { type: Number, default: 0 },
  paidHours: { type: Number, default: 0 },
  nightHours: { type: Number, default: 0 },
  sickDays: { type: Number, default: 0 },
  sickHours: { type: Number, default: 0 },
  cpHours: { type: Number, default: 0 },
  absenceHours: { type: Number, default: 0 },
  holidayHours: { type: Number, default: 0 },
  deductedBreakMinutes: { type: Number, default: 0 },
  isHoliday: { type: Boolean, default: false },
  alerts: { type: [alertSchema], default: [] }
}, { _id: false });

const rowSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName: { type: String, required: true },
  contractedHours: { type: Number, required: true },
  employeeCategory: { type: String, default: 'vente' },
  days: { type: [daySchema], default: [] },
  weeklyPaidHours: { type: Number, default: 0 },
  weeklyNightHours: { type: Number, default: 0 },
  weeklySickDays: { type: Number, default: 0 },
  weeklySickHours: { type: Number, default: 0 },
  weeklyCpHours: { type: Number, default: 0 },
  weeklyAbsenceHours: { type: Number, default: 0 },
  weeklyHolidayHours: { type: Number, default: 0 },
  weeklyOt25: { type: Number, default: 0 },
  weeklyOt50: { type: Number, default: 0 },
  alertCount: { type: Number, default: 0 }
}, { _id: false });

const staffWeekPlanningSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true, min: 1, max: 53 },
  year: { type: Number, required: true },
  status: {
    type: String,
    enum: ['draft', 'validated', 'sent'],
    default: 'draft'
  },
  sundayOpen: { type: Boolean, default: false },
  holidayDates: { type: [String], default: [] },
  ignoredHolidayDates: { type: [String], default: [] },
  validatedAt: { type: Date },
  validatedBy: { type: String, default: '' },
  lastSentAt: { type: Date },
  lastSentBy: { type: String, default: '' },
  sendCount: { type: Number, default: 0 },
  lastSendSummary: { type: String, default: '' },
  rows: { type: [rowSchema], default: [] }
}, { timestamps: true });

staffWeekPlanningSchema.index({ weekNumber: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('StaffWeekPlanning', staffWeekPlanningSchema);
