const mongoose = require('mongoose');

const accountDepositSchema = new mongoose.Schema(
  {
    site: {
      type: String,
      enum: ['longuenesse', 'arras'],
      required: true,
      index: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    /** N° d'autorisation TPE (ex. NO AUTO sur le ticket) — optionnel */
    tpeAuthNumber: { type: String, trim: true, default: '' },
    /** Image PNG en data URL (signature client) */
    signatureImage: { type: String, required: true },
    createdByEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    createdByName: { type: String, default: '' },
    createdByEmail: { type: String, default: '' },
    /** Code vendeuse (3 chiffres) si connexion par code — pour traçabilité */
    registeredSaleCode: { type: String, default: '', trim: true },
    accountCredited: { type: Boolean, default: false },
    accountCreditedAt: { type: Date, default: null },
    accountCreditedById: { type: mongoose.Schema.Types.ObjectId, default: null },
    accountCreditedByName: { type: String, default: '' },
    putInRegister: { type: Boolean, default: false },
    putInRegisterAt: { type: Date, default: null },
    putInRegisterById: { type: mongoose.Schema.Types.ObjectId, default: null },
    putInRegisterByName: { type: String, default: '' }
  },
  { timestamps: true }
);

accountDepositSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AccountDeposit', accountDepositSchema);
