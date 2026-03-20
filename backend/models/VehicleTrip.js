const mongoose = require('mongoose');

const vehicleTripSchema = new mongoose.Schema({
  site: {
    type: String,
    enum: ['longuenesse', 'arras'],
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  kmDepart: { type: Number, required: true },
  etatInterieur: { type: Number, min: 1, max: 5, required: true },
  etatExterieur: { type: Number, min: 1, max: 5, required: true },
  remarquesDepart: { type: String, default: '', maxlength: 2000 },
  dateDepart: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['en_cours', 'termine'],
    default: 'en_cours'
  },
  destination: { type: String, default: '' },
  kmRetour: { type: Number, default: null },
  dateRetour: { type: Date, default: null },
  problemeVoyantMoteur: { type: Boolean, default: false },
  problemeAutre: { type: Boolean, default: false },
  problemeRemarque: { type: String, default: '', maxlength: 2000 },
  todoLaveGlace: { type: Boolean, default: false },
  todoPneu: { type: Boolean, default: false },
  todoRevision: { type: Boolean, default: false },
  todoPlein: { type: Boolean, default: false },
  todoLaveGlaceFait: { type: Boolean, default: false },
  todoPneuFait: { type: Boolean, default: false },
  todoRevisionFait: { type: Boolean, default: false },
  todoPleinFait: { type: Boolean, default: false },
  /** Photo du retour sur le NAS (chemin relatif ex. vehicule/xxx.jpg) */
  photoRetourPath: { type: String, default: null },
  photoRetourFileName: { type: String, default: null },
  photoRetourMimeType: { type: String, default: null },
  /** Admin : masquer la ligne dans la liste des problèmes */
  problemesIgnores: { type: Boolean, default: false },
  pleinEffectue: { type: Boolean, default: false },
  pleinDate: { type: Date, default: null },
  pleinKm: { type: Number, default: null },
  pleinParEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  }
}, { timestamps: true });

vehicleTripSchema.index({ site: 1, status: 1, dateDepart: -1 });

module.exports = mongoose.model('VehicleTrip', vehicleTripSchema);
