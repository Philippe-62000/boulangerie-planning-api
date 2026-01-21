const mongoose = require('mongoose');

const accountantCommentSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2040
  },
  comment: {
    type: String,
    default: '',
    maxlength: 5000 // Limite raisonnable pour 10 lignes
  }
}, {
  timestamps: true
});

// Index unique sur month + year pour éviter les doublons
accountantCommentSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('AccountantComment', accountantCommentSchema);
