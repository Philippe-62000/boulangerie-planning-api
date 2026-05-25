const mongoose = require('mongoose');

const camarisVisitDailySchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon'], default: 'lon', index: true },
    dateKey: { type: String, required: true, index: true },
    weekKey: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },
    count: { type: Number, default: 0 }
  },
  { timestamps: true }
);

camarisVisitDailySchema.index({ siteKey: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('CamarisVisitDaily', camarisVisitDailySchema);
