const mongoose = require('mongoose');

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
    /** Jours de formation ISO YYYY-MM-DD extraits ou dérivés */
    trainingDates: [{ type: String }],
    /** pdf-mem | weekdays | manual | none */
    datesSource: {
      type: String,
      enum: ['pdf-mem', 'weekdays', 'manual', 'none'],
      default: 'none'
    },
    label: { type: String, default: '' },
    uploadedByName: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApprenticePlanning', apprenticePlanningSchema);
