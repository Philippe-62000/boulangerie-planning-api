const mongoose = require('mongoose');

const responsableTripTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  km: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  site: {
    type: String,
    required: true,
    enum: ['longuenesse', 'arras']
  },
  order: {
    type: Number,
    default: 0
  },
  isToll: {
    type: Boolean,
    default: false
  },
  isBoulangerie: {
    type: Boolean,
    default: false
  },
  isKmPerDay: {
    type: Boolean,
    default: false
  },
  importDays: {
    type: [Number],
    default: []
  },
  importMonth: { type: Number, min: 1, max: 12 },
  importYear: { type: Number, min: 2020, max: 2030 },
  deletedFromMonth: { type: Number, min: 1, max: 12 },
  deletedFromYear: { type: Number, min: 2020, max: 2030 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

responsableTripTypeSchema.index({ site: 1, order: 1 });
responsableTripTypeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ResponsableTripType', responsableTripTypeSchema);
