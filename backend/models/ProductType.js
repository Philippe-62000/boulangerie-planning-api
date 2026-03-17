const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    trim: true
  },
  ordre: {
    type: Number,
    default: 0
  },
  site: {
    type: String,
    enum: ['longuenesse', 'arras'],
    required: true,
    default: 'longuenesse'
  }
}, {
  timestamps: true
});

productTypeSchema.index({ site: 1 });

module.exports = mongoose.model('ProductType', productTypeSchema);
