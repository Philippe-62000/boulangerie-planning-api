const mongoose = require('mongoose');

const diversPresetSchema = new mongoose.Schema({
  site: {
    type: String,
    required: true,
    enum: ['longuenesse', 'arras']
  },
  name: { type: String, required: true },
  km: { type: Number, min: 0, default: null },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

diversPresetSchema.index({ site: 1, name: 1 }, { unique: true });
diversPresetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('DiversPreset', diversPresetSchema);
