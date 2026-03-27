const mongoose = require('mongoose');

/** Fiches de paie mal catégorisées (ex. « Autre ») : même règle que category === payslip */
const PAYSLIP_TITLE_REGEX = /fiche\s*(de\s*)?paie|bulletin\s*(de\s*)?paie|bulletin\s+de\s+salaire/i;

function isPayslipLikeFields(title, fileName, category) {
  if (category === 'payslip') return true;
  const t = `${title || ''} ${fileName || ''}`;
  return PAYSLIP_TITLE_REGEX.test(t);
}

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    comment: 'Titre du document'
  },
  type: {
    type: String,
    enum: ['general', 'personal', 'employee_upload'],
    required: true,
    comment: 'general, personal (admin→salarié) ou employee_upload (salarié→admin)'
  },
  category: {
    type: String,
    required: true,
    enum: ['notice', 'procedure', 'formation', 'payslip', 'contract', 'regulation', 'other', 'employee_submission'],
    comment: 'Catégorie du document'
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: function() {
      return this.type === 'personal' || this.type === 'employee_upload';
    },
    comment: 'ID de l\'employé pour les documents personnels'
  },
  filePath: {
    type: String,
    required: true,
    comment: 'Chemin complet du fichier sur le NAS'
  },
  fileName: {
    type: String,
    required: true,
    comment: 'Nom original du fichier'
  },
  fileSize: {
    type: Number,
    required: true,
    comment: 'Taille du fichier en octets'
  },
  mimeType: {
    type: String,
    required: true,
    comment: 'Type MIME du fichier'
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    comment: 'Date d\'upload du document'
  },
  expiryDate: {
    type: Date,
    comment: 'Date d\'expiration (pour les documents personnels)'
  },
  isActive: {
    type: Boolean,
    default: true,
    comment: 'Statut actif du document'
  },
  downloadCount: {
    type: Number,
    default: 0,
    comment: 'Nombre de téléchargements'
  },
  lastDownloadDate: {
    type: Date,
    comment: 'Date du dernier téléchargement'
  },
  downloads: [{
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    downloadDate: {
      type: Date,
      default: Date.now
    }
  }],
  description: {
    type: String,
    default: '',
    comment: 'Description optionnelle du document'
  },
  tags: [{
    type: String,
    trim: true
  }],
  uploadedBy: {
    type: String,
    default: 'admin',
    comment: 'Utilisateur qui a uploadé le document'
  },
  receiptConfirmedAt: {
    type: Date,
    default: null,
    comment: 'Date de confirmation de lecture (envois salarié→admin uniquement)'
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
documentSchema.index({ type: 1, isActive: 1 });
documentSchema.index({ employeeId: 1, type: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ expiryDate: 1 });

// Méthode statique pour récupérer les documents généraux
documentSchema.statics.getGeneralDocuments = async function() {
  return await this.find({ 
    type: 'general', 
    isActive: true 
  })
  .populate('downloads.employeeId', 'name email')
  .sort({ uploadDate: -1 });
};

// Méthode statique pour récupérer les documents personnels d'un employé
// Inclut TOUS les documents : actifs + expirés (pour permettre le téléchargement des fiches de paie historiques)
documentSchema.statics.getPersonalDocuments = async function(employeeId) {
  return await this.find({ 
    type: 'personal', 
    employeeId: employeeId
    // Plus de filtre isActive: true - les salariés voient toutes leurs fiches de paie
  }).sort({ uploadDate: -1 });
};

// Méthode statique pour marquer un téléchargement
documentSchema.statics.recordDownload = async function(documentId, employeeId = null) {
  const updateData = {
    $inc: { downloadCount: 1 },
    $set: { lastDownloadDate: new Date() }
  };
  
  // Si un employeeId est fourni, l'ajouter au tableau downloads
  if (employeeId) {
    updateData.$push = {
      downloads: {
        employeeId: employeeId,
        downloadDate: new Date()
      }
    };
  }
  
  return await this.findByIdAndUpdate(
    documentId,
    updateData,
    { new: true }
  );
};

// Méthode statique pour nettoyer les documents expirés
// Les fiches de paie (payslip) ne sont JAMAIS expirées - les salariés doivent y avoir accès indéfiniment
documentSchema.statics.cleanExpiredDocuments = async function() {
  const now = new Date();
  const candidates = await this.find({
    type: 'personal',
    category: { $ne: 'payslip' },
    expiryDate: { $lt: now, $ne: null },
    isActive: true
  });

  const idsToDeactivate = candidates
    .filter((doc) => !isPayslipLikeFields(doc.title, doc.fileName, doc.category))
    .map((doc) => doc._id);

  if (idsToDeactivate.length > 0) {
    await this.updateMany({ _id: { $in: idsToDeactivate } }, { isActive: false });
    console.log(`🧹 ${idsToDeactivate.length} documents personnels expirés désactivés (fiches de paie exclues)`);
  }

  return idsToDeactivate.length;
};

// Méthode statique pour créer un document personnel avec expiration
// Les fiches de paie (payslip) n'expirent jamais - les salariés doivent pouvoir les télécharger indéfiniment
documentSchema.statics.createPersonalDocument = async function(docData) {
  const isPayslip = isPayslipLikeFields(docData.title, docData.fileName, docData.category);
  
  // Fiches de paie : pas d'expiration. Autres documents : expiration 1 mois
  let expiryDate = null;
  if (!isPayslip) {
    expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  }
  
  const document = new this({
    ...docData,
    type: 'personal',
    expiryDate: expiryDate
  });
  
  return await document.save();
};

// Méthode statique pour créer un document général
documentSchema.statics.createGeneralDocument = async function(docData) {
  const document = new this({
    ...docData,
    type: 'general'
  });
  
  return await document.save();
};

// Document envoyé par un salarié vers l'administration (pas d'expiration)
documentSchema.statics.createEmployeeUploadDocument = async function(docData) {
  const document = new this({
    ...docData,
    type: 'employee_upload',
    category: 'employee_submission',
    expiryDate: null,
    isActive: true
  });
  return await document.save();
};

documentSchema.methods.isPayslipLike = function() {
  return isPayslipLikeFields(this.title, this.fileName, this.category);
};

// Méthode pour vérifier si un document est expiré
documentSchema.methods.isExpired = function() {
  if (this.type === 'general') return false;
  if (this.isPayslipLike()) return false;
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Méthode pour obtenir le temps restant avant expiration
documentSchema.methods.getTimeUntilExpiry = function() {
  if (this.type === 'general') return null;
  if (!this.expiryDate) return null;
  
  const now = new Date();
  const diff = this.expiryDate - now;
  
  if (diff <= 0) return 'Expiré';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
  return 'Moins d\'une heure';
};

// Labels des catégories
documentSchema.statics.getCategoryLabel = function(category) {
  const labels = {
    'notice': '📋 Notice',
    'procedure': '📝 Procédure',
    'formation': '🎓 Formation',
    'payslip': '💰 Fiche de paie',
    'contract': '📄 Contrat',
    'other': '📁 Autre',
    'employee_submission': '📤 Envoi salarié'
  };
  return labels[category] || category;
};

// Labels des types
documentSchema.statics.getTypeLabel = function(type) {
  const labels = {
    'general': 'Général',
    'personal': 'Personnel'
  };
  return labels[type] || type;
};

module.exports = mongoose.model('Document', documentSchema);
