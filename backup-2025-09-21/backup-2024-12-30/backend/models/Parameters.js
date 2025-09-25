const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: false,
    default: ''
  },
  kmValue: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  stringValue: {
    type: String,
    required: false,
    default: ''
  },
  booleanValue: {
    type: Boolean,
    required: false,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour updatedAt
parameterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Parameter', parameterSchema);

