const mongoose = require('mongoose');

const ambassadorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  couponValidityDays: {
    type: Number,
    default: 30,
    min: 1
  }
}, {
  timestamps: true
});

// Générer un code unique avant validation (pre('validate') s'exécute avant la validation)
ambassadorSchema.pre('validate', async function(next) {
  if (!this.isNew || this.code) return next;
  try {
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'AMB-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    let code = generateCode();
    let exists = await this.constructor.findOne({ code });
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generateCode();
      exists = await this.constructor.findOne({ code });
      attempts++;
    }
    this.code = code;
  } catch (err) {
    return next(err);
  }
  next();
});

module.exports = mongoose.model('Ambassador', ambassadorSchema);
