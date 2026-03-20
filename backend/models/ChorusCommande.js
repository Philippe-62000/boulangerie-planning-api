const mongoose = require('mongoose');

const chorusCommandeSchema = new mongoose.Schema({
  dateCommande: { type: Date, required: true },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChorusClient',
    required: true
  },
  /** en_cours | realisee | annulee */
  statut: {
    type: String,
    enum: ['en_cours', 'realisee', 'annulee'],
    default: 'en_cours'
  },
  /** Chemin relatif sur le NAS (ex: chorus/xxx_bon.pdf) */
  bonDeCommandeFilePath: { type: String, default: null },
  bonDeCommandeFileName: { type: String, default: null },
  bonDeCommandeMimeType: { type: String, default: null },
  /** Remarque libre sur la commande (court texte) */
  remarque: { type: String, default: '', maxlength: 500, trim: true },
  /** Montant TTC (€) */
  montantTtc: { type: Number, default: null },
  /** Numéro de bon de commande */
  numBonCommande: { type: String, default: '', maxlength: 80, trim: true },
  deposedChorus: { type: Boolean, default: false },
  misEnCaisse: { type: Boolean, default: false },
  paiementRecu: { type: Boolean, default: false },
  site: {
    type: String,
    enum: ['longuenesse', 'arras'],
    required: true,
    index: true
  }
}, { timestamps: true });

chorusCommandeSchema.index({ site: 1, dateCommande: -1 });

module.exports = mongoose.model('ChorusCommande', chorusCommandeSchema);
