const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BCRYPT_PATTERN = /^\$2[aby]\$\d+\$/;

const camarisManagerSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon'], default: 'lon', index: true },
    login: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    displayName: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

camarisManagerSchema.pre('save', async function preSave() {
  if (!this.isModified('password')) return;
  if (typeof this.password !== 'string' || !this.password.length) return;
  if (BCRYPT_PATTERN.test(this.password)) return;
  this.password = await bcrypt.hash(this.password, 10);
});

camarisManagerSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

const camarisAnimationSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon'], default: 'lon', index: true },
    weekKey: { type: String, required: true, index: true },
    daysOfWeek: { type: [Number], default: [] },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    body: { type: String, default: '', trim: true, maxlength: 4000 },
    isActive: { type: Boolean, default: true },
    updatedByManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'CamarisManager', default: null }
  },
  { timestamps: true }
);

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

const CamarisManager =
  mongoose.models.CamarisManager || mongoose.model('CamarisManager', camarisManagerSchema);
const CamarisAnimation =
  mongoose.models.CamarisAnimation || mongoose.model('CamarisAnimation', camarisAnimationSchema);
const CamarisTerritoryEvent =
  mongoose.models.CamarisTerritoryEvent ||
  mongoose.model('CamarisTerritoryEvent', camarisTerritoryEventSchema);

const camarisVisitCounterSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['lon'], default: 'lon', unique: true },
    totalVisits: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const CamarisVisitCounter =
  mongoose.models.CamarisVisitCounter || mongoose.model('CamarisVisitCounter', camarisVisitCounterSchema);

module.exports = { CamarisManager, CamarisAnimation, CamarisTerritoryEvent, CamarisVisitCounter };
