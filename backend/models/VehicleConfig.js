const mongoose = require('mongoose');

const vehicleConfigSchema = new mongoose.Schema({
  site: {
    type: String,
    enum: ['longuenesse', 'arras'],
    required: true,
    unique: true,
    index: true
  },
  /** Date du dernier ou prochain contrôle technique */
  controleTechniqueDate: { type: Date, default: null },
  /** Date de renouvellement (assurance / carte grise selon usage) */
  dateRenouvellement: { type: Date, default: null },
  prochaineRevisionKm: { type: Number, default: null },
  prochaineRevisionDate: { type: Date, default: null },
  rappelKmAvantRevision: { type: Number, default: 500 },
  rappelJoursAvantRevision: { type: Number, default: 30 },
  rappelJoursAvantCT: { type: Number, default: 30 },
  rappelJoursAvantRenouvellement: { type: Number, default: 30 }
}, { timestamps: true });

module.exports = mongoose.model('VehicleConfig', vehicleConfigSchema);
