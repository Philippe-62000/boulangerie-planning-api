const mongoose = require('mongoose');

const optionFormuleSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['choix_unique', 'choix_multiple'],
    default: 'choix_unique'
  },
  valeurs: [{
    type: String,
    required: true
  }]
}, { _id: false });

const formuleSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  prix: {
    type: Number,
    required: true,
    min: 0
  },
  options: [optionFormuleSchema],
  produitsInclus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit'
  }],
  actif: {
    type: Boolean,
    default: true
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

formuleSchema.index({ site: 1 });
formuleSchema.index({ site: 1, actif: 1 });

module.exports = mongoose.model('Formule', formuleSchema);
