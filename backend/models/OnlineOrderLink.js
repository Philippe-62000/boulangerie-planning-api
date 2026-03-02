const mongoose = require('mongoose');

const onlineOrderLinkSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    default: 'longuenesse'
  },
  spreadsheetId: {
    type: String,
    required: true
  },
  className: {
    type: String,
    required: true
  },
  spreadsheetUrl: {
    type: String,
    required: false
  },
  monthGids: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour éviter les doublons par ville et classe
onlineOrderLinkSchema.index({ city: 1, className: 1 }, { unique: true });

module.exports = mongoose.model('OnlineOrderLink', onlineOrderLinkSchema);
