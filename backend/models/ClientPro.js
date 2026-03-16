const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientProSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  adresse: {
    type: String,
    required: false,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  telephones: [{
    libelle: { type: String, default: 'Principal' },
    numero: { type: String, required: true }
  }],
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  site: {
    type: String,
    enum: ['longuenesse', 'arras'],
    required: true,
    default: 'longuenesse'
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

clientProSchema.index({ site: 1, login: 1 }, { unique: true });
clientProSchema.index({ site: 1 });

clientProSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('ClientPro', clientProSchema);
