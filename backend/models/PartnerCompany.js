const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerCompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Personne référente (affichée sur le site entreprise et les commandes). */
    contactName: { type: String, trim: true, default: '' },
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
    /** Copie du hash bcrypt (même valeur que `password`) pour les clients qui lisent Mongo en direct et attendent ce nom (ex. app Vercel). */
    passwordHash: { type: String, required: false, select: false },
    active: { type: Boolean, default: true },
    /** Formules proposées sur le site commande Vercel : both | breakfast | lunch */
    mealTypesMode: {
      type: String,
      enum: ['both', 'breakfast', 'lunch'],
      default: 'both'
    },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true, collection: 'partnercompanies' }
);

partnerCompanySchema.index({ email: 1 }, { unique: true });
partnerCompanySchema.index({ site: 1, email: 1 });

partnerCompanySchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordHash = this.password;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('PartnerCompany', partnerCompanySchema);

