const mongoose = require('mongoose');

const productLineSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    name: { type: String, required: true },
    ventesQty: { type: Number, default: 0 },
    offertsQty: { type: Number, default: 0 },
    consumedQty: { type: Number, default: 0 },
    stockQty: { type: Number, default: 0 },
    marginPercent: { type: Number, default: 10 },
    toOrderQty: { type: Number, default: 0 }
  },
  { _id: false }
);

const beverageOrderProposalSchema = new mongoose.Schema(
  {
    siteKey: { type: String, enum: ['plan', 'lon'], required: true, index: true },
    periodLabel: { type: String, default: '' },
    sourceFileName: { type: String, default: '' },
    marginPercent: { type: Number, default: 10 },
    note: { type: String, default: 'Commande le jeudi pour livraison le mardi' },
    products: [productLineSchema]
  },
  { timestamps: true }
);

beverageOrderProposalSchema.index({ siteKey: 1, createdAt: -1 });

module.exports = mongoose.model('BeverageOrderProposal', beverageOrderProposalSchema);
