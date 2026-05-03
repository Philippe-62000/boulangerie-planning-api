const mongoose = require('mongoose');

const tierSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    description: { type: String, default: '', trim: true },
    items: [{ type: String, trim: true }],
    coffeeTeaLine: { type: String, default: '' },
    miniViennoiserieOptions: [{ type: String, trim: true }],
    juiceOptions: [{ type: String, trim: true }],
    lunchShowDietCounts: { type: Boolean, default: false },
    /** Listes de produits au choix (1 ligne = 1 nom) — même principe que mini-viennoiseries. */
    lunchEntreeOptions: [{ type: String, trim: true }],
    lunchPlatOptions: [{ type: String, trim: true }],
    lunchBoissonOptions: [{ type: String, trim: true }],
    lunchDessertOptions: [{ type: String, trim: true }],
    lunchCollationOptions: [{ type: String, trim: true }]
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

