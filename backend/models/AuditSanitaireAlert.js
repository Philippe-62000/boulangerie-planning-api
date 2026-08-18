const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, default: '', trim: true },
    driveFileId: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const auditSanitaireAlertSchema = new mongoose.Schema(
  {
    site: {
      type: String,
      enum: ['arras'],
      required: true,
      default: 'arras',
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'printed'],
      default: 'pending',
      index: true
    },
    receivedAt: { type: Date, default: Date.now },
    subject: { type: String, default: '', trim: true, maxlength: 500 },
    driveFolderUrl: { type: String, default: '', trim: true },
    driveFolderId: { type: String, default: '', trim: true },
    files: { type: [fileSchema], default: [] },
    /** Clé d'idempotence n8n (gmailMessageId, sinon dossier Drive, sinon empreinte fichiers). */
    dedupeKey: { type: String, trim: true },
    gmailMessageId: { type: String, default: '', trim: true },
    printedAt: { type: Date, default: null },
    printedByName: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

auditSanitaireAlertSchema.index({ site: 1, status: 1, receivedAt: -1 });
auditSanitaireAlertSchema.index(
  { site: 1, dedupeKey: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('AuditSanitaireAlert', auditSanitaireAlertSchema);
