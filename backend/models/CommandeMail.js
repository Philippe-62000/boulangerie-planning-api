const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, default: '', trim: true },
    contentType: { type: String, default: '', trim: true },
    driveFileId: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const commandeMailSchema = new mongoose.Schema(
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
      enum: ['unread', 'read'],
      default: 'unread',
      index: true
    },
    receivedAt: { type: Date, default: Date.now, index: true },
    from: { type: String, default: '', trim: true, maxlength: 500 },
    to: { type: String, default: '', trim: true, maxlength: 1000 },
    subject: { type: String, default: '', trim: true, maxlength: 500 },
    snippet: { type: String, default: '', trim: true, maxlength: 500 },
    text: { type: String, default: '' },
    html: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    gmailMessageId: { type: String, default: '', trim: true },
    gmailThreadId: { type: String, default: '', trim: true },
    dedupeKey: { type: String, trim: true },
    readAt: { type: Date, default: null },
    readByName: { type: String, default: '', trim: true }
  },
  { timestamps: true, versionKey: false }
);

commandeMailSchema.index({ site: 1, status: 1, receivedAt: -1 });
commandeMailSchema.index(
  { site: 1, dedupeKey: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('CommandeMail', commandeMailSchema);
