const mongoose = require('mongoose');

/** 1 = lundi … 7 = dimanche */
const camarisAnimationSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon'], default: 'lon', index: true },
    weekKey: { type: String, required: true, index: true },
    daysOfWeek: {
      type: [Number],
      default: [],
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.every((d) => Number.isInteger(d) && d >= 1 && d <= 7);
        },
        message: 'daysOfWeek : entiers 1 (lundi) à 7 (dimanche)'
      }
    },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    body: { type: String, default: '', trim: true, maxlength: 4000 },
    isActive: { type: Boolean, default: true },
    updatedByManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CamarisManager', default: null }
  },
  { timestamps: true }
);

camarisAnimationSchema.index({ siteKey: 1, weekKey: 1 });

module.exports = mongoose.model('CamarisAnimation', camarisAnimationSchema);
