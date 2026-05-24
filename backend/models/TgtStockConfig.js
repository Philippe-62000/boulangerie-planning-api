const mongoose = require('mongoose');

/** Jours de saisie stocks TGT (0 = dimanche … 6 = samedi, comme Date.getDay()). */
const tgtStockConfigSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      enum: ['lon', 'plan'],
      required: true,
      unique: true
    },
    submissionDays: {
      type: [Number],
      default: [],
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
        },
        message: 'submissionDays doit contenir des entiers 0-6'
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TgtStockConfig', tgtStockConfigSchema);
