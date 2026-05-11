/**
 * Catalogue produits pour Positive (comptage d'inventaire via vision IA).
 *
 * On stocke un document unique (singleton logique) par site. Le code se débrouille
 * pour récupérer "le" document (le premier trouvé, créé à la demande).
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    canonical: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    category: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  { _id: true, timestamps: false }
);

const positiveCatalogSchema = new mongoose.Schema(
  {
    products: { type: [productSchema], default: [] },
    excluded: { type: [String], default: [] }
  },
  { timestamps: true }
);

positiveCatalogSchema.statics.getOrCreate = async function () {
  let cat = await this.findOne();
  if (!cat) {
    cat = await this.create({ products: [], excluded: [] });
  }
  return cat;
};

module.exports = mongoose.model('PositiveCatalog', positiveCatalogSchema);
