const mongoose = require('mongoose');

/**
 * Remise du jour pour les dépôts "compte client".
 * On fige un snapshot (noms + montants) au moment où la remise est terminée,
 * afin de comparer simplement au nombre de tickets TPE ramenés.
 */
const accountDepositRemiseSchema = new mongoose.Schema(
  {
    site: {
      type: String,
      enum: ['longuenesse', 'arras'],
      required: true,
      index: true
    },
    /** Jour logique Europe/Paris au format YYYY-MM-DD */
    day: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'finished'],
      default: 'draft',
      index: true
    },
    /** Nombre de tickets TPE annoncé (pour comparaison) */
    declaredTicketCount: { type: Number, default: null, min: 0 },

    /** Compteur technique : incrémenté à chaque dépôt validé (sécurise la remise en cours) */
    progressCount: { type: Number, default: 0, min: 0 },

    /** Snapshot de la remise (figé à la validation) */
    depositsSnapshot: [
      {
        depositId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountDeposit' },
        firstName: { type: String, default: '', trim: true },
        lastName: { type: String, default: '', trim: true },
        amount: { type: Number, default: 0 }
      }
    ],
    depositsCount: { type: Number, default: 0, min: 0 },
    depositsTotal: { type: Number, default: 0, min: 0 },

    finishedAt: { type: Date, default: null },
    finishedById: { type: mongoose.Schema.Types.ObjectId, default: null },
    finishedByName: { type: String, default: '' }
  },
  { timestamps: true }
);

accountDepositRemiseSchema.index({ site: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('AccountDepositRemise', accountDepositRemiseSchema);
