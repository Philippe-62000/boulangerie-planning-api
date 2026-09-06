const mongoose = require('mongoose');

const AUDIENCES = [
  'tous',
  'vente',
  'vendeuse_matin',
  'vendeuse_soir',
  'prepa',
  'boulangers'
];

const staffPrintMessageSchema = new mongoose.Schema(
  {
    site: {
      type: String,
      enum: ['arras', 'longuenesse', 'plan', 'lon'],
      required: true,
      index: true
    },
    audience: {
      type: String,
      enum: AUDIENCES,
      required: true
    },
    kind: {
      type: String,
      enum: ['message', 'commande-mail'],
      default: 'message'
    },
    message: {
      type: String,
      required: true,
      maxlength: 4000
    },
    createdByName: {
      type: String,
      default: ''
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    printedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

staffPrintMessageSchema.index({ site: 1, printedAt: 1, createdAt: 1 });

const StaffPrintMessage = mongoose.model('StaffPrintMessage', staffPrintMessageSchema);
StaffPrintMessage.AUDIENCES = AUDIENCES;
module.exports = StaffPrintMessage;
