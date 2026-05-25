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

camarisManagerSchema.index({ siteKey: 1, login: 1 }, { unique: true });

camarisManagerSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  if (typeof this.password !== 'string' || !this.password.length) return next();
  if (BCRYPT_PATTERN.test(this.password)) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

camarisManagerSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('CamarisManager', camarisManagerSchema);
