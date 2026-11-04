const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName: { type: String, default: '' },
  assignedAt: { type: Date, default: Date.now },
  viewedAt: { type: Date, default: null },
  signedAt: { type: Date, default: null },
  signatureDataUrl: { type: String, default: '' }
}, { _id: false });

const serviceNoteSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 120, default: 'Note de service' },
  content: { type: String, required: true, trim: true, maxlength: 8000 },
  audience: {
    type: String,
    enum: ['all', 'vente', 'boulanger', 'preparation'],
    default: 'all'
  },
  createdBy: { type: String, default: '' },
  recipients: { type: [recipientSchema], default: [] }
}, { timestamps: true });

serviceNoteSchema.index({ createdAt: -1 });
serviceNoteSchema.index({ 'recipients.employeeId': 1 });

module.exports = mongoose.model('ServiceNote', serviceNoteSchema);
