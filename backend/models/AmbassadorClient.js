const mongoose = require('mongoose');

const ambassadorClientSchema = new mongoose.Schema({
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
  ambassadorCode: {
    type: String,
    required: true,
    trim: true
  },
  ambassadorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambassador',
    default: null
  },
  giftReceived: {
    type: Boolean,
    default: false
  },
  giftClaimed: {
    type: Boolean,
    default: false
  },
  recordedBySaleCode: {
    type: String,
    trim: true,
    default: null
  },
  recordedByName: {
    type: String,
    trim: true,
    default: null
  },
  giftClaimedBySaleCode: {
    type: String,
    trim: true,
    default: null
  },
  giftClaimedByName: {
    type: String,
    trim: true,
    default: null
  },
  giftReceivedBySaleCode: {
    type: String,
    trim: true,
    default: null
  },
  giftReceivedByName: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AmbassadorClient', ambassadorClientSchema);
