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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AmbassadorClient', ambassadorClientSchema);
