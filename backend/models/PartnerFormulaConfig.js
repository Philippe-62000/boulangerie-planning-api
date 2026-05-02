const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    description: { type: String, default: '', trim: true },
    items: [{ type: String, trim: true }],
    /** Ligne affichée au client (café / thé thermos) */
    coffeeTeaLine: { type: String, default: '', trim: true },
    /** Choix paramétrables : une ligne = une mini-viennoiserie au choix */
    miniViennoiserieOptions: [{ type: String, trim: true }],
    /** Jus pressés au choix */
    juiceOptions: [{ type: String, trim: true }],
    /** Déjeuner : afficher les compteurs végétarien / hallal / sans lactose */
    lunchShowDietCounts: { type: Boolean, default: false }
  },
  { _id: false }
);

const partnerFormulaConfigSchema = new mongoose.Schema(
  {
    site: { type: String, enum: ['longuenesse', 'arras'], default: 'longuenesse', index: true },
    breakfast: {
      eco: { type: tierSchema, required: true },
      classic: { type: tierSchema, required: true },
      premium: { type: tierSchema, required: true }
    },
    lunch: {
      eco: { type: tierSchema, required: true },
      classic: { type: tierSchema, required: true },
      premium: { type: tierSchema, required: true }
    }
  },
  { timestamps: true }
);

partnerFormulaConfigSchema.index({ site: 1 }, { unique: true });

module.exports = mongoose.model('PartnerFormulaConfig', partnerFormulaConfigSchema);

