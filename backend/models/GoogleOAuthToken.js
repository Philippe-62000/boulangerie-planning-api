const mongoose = require('mongoose');

const googleOAuthTokenSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    unique: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: ''
  },
  expiryDate: {
    type: Date,
    default: null
  },
  email: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GoogleOAuthToken', googleOAuthTokenSchema);
