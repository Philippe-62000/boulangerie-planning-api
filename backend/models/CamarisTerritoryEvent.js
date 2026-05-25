const mongoose = require('mongoose');

const camarisTerritoryEventSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon'], default: 'lon', index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, required: true, min: 1, max: 31 },
    year: { type: Number, default: null },
    scope: {
      type: String,
      enum: ['audomarois', 'pas-de-calais', 'france', 'local'],
      default: 'audomarois'
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

camarisTerritoryEventSchema.index({ siteKey: 1, month: 1, day: 1, year: 1 });

module.exports = mongoose.model('CamarisTerritoryEvent', camarisTerritoryEventSchema);
