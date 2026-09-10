const mongoose = require('mongoose');
const { defaultSettings, defaultWords } = require('../services/staffPlanningHours');

const wordSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, uppercase: true },
  hours: { type: Number, default: 0, min: 0 },
  category: {
    type: String,
    enum: ['repos', 'formation', 'cp', 'maladie', 'absence', 'ferie', 'autre'],
    default: 'autre'
  },
  countsInTotal: { type: Boolean, default: false },
  countsAsSick: { type: Boolean, default: false }
}, { _id: false });

const staffPlanningSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true },
  sundayOpen: { type: Boolean, default: false },
  breakThresholdHours: { type: Number, default: 5, min: 0, max: 12 },
  breakMinutes: { type: Number, default: 30, min: 0, max: 120 },
  maxDayHours: { type: Number, default: 10, min: 1, max: 16 },
  minRestHours: { type: Number, default: 11, min: 0, max: 24 },
  maxSplitGapHours: { type: Number, default: 3, min: 0, max: 12 },
  nightStart: { type: String, default: '21:00' },
  nightEnd: { type: String, default: '06:00' },
  ot25FromHour: { type: Number, default: 36, min: 1, max: 60 },
  ot25ToHour: { type: Number, default: 43, min: 1, max: 60 },
  ot50FromHour: { type: Number, default: 44, min: 1, max: 80 },
  defaultCfaCode: { type: String, default: 'CFA8' },
  words: { type: [wordSchema], default: defaultWords }
}, { timestamps: true });

staffPlanningSettingsSchema.statics.getSingleton = async function getSingleton() {
  const defaults = defaultSettings();
  let doc = await this.findOne({ key: 'default' });
  if (!doc) {
    doc = await this.create({ key: 'default', ...defaults });
  }
  if (!Array.isArray(doc.words) || doc.words.length === 0) {
    doc.words = defaultWords();
    await doc.save();
  } else {
    const filtered = doc.words.filter((word) => (
      String(word.code).toUpperCase() !== 'FERIE' && word.category !== 'ferie'
    ));
    if (filtered.length !== doc.words.length) {
      doc.words = filtered;
      await doc.save();
    }
  }
  return doc;
};

module.exports = mongoose.model('StaffPlanningSettings', staffPlanningSettingsSchema);
