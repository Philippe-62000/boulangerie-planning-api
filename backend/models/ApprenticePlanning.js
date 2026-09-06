const mongoose = require('mongoose');

const trainingEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    kind: {
      type: String,
      enum: ['examen', 'cfa', 'insitu'],
      default: 'cfa'
    }
  },
  { _id: false }
);

const apprenticePlanningSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true
    },
    siteKey: {
      type: String,
      enum: ['plan', 'lon'],
      required: true,
      index: true
    },
    fileName: { type: String, required: true },
    originalName: { type: String, default: '' },
    filePath: { type: String, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    /** Jours ISO (compat) */
    trainingDates: [{ type: String }],
    /** Jours avec type de couleur (examen / cfa / insitu) */
    trainingEntries: [trainingEntrySchema],
    /** pdf-mem | weekdays | manual | none */
    datesSource: {
      type: String,
      enum: ['pdf-mem', 'weekdays', 'manual', 'none'],
      default: 'none'
    },
    /** Pôle magasin pour filtrer le planning global */
    shopPole: {
      type: String,
      enum: ['vente', 'preparation', 'boulanger'],
      default: 'vente',
      index: true
    },
    label: { type: String, default: '' },
    uploadedByName: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApprenticePlanning', apprenticePlanningSchema);
