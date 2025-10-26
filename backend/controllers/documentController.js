const Document = require('../models/Document');
const Employee = require('../models/Employee');
const fs = require('fs');
const path = require('path');

// Configuration NAS (à adapter selon votre configuration)
const NAS_CONFIG = {
  basePath: process.env.NAS_BASE_PATH || '/path/to/your/nas/uploads/documents', // Chemin vers votre NAS
  generalPath: 'general',
  personalPath: 'personal',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'txt']
};

// Log de la configuration NAS au démarrage
console.log('📁 Configuration NAS:');
console.log('  - NAS_BASE_PATH:', process.env.NAS_BASE_PATH || 'Non défini');
console.log('  - basePath utilisé:', NAS_CONFIG.basePath);
console.log('  - Mode:', process.env.NAS_BASE_PATH ? 'NAS' : 'Local');

// Récupérer les documents généraux
exports.getGeneralDocuments = async (req, res) => {
  try {
    console.log('📄 Récupération des documents généraux');
    
    const documents = await Document.getGeneralDocuments();
    
    console.log(`✅ ${documents.length} documents généraux récupérés`);
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des documents généraux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des documents généraux',
      error: error.message
    });
  }
};

// Récupérer les documents personnels d'un employé
exports.getPersonalDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log('👤 Récupération des documents personnels pour:', employeeId);
    
    // Vérifier que l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé'
      });
    }
    
    const documents = await Document.getPersonalDocuments(employeeId);
    
    console.log(`✅ ${documents.length} documents personnels récupérés pour ${employee.name}`);
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des documents personnels:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des documents personnels',
      error: error.message
    });
  }
};

// Télécharger un document
exports.downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    console.log('⬇️ Téléchargement document:', documentId);
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }
    
    if (!document.isActive) {
      return res.status(410).json({
        success: false,
        message: 'Document non disponible'
      });
    }
    
    // Vérifier les permissions pour les documents personnels
    if (document.type === 'personal') {
      const { employeeId } = req.query;
      
      if (!employeeId || document.employeeId.toString() !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à ce document'
        });
      }
    }
    
    // Vérifier si le fichier existe sur le serveur
    const filePath = path.join(NAS_CONFIG.basePath, document.filePath);
    
    console.log('🔍 Recherche du fichier:', filePath);
    console.log('🔍 NAS_CONFIG.basePath:', NAS_CONFIG.basePath);
    console.log('🔍 document.filePath:', document.filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Fichier non trouvé sur le serveur:', filePath);
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }
    
    // Enregistrer le téléchargement
    await Document.recordDownload(documentId);
    
    console.log(`✅ Document téléchargé: ${document.title} par ${req.user?.name || 'utilisateur'}`);
    
    // Envoyer le fichier
    res.download(filePath, document.fileName, (err) => {
      if (err) {
        console.error('❌ Erreur lors de l\'envoi du fichier:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement du fichier'
          });
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du document',
      error: error.message
    });
  }
};

// Upload un document (admin seulement)
exports.uploadDocument = async (req, res) => {
  try {
    const { title, type, category, employeeId, description } = req.body;
    
    console.log('📤 Upload document:', { title, type, category, employeeId });
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }
    
    // Validation des données
    if (!title || !type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Titre, type et catégorie sont requis'
      });
    }
    
    if (type === 'personal' && !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'ID employé requis pour les documents personnels'
      });
    }
    
    // Vérifier l'employé pour les documents personnels
    if (type === 'personal') {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employé non trouvé'
        });
      }
    }
    
    // Validation du type de fichier
    const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
    if (!NAS_CONFIG.allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: `Type de fichier non autorisé. Types autorisés: ${NAS_CONFIG.allowedTypes.join(', ')}`
      });
    }
    
    // Validation de la taille
    if (req.file.size > NAS_CONFIG.maxFileSize) {
      return res.status(400).json({
        success: false,
        message: `Fichier trop volumineux. Taille maximale: ${NAS_CONFIG.maxFileSize / (1024 * 1024)}MB`
      });
    }
    
    // Créer le chemin de destination
    const targetDir = type === 'personal' ? NAS_CONFIG.personalPath : NAS_CONFIG.generalPath;
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const filePath = path.join(targetDir, fileName);
    const fullPath = path.join(NAS_CONFIG.basePath, filePath);
    
    console.log('🔍 Configuration NAS:', {
      basePath: NAS_CONFIG.basePath,
      targetDir: targetDir,
      fileName: fileName,
      filePath: filePath,
      fullPath: fullPath
    });
    
    // Créer le dossier s'il n'existe pas
    const dir = path.dirname(fullPath);
    console.log('📁 Création du dossier:', dir);
    
    // Vérifier si le dossier de base existe
    if (!fs.existsSync(NAS_CONFIG.basePath)) {
      try {
        fs.mkdirSync(NAS_CONFIG.basePath, { recursive: true });
        console.log('✅ Dossier de base créé:', NAS_CONFIG.basePath);
      } catch (error) {
        console.error('❌ Erreur lors de la création du dossier de base:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du dossier de base'
        });
      }
    }
    
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log('✅ Dossier créé avec succès:', dir);
      } catch (error) {
        console.error('❌ Erreur lors de la création du dossier:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du dossier de stockage'
        });
      }
    }
    
    // Déplacer le fichier vers le NAS
    try {
      fs.renameSync(req.file.path, fullPath);
    } catch (error) {
      console.error('❌ Erreur lors du déplacement du fichier:', error);
      // Si le déplacement échoue, copier le fichier
      fs.copyFileSync(req.file.path, fullPath);
      fs.unlinkSync(req.file.path); // Supprimer le fichier temporaire
    }
    
    // Créer l'enregistrement en base
    const documentData = {
      title,
      type,
      category,
      filePath,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: description || '',
      uploadedBy: req.user?.name || 'admin'
    };
    
    let document;
    if (type === 'personal') {
      documentData.employeeId = employeeId;
      document = await Document.createPersonalDocument(documentData);
    } else {
      document = await Document.createGeneralDocument(documentData);
    }
    
    console.log(`✅ Document uploadé avec succès: ${document.title}`);
    
    res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: document
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du document',
      error: error.message
    });
  }
};

// Supprimer un document
exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    console.log('🗑️ Suppression document:', documentId);
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }
    
    // Supprimer le fichier du NAS
    const filePath = path.join(NAS_CONFIG.basePath, document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Supprimer l'enregistrement
    await Document.findByIdAndDelete(documentId);
    
    console.log(`✅ Document supprimé: ${document.title}`);
    
    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du document',
      error: error.message
    });
  }
};

// Nettoyer les documents expirés
exports.cleanExpiredDocuments = async (req, res) => {
  try {
    console.log('🧹 Nettoyage des documents expirés');
    
    const cleanedCount = await Document.cleanExpiredDocuments();
    
    console.log(`✅ ${cleanedCount} documents expirés nettoyés`);
    
    res.json({
      success: true,
      message: `${cleanedCount} documents expirés ont été nettoyés`,
      cleanedCount
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des documents expirés',
      error: error.message
    });
  }
};

// Obtenir les statistiques des documents
exports.getDocumentStats = async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques des documents');
    
    const totalGeneral = await Document.countDocuments({ type: 'general', isActive: true });
    const totalPersonal = await Document.countDocuments({ type: 'personal', isActive: true });
    const expiredCount = await Document.countDocuments({ 
      type: 'personal', 
      expiryDate: { $lt: new Date() },
      isActive: true 
    });
    
    const stats = {
      totalGeneral,
      totalPersonal,
      expiredCount,
      totalDocuments: totalGeneral + totalPersonal
    };
    
    console.log('✅ Statistiques récupérées:', stats);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
