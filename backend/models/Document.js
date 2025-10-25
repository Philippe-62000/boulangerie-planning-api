const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    comment: 'Titre du document'
  },
  type: {
    type: String,
    enum: ['general', 'personal'],
    required: true,
    comment: 'Type de document: general (pour tous) ou personal (spécifique à un employé)'
  },
  category: {
    type: String,
    required: true,
    enum: ['notice', 'procedure', 'formation', 'payslip', 'contract', 'other'],
    comment: 'Catégorie du document'
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: function() {
      return this.type === 'personal';
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
  }).sort({ uploadDate: -1 });
};

// Méthode statique pour récupérer les documents personnels d'un employé
documentSchema.statics.getPersonalDocuments = async function(employeeId) {
  return await this.find({ 
    type: 'personal', 
    employeeId: employeeId,
    isActive: true 
  }).sort({ uploadDate: -1 });
};

// Méthode statique pour marquer un téléchargement
documentSchema.statics.recordDownload = async function(documentId) {
  return await this.findByIdAndUpdate(
    documentId,
    { 
      $inc: { downloadCount: 1 },
      lastDownloadDate: new Date()
    },
    { new: true }
  );
};

// Méthode statique pour nettoyer les documents expirés
documentSchema.statics.cleanExpiredDocuments = async function() {
  const now = new Date();
  const expiredDocs = await this.find({
    type: 'personal',
    expiryDate: { $lt: now },
    isActive: true
  });
  
  if (expiredDocs.length > 0) {
    await this.updateMany(
      { 
        type: 'personal',
        expiryDate: { $lt: now },
        isActive: true 
      },
      { isActive: false }
    );
    
    console.log(`🧹 ${expiredDocs.length} documents personnels expirés désactivés`);
  }
  
  return expiredDocs.length;
};

// Méthode statique pour créer un document personnel avec expiration
documentSchema.statics.createPersonalDocument = async function(docData) {
  // Calculer la date d'expiration (1 mois après l'upload)
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 1);
  
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

// Méthode pour vérifier si un document est expiré
documentSchema.methods.isExpired = function() {
  if (this.type === 'general') return false;
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
    'other': '📁 Autre'
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
