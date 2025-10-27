const Document = require('../models/Document');
const Employee = require('../models/Employee');
const fs = require('fs');
const path = require('path');
const sftpService = require('../services/sftpService');

// Configuration NAS (utilise le même répertoire de base que les arrêts maladie)
const NAS_CONFIG = {
  basePath: process.env.NAS_BASE_PATH || '/n8n/uploads/documents', // Chemin complet sur le NAS Synology
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
console.log('  - SFTP_PASSWORD configuré:', !!process.env.SFTP_PASSWORD);
console.log('  - Toutes les variables d\'environnement:', Object.keys(process.env).filter(key => key.includes('NAS') || key.includes('SFTP')));

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
    
    // Téléchargement uniquement depuis le NAS
    console.log('☁️ Téléchargement depuis le NAS');
    
    const filePath = path.join(NAS_CONFIG.basePath, document.filePath);
    console.log('🔍 Chemin NAS:', filePath);
    
    try {
      // Connexion au NAS
      await sftpService.connect();
      
      // Vérifier si le fichier existe sur le NAS
      const fileExists = await sftpService.fileExists(filePath);
      if (!fileExists) {
        console.error('❌ Fichier non trouvé sur le NAS:', filePath);
        return res.status(404).json({
          success: false,
          message: 'Fichier non trouvé sur le NAS'
        });
      }
      
      // Télécharger le fichier depuis le NAS
      const tempFilePath = path.join(__dirname, '../uploads/temp', path.basename(filePath));
      const fileBuffer = await sftpService.downloadFile(filePath);
      
      // Écrire le buffer dans un fichier temporaire
      fs.writeFileSync(tempFilePath, fileBuffer);
      
      // Envoyer le fichier au client
      res.download(tempFilePath, document.fileName, (err) => {
        // Supprimer le fichier temporaire après envoi
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        if (err) {
          console.error('❌ Erreur lors de l\'envoi du fichier:', err);
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur SFTP lors du téléchargement:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement depuis le NAS',
        error: error.message
      });
    } finally {
      // Déconnexion du NAS
      await sftpService.disconnect();
    }
    
    // Enregistrer le téléchargement
    await Document.recordDownload(documentId);
    
    console.log(`✅ Document téléchargé: ${document.title} par ${req.user?.name || 'utilisateur'}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du document',
      error: error.message
    });
  }
};

// Nettoyer les anciens documents (admin seulement)
exports.cleanupOldDocuments = async (req, res) => {
  try {
    console.log('🧹 Nettoyage des anciens documents...');
    
    // Supprimer tous les documents avec des filePath qui ne commencent pas par 'general/' ou 'personal/'
    const deleteResult = await Document.deleteMany({
      filePath: { $not: { $regex: /^(general|personal)\// } }
    });
    
    console.log(`🗑️ ${deleteResult.deletedCount} anciens documents supprimés`);
    
    res.json({
      success: true,
      message: `${deleteResult.deletedCount} anciens documents supprimés`,
      deletedCount: deleteResult.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des anciens documents',
      error: error.message
    });
  }
};

// Upload un document (admin seulement)
exports.uploadDocument = async (req, res) => {
  try {
    const { title, type, category, employeeId, description } = req.body;
    
    console.log('📤 Upload document:', { title, type, category, employeeId });
    console.log('🔍 Configuration actuelle:');
    console.log('  - NAS_BASE_PATH:', process.env.NAS_BASE_PATH || 'Non défini');
    console.log('  - SFTP_PASSWORD:', process.env.SFTP_PASSWORD ? 'Configuré' : 'Non configuré');
    console.log('  - basePath utilisé:', NAS_CONFIG.basePath);
    
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
    
    // Créer le chemin de destination sur le NAS (avant le bloc try)
    const targetDir = type === 'personal' ? NAS_CONFIG.personalPath : NAS_CONFIG.generalPath;
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const filePath = path.join(targetDir, fileName);
    const fullPath = path.join(NAS_CONFIG.basePath, filePath);
    
    // Utiliser le service SFTP pour uploader sur le NAS
    try {
      // Connexion au NAS
      await sftpService.connect();
      
      console.log('🔍 Configuration NAS:', {
        basePath: NAS_CONFIG.basePath,
        targetDir: targetDir,
        fileName: fileName,
        filePath: filePath,
        fullPath: fullPath
      });
      
      // Créer le dossier sur le NAS s'il n'existe pas
      const dir = path.dirname(fullPath);
      console.log('📁 Création du dossier sur le NAS:', dir);
      
      try {
        // Vérifier si le dossier existe
        try {
          await sftpService.client.stat(dir);
          console.log('✅ Dossier existe déjà sur le NAS:', dir);
        } catch (error) {
          // Dossier n'existe pas, le créer
          console.log('📁 Création du dossier sur le NAS:', dir);
          await sftpService.client.mkdir(dir, true);
          console.log('✅ Dossier créé avec succès sur le NAS:', dir);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la création du dossier sur le NAS:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du dossier sur le NAS'
        });
      }
      
      // Uploader le fichier sur le NAS
      console.log('📤 Upload du fichier vers le NAS:', fullPath);
      await sftpService.client.put(req.file.path, fullPath);
      console.log('✅ Fichier uploadé avec succès sur le NAS');
      
      // Supprimer le fichier temporaire local
      fs.unlinkSync(req.file.path);
      
    } catch (error) {
      console.error('❌ Erreur SFTP:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload sur le NAS',
        error: error.message
      });
    } finally {
      // Déconnexion du NAS
      await sftpService.disconnect();
    }
    
    // Créer l'enregistrement en base
    const documentData = {
      title,
      type,
      category,
      filePath: filePath, // Utiliser la variable filePath définie plus haut
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
