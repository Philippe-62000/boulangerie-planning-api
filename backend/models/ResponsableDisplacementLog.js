const mongoose = require('mongoose');

const responsableDisplacementLogSchema = new mongoose.Schema({
  site: {
    type: String,
    required: true,
    enum: ['longuenesse', 'arras']
  },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, min: 2020, max: 2030 },
  day: { type: Number, required: true, min: 1, max: 31 },
  fromTripTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResponsableTripType' },
  toTripTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResponsableTripType', required: true },
  diversDetail: { type: String, default: '' },
  diversKm: { type: Number, min: 0 },
  comment: { type: String, default: '' },
  integrated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

responsableDisplacementLogSchema.index({ site: 1, month: 1, year: 1, integrated: 1 });

module.exports = mongoose.model('ResponsableDisplacementLog', responsableDisplacementLogSchema);
