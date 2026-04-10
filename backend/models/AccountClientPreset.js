const mongoose = require('mongoose');

const accountClientPresetSchema = new mongoose.Schema(
  {
    site: {
      type: String,
      enum: ['longuenesse', 'arras'],
      required: true,
      index: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

accountClientPresetSchema.index({ site: 1, lastName: 1, firstName: 1 });

module.exports = mongoose.model('AccountClientPreset', accountClientPresetSchema);
