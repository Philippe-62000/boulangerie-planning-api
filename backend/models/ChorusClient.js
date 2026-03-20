const mongoose = require('mongoose');

const chorusClientSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  remarques: { type: String, default: '', trim: true },
  site: {
    type: String,
    enum: ['longuenesse', 'arras'],
    required: true,
    index: true
  }
}, { timestamps: true });

chorusClientSchema.index({ site: 1, nom: 1 });

module.exports = mongoose.model('ChorusClient', chorusClientSchema);
