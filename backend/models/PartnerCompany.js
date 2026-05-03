const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerCompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: false, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    /** Boutique (longuenesse / arras) — requis pour que le même Mongo soit lisible par le site Vercel (filtrage site + email). */
    site: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'longuenesse',
      index: true
    },
    password: { type: String, required: true, select: false },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

partnerCompanySchema.index({ email: 1 }, { unique: true });
partnerCompanySchema.index({ site: 1, email: 1 });

partnerCompanySchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('PartnerCompany', partnerCompanySchema);

