const mongoose = require('mongoose');

const camarisVisitCounterSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon'], default: 'lon', unique: true },
    totalVisits: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CamarisVisitCounter', camarisVisitCounterSchema);
