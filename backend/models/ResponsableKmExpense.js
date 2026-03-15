const mongoose = require('mongoose');

const responsableKmExpenseSchema = new mongoose.Schema({
  site: {
    type: String,
    required: true,
    enum: ['longuenesse', 'arras']
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
    max: 2030
  },
  responsibleEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  entries: [{
    tripTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResponsableTripType', required: true },
    day: { type: Number, required: true, min: 1, max: 31 },
    count: { type: Number, default: 1, min: 0 }
  }],
  tollAmountTTC: { type: Number, default: 0, min: 0 },
  tollAmountHT: { type: Number, default: 0, min: 0 },
  pdfImportedDates: [{ type: Number, min: 1, max: 31 }],
  diversComments: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

responsableKmExpenseSchema.index({ site: 1, month: 1, year: 1 }, { unique: true });
responsableKmExpenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ResponsableKmExpense', responsableKmExpenseSchema);
