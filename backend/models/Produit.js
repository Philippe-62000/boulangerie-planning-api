const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  enRupture: {
    type: Boolean,
    default: false
  },
  visible: {
    type: Boolean,
    default: true
  },
  dateDebut: {
    type: Date,
    required: false
  },
  dateFin: {
    type: Date,
    required: false
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

produitSchema.index({ site: 1 });
produitSchema.index({ site: 1, enRupture: 1, visible: 1 });

module.exports = mongoose.model('Produit', produitSchema);
