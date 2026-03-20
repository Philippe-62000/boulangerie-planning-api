const Document = require('../models/Document');
const Employee = require('../models/Employee');
const Parameter = require('../models/Parameters');
const fs = require('fs');
const path = require('path');
const sftpService = require('../services/sftpService');
const emailService = require('../services/emailService');

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

// Récupérer TOUS les documents personnels (admin) - pour affichage groupé par salarié
exports.getAllPersonalDocuments = async (req, res) => {
  try {
    console.log('📋 Récupération de tous les documents personnels (admin)');
    
    const documents = await Document.find({ type: 'personal' })
      .populate('employeeId', 'name role')
      .sort({ uploadDate: -1 });
    
    console.log(`✅ ${documents.length} documents personnels récupérés`);
    
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

// Fichiers envoyés par les salariés (consultation admin)
exports.getEmployeeUploads = async (req, res) => {
  try {
    const documents = await Document.find({ type: 'employee_upload' })
      .populate('employeeId', 'name role email')
      .sort({ uploadDate: -1 });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('❌ Erreur récupération envois salariés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fichiers uploadés',
      error: error.message
    });
  }
};

// Confirmer la réception / lecture d'un envoi salarié → admin (e-mail au salarié)
exports.confirmEmployeeUploadReceipt = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document || document.type !== 'employee_upload') {
      return res.status(404).json({
        success: false,
        message: 'Envoi non trouvé'
      });
    }

    if (document.receiptConfirmedAt) {
      return res.status(409).json({
        success: false,
        message: 'La réception a déjà été confirmée pour cet envoi'
      });
    }

    const employee = await Employee.findById(document.employeeId);
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'Salarié introuvable'
      });
    }
    if (!employee.email || !String(employee.email).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Aucune adresse e-mail enregistrée pour ce salarié'
      });
    }

    const emailResult = await emailService.sendEmployeeUploadReceiptConfirmation(
      employee.email.trim(),
      employee.name,
      document.title,
      document.fileName
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: emailResult.message || 'Erreur lors de l\'envoi de l\'e-mail au salarié'
      });
    }

    document.receiptConfirmedAt = new Date();
    await document.save();

    res.json({
      success: true,
      message: 'E-mail de confirmation envoyé au salarié',
      data: document
    });
  } catch (error) {
    console.error('❌ Erreur confirmation réception envoi salarié:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation',
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
    const { id } = req.params;
    
    console.log('⬇️ Téléchargement document:', id);
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }
    
    // Les fiches de paie restent téléchargeables même si marquées inactives (expirées)
    const isPayslip = document.category === 'payslip';
    if (!document.isActive && !isPayslip) {
      return res.status(410).json({
        success: false,
        message: 'Document non disponible'
      });
    }
    
    // Vérifier les permissions pour les documents personnels et envois salarié→admin
    if (document.type === 'personal' || document.type === 'employee_upload') {
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
    console.log('🔍 Document trouvé:', {
      id: document._id,
      title: document.title,
      type: document.type,
      filePath: document.filePath,
      fileName: document.fileName
    });
    
    const filePath = path.join(NAS_CONFIG.basePath, document.filePath);
    console.log('🔍 Configuration NAS:', {
      NAS_BASE_PATH: process.env.NAS_BASE_PATH,
      basePath: NAS_CONFIG.basePath,
      documentFilePath: document.filePath,
      fullPath: filePath
    });
    
    let sftpConnected = false;
    try {
      // Connexion au NAS
      await sftpService.connect();
      sftpConnected = true;
      
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
      const fileBuffer = await sftpService.downloadFile(filePath);
      
      // Récupérer l'employeeId depuis la requête (query ou user)
      let employeeId = null;
      if (req.query.employeeId) {
        employeeId = req.query.employeeId;
      } else if (req.user?.employeeId) {
        employeeId = req.user.employeeId;
      } else if (req.user?.id) {
        // Si l'utilisateur est un employé connecté, utiliser son ID
        employeeId = req.user.id;
      }
      
      // Enregistrer le téléchargement AVANT d'envoyer la réponse
      await Document.recordDownload(id, employeeId);
      
      // Envoyer directement le buffer au client sans fichier temporaire
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length);
      res.send(fileBuffer);
      
      console.log(`✅ Document téléchargé: ${document.title} par ${req.user?.name || 'utilisateur'}`);
      
    } catch (error) {
      console.error('❌ Erreur SFTP lors du téléchargement:', error);
      
      // Ne pas envoyer de réponse si elle a déjà été envoyée
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors du téléchargement depuis le NAS',
          error: error.message
        });
      }
    } finally {
      // Déconnexion du NAS seulement si connecté
      if (sftpConnected) {
        try {
          await sftpService.disconnect();
        } catch (disconnectError) {
          // Ignorer les erreurs de déconnexion pour éviter de masquer l'erreur principale
          console.error('⚠️ Erreur lors de la déconnexion SFTP:', disconnectError.message);
        }
      }
    }
    
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

// Supprimer TOUS les documents (admin seulement) - DANGEREUX
exports.deleteAllDocuments = async (req, res) => {
  try {
    console.log('🧹 Suppression de TOUS les documents...');
    
    // Compter tous les documents
    const totalDocuments = await Document.countDocuments();
    console.log(`📄 ${totalDocuments} documents trouvés au total`);
    
    if (totalDocuments === 0) {
      return res.json({
        success: true,
        message: 'Aucun document à supprimer',
        deletedCount: 0
      });
    }
    
    // Supprimer TOUS les documents
    const deleteResult = await Document.deleteMany({});
    
    console.log(`🗑️ ${deleteResult.deletedCount} documents supprimés`);
    
    res.json({
      success: true,
      message: `${deleteResult.deletedCount} documents supprimés - Base de données nettoyée`,
      deletedCount: deleteResult.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des documents',
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
    // Documents personnels : classés par année (personal/2024/, personal/2025/) pour archivage
    const currentYear = new Date().getFullYear();
    const targetDir = type === 'personal' 
      ? `${NAS_CONFIG.personalPath}/${currentYear}` 
      : NAS_CONFIG.generalPath;
    // Garder le nom d'origine du fichier et normaliser l'encodage UTF-8
    // Utiliser des séparateurs Unix pour les chemins SFTP
    const normalizePath = (...parts) => parts.filter(p => p).join('/').replace(/\\/g, '/');
    
    // Normaliser le nom de fichier pour garantir l'encodage UTF-8 correct
    let fileName = req.file.originalname;
    
    // Corriger l'encodage si le nom contient des séquences mal encodées (ex: "AnaÃ¯s" -> "Anaïs")
    // Détecter les patterns de mauvais encodage UTF-8 interprété comme latin1
    if (fileName.includes('Ã')) {
      try {
        // Le nom semble mal encodé, tenter de le corriger
        // "AnaÃ¯s" est "Anaïs" mal encodé (UTF-8 bytes interprétés comme latin1)
        const buffer = Buffer.from(fileName, 'latin1');
        const decoded = buffer.toString('utf8');
        // Vérifier que le décodage a produit des caractères valides
        // (contient des caractères français valides ou pas de caractères invalides)
        if (decoded && (decoded.includes('ï') || decoded.includes('é') || decoded.includes('è') || decoded.includes('à') || decoded.includes('ç'))) {
          fileName = decoded;
          console.log(`🔧 Nom de fichier corrigé: ${req.file.originalname} -> ${fileName}`);
        } else if (decoded && decoded.length === buffer.length && decoded !== fileName) {
          // Si le décodage a changé quelque chose et semble valide, l'utiliser
          fileName = decoded;
          console.log(`🔧 Nom de fichier corrigé (tentative): ${req.file.originalname} -> ${fileName}`);
        }
      } catch (e) {
        console.log(`⚠️ Impossible de corriger l'encodage du nom: ${e.message}`);
      }
    }
    
    let filePath = normalizePath(targetDir, fileName);
    let fullPath = normalizePath(NAS_CONFIG.basePath, filePath);
    
    // Utiliser le service SFTP pour uploader sur le NAS
    let sftpConnected = false;
    try {
      // Connexion au NAS
      await sftpService.connect();
      sftpConnected = true;
      
      // Vérifier que le client est disponible
      if (!sftpService.client) {
        throw new Error('Client SFTP non initialisé');
      }
      
      // Créer le dossier sur le NAS s'il n'existe pas (avec sous-dossiers par année pour personal/)
      const dir = normalizePath(NAS_CONFIG.basePath, targetDir);
      console.log('📁 Création du dossier sur le NAS:', dir);
      
      try {
        // mkdir avec recursive: true crée toute la hiérarchie (personal, personal/2024, etc.)
        try {
          await sftpService.client.stat(dir);
          console.log('✅ Dossier existe déjà sur le NAS:', dir);
        } catch (error) {
          // Dossier n'existe pas, le créer (recursive pour personal/2024)
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
      
      // Vérifier si le fichier existe déjà, et ajouter un suffixe si nécessaire
      let counter = 1;
      const originalNameWithoutExt = path.parse(req.file.originalname).name;
      const originalExt = path.parse(req.file.originalname).ext;
      
      while (true) {
        const fileExists = await sftpService.fileExists(fullPath);
        if (!fileExists) {
          // Le fichier n'existe pas, on peut utiliser ce nom
          console.log(`✅ Nom de fichier disponible: ${fileName}`);
          break;
        }
        // Le fichier existe, ajouter un suffixe
        fileName = `${originalNameWithoutExt}_${counter}${originalExt}`;
        filePath = normalizePath(targetDir, fileName);
        fullPath = normalizePath(NAS_CONFIG.basePath, filePath);
        counter++;
        console.log(`⚠️ Fichier existe déjà, nouveau nom: ${fileName}`);
        
        // Limite de sécurité pour éviter les boucles infinies
        if (counter > 100) {
          console.error('❌ Trop de tentatives pour trouver un nom de fichier unique');
          return res.status(500).json({
            success: false,
            message: 'Impossible de trouver un nom de fichier unique après 100 tentatives'
          });
        }
      }
      
      console.log('🔍 Configuration NAS:', {
        basePath: NAS_CONFIG.basePath,
        targetDir: targetDir,
        fileName: fileName,
        filePath: filePath,
        fullPath: fullPath
      });
      
      // Uploader le fichier sur le NAS
      console.log('📤 Upload du fichier vers le NAS:', fullPath);
      await sftpService.put(req.file.path, fullPath);
      console.log('✅ Fichier uploadé avec succès sur le NAS');
      
      // Supprimer le fichier temporaire local
      fs.unlinkSync(req.file.path);
      
    } catch (error) {
      console.error('❌ Erreur SFTP:', error);
      
      // Supprimer le fichier temporaire en cas d'erreur
      try {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error('⚠️ Erreur lors du nettoyage du fichier temporaire:', cleanupError.message);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload sur le NAS',
        error: error.message
      });
    } finally {
      // Déconnexion du NAS seulement si connecté
      if (sftpConnected) {
        try {
          await sftpService.disconnect();
        } catch (disconnectError) {
          // Ignorer les erreurs de déconnexion pour éviter de masquer l'erreur principale
          console.error('⚠️ Erreur lors de la déconnexion SFTP:', disconnectError.message);
        }
      }
    }
    
    // Créer l'enregistrement en base
    // Utiliser le fileName normalisé (qui peut avoir été corrigé pour l'encodage)
    const documentData = {
      title,
      type,
      category,
      filePath: filePath, // Utiliser la variable filePath définie plus haut
      fileName: fileName, // Utiliser le fileName normalisé (encodage UTF-8 correct)
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
    
    // Envoyer un email de notification pour les documents personnels
    if (type === 'personal' && employeeId) {
      try {
        const employee = await Employee.findById(employeeId);
        if (employee && employee.email) {
          console.log(`📧 Envoi de notification email à ${employee.name} (${employee.email})`);
          
          const emailResult = await emailService.sendDocumentNotification(
            employee.email,
            employee.name,
            title,
            category
          );
          
          if (emailResult.success) {
            console.log(`✅ Email envoyé avec succès à ${employee.name}`);
          } else {
            console.log(`⚠️ Échec envoi email à ${employee.name}: ${emailResult.message}`);
          }
        } else {
          console.log(`⚠️ Email non trouvé pour l'employé ${employeeId}`);
        }
      } catch (emailError) {
        console.error('❌ Erreur envoi email:', emailError);
        // Ne pas faire échouer l'upload si l'email échoue
      }
    }

    // Envoyer un email de notification pour les documents généraux
    if (type === 'general') {
      try {
        console.log(`📧 Envoi de notification email pour document général: ${title}`);
        
        // Récupérer tous les salariés actifs avec email
        const employees = await Employee.find({ 
          isActive: true, 
          email: { $exists: true, $ne: null, $ne: '' } 
        });
        
        console.log(`📧 Envoi à ${employees.length} salariés actifs`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Envoyer l'email à chaque salarié
        for (const employee of employees) {
          try {
            const emailResult = await emailService.sendGeneralDocumentNotification(
              employee.email,
              employee.name,
              title,
              category
            );
            
            if (emailResult.success) {
              successCount++;
              console.log(`✅ Email envoyé à ${employee.name}`);
            } else {
              errorCount++;
              console.log(`⚠️ Échec envoi email à ${employee.name}: ${emailResult.message}`);
            }
          } catch (emailError) {
            errorCount++;
            console.error(`❌ Erreur envoi email à ${employee.name}:`, emailError.message);
          }
        }
        
        console.log(`📊 Résultat envoi emails: ${successCount} succès, ${errorCount} erreurs`);
        
      } catch (emailError) {
        console.error('❌ Erreur envoi email général:', emailError);
        // Ne pas faire échouer l'upload si l'email échoue
      }
    }
    
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

// Upload d'un fichier par un salarié (Mes documents → Envoyer documents)
exports.uploadEmployeeDocument = async (req, res) => {
  if (req.user.role !== 'employee' || !req.user.employeeId) {
    return res.status(403).json({
      success: false,
      message: 'Cette action est réservée aux salariés connectés'
    });
  }

  const nature = (req.body.nature || '').trim();
  if (!nature) {
    return res.status(400).json({
      success: false,
      message: 'Le champ « Nature du document » est requis'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Aucun fichier fourni'
    });
  }

  const employeeId = req.user.employeeId;
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employé non trouvé'
    });
  }

  const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
  if (!NAS_CONFIG.allowedTypes.includes(fileExtension)) {
    return res.status(400).json({
      success: false,
      message: `Type de fichier non autorisé. Types autorisés: ${NAS_CONFIG.allowedTypes.join(', ')}`
    });
  }

  if (req.file.size > NAS_CONFIG.maxFileSize) {
    return res.status(400).json({
      success: false,
      message: `Fichier trop volumineux. Taille maximale: ${NAS_CONFIG.maxFileSize / (1024 * 1024)}MB`
    });
  }

  const currentYear = new Date().getFullYear();
  const targetDir = `${NAS_CONFIG.personalPath}/employee-uploads/${currentYear}`;
  const normalizePath = (...parts) => parts.filter(p => p).join('/').replace(/\\/g, '/');

  let fileName = req.file.originalname;
  if (fileName.includes('Ã')) {
    try {
      const buffer = Buffer.from(fileName, 'latin1');
      const decoded = buffer.toString('utf8');
      if (decoded && (decoded.includes('ï') || decoded.includes('é') || decoded.includes('è') || decoded.includes('à') || decoded.includes('ç'))) {
        fileName = decoded;
      } else if (decoded && decoded.length === buffer.length && decoded !== fileName) {
        fileName = decoded;
      }
    } catch (e) {
      /* ignore */
    }
  }

  let filePath = normalizePath(targetDir, fileName);
  let fullPath = normalizePath(NAS_CONFIG.basePath, filePath);

  let sftpConnected = false;
  try {
    await sftpService.connect();
    sftpConnected = true;

    if (!sftpService.client) {
      throw new Error('Client SFTP non initialisé');
    }

    const dir = normalizePath(NAS_CONFIG.basePath, targetDir);
    try {
      try {
        await sftpService.client.stat(dir);
      } catch (error) {
        await sftpService.client.mkdir(dir, true);
      }
    } catch (error) {
      console.error('❌ Erreur création dossier NAS:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du dossier sur le NAS'
      });
    }

    let counter = 1;
    const originalNameWithoutExt = path.parse(req.file.originalname).name;
    const originalExt = path.parse(req.file.originalname).ext;

    while (true) {
      const fileExists = await sftpService.fileExists(fullPath);
      if (!fileExists) break;
      fileName = `${originalNameWithoutExt}_${counter}${originalExt}`;
      filePath = normalizePath(targetDir, fileName);
      fullPath = normalizePath(NAS_CONFIG.basePath, filePath);
      counter++;
      if (counter > 100) {
        return res.status(500).json({
          success: false,
          message: 'Impossible de trouver un nom de fichier unique'
        });
      }
    }

    await sftpService.put(req.file.path, fullPath);
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error('❌ Erreur SFTP upload salarié:', error);
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      /* ignore */
    }
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload sur le NAS',
      error: error.message
    });
  } finally {
    if (sftpConnected) {
      try {
        await sftpService.disconnect();
      } catch (disconnectError) {
        console.error('⚠️ Erreur déconnexion SFTP:', disconnectError.message);
      }
    }
  }

  try {
    const document = await Document.createEmployeeUploadDocument({
      title: nature,
      employeeId,
      filePath,
      fileName,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: '',
      uploadedBy: employee.name || 'salarié'
    });

    try {
      const adminEmailParam = await Parameter.findOne({ name: 'adminEmail' });
      const adminEmail = adminEmailParam?.stringValue?.trim();
      if (adminEmail) {
        const emailResult = await emailService.sendEmployeeUploadAdminNotification(
          adminEmail,
          employee.name,
          nature,
          fileName
        );
        if (!emailResult.success) {
          console.log(`⚠️ Email admin non envoyé: ${emailResult.message}`);
        }
      } else {
        console.log('⚠️ Paramètre adminEmail non configuré — pas de notification');
      }
    } catch (emailErr) {
      console.error('❌ Erreur email notification envoi salarié:', emailErr);
    }

    res.json({
      success: true,
      message: 'Document envoyé avec succès',
      data: document
    });
  } catch (error) {
    console.error('❌ Erreur enregistrement document salarié:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du document',
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

    const normalizePath = (...parts) => parts.filter(p => p).join('/').replace(/\\/g, '/');
    const fullPath = normalizePath(NAS_CONFIG.basePath, document.filePath);

    let sftpConnected = false;
    try {
      await sftpService.connect();
      sftpConnected = true;
      if (await sftpService.fileExists(fullPath)) {
        await sftpService.client.delete(fullPath);
        console.log('🗑️ Fichier supprimé sur le NAS:', fullPath);
      } else {
        console.log('⚠️ Fichier absent sur le NAS:', fullPath);
      }
    } catch (sftpError) {
      console.error('❌ Erreur suppression SFTP:', sftpError.message);
      const localPath = path.join(NAS_CONFIG.basePath, document.filePath);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log('🗑️ Fichier supprimé en local (fallback):', localPath);
      }
    } finally {
      if (sftpConnected) {
        try {
          await sftpService.disconnect();
        } catch (e) {
          console.error('⚠️ Erreur déconnexion SFTP:', e.message);
        }
      }
    }

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

// Lister les fiches orphelines : fichiers sur le NAS sans enregistrement en base
// (fichiers uploadés dont le lien de téléchargement a été supprimé)
exports.getOrphanedDocuments = async (req, res) => {
  let sftpConnected = false;
  try {
    console.log('🔍 Recherche des documents orphelins sur le NAS...');
    
    await sftpService.connect();
    sftpConnected = true;
    
    const basePath = NAS_CONFIG.basePath;
    const allFilesOnNas = await sftpService.listAllPersonalFiles(basePath);
    
    const dbDocuments = await Document.find({ type: 'personal' }).select('filePath');
    const dbPaths = new Set(dbDocuments.map(d => d.filePath));
    
    const orphaned = allFilesOnNas.filter(filePath => !dbPaths.has(filePath));
    
    console.log(`📄 Fichiers sur NAS: ${allFilesOnNas.length}, en base: ${dbDocuments.length}, orphelins: ${orphaned.length}`);
    
    res.json({
      success: true,
      data: {
        orphanedFiles: orphaned.map(fp => ({
          filePath: fp,
          fileName: path.basename(fp)
        })),
        totalOnNas: allFilesOnNas.length,
        totalInDb: dbDocuments.length,
        orphanedCount: orphaned.length
      }
    });
  } catch (error) {
    console.error('❌ Erreur recherche documents orphelins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des documents orphelins',
      error: error.message
    });
  } finally {
    if (sftpConnected) {
      try {
        await sftpService.disconnect();
      } catch (e) {
        console.error('⚠️ Erreur déconnexion SFTP:', e.message);
      }
    }
  }
};

// Réassocier un fichier orphelin à un employé (créer l'enregistrement en base)
exports.reassociateOrphanedDocument = async (req, res) => {
  try {
    const { filePath, employeeId, title } = req.body;
    
    if (!filePath || !employeeId || !title) {
      return res.status(400).json({
        success: false,
        message: 'filePath, employeeId et title sont requis'
      });
    }
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé'
      });
    }
    
    const fullPath = `${NAS_CONFIG.basePath}/${filePath}`.replace(/\\/g, '/');
    const fileExists = await sftpService.fileExists(fullPath);
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le NAS'
      });
    }
    
    const existingDoc = await Document.findOne({ filePath });
    if (existingDoc) {
      return res.status(400).json({
        success: false,
        message: 'Ce fichier est déjà associé à un document'
      });
    }
    
    const stats = await sftpService.getFileStats(fullPath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase().substring(1);
    const mimeTypes = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      txt: 'text/plain'
    };
    
    const document = await Document.createPersonalDocument({
      title,
      type: 'personal',
      category: 'payslip',
      employeeId,
      filePath,
      fileName,
      fileSize: stats.size,
      mimeType: mimeTypes[ext] || 'application/octet-stream',
      description: 'Document réassocié depuis les fichiers orphelins'
    });
    
    console.log(`✅ Document orphelin réassocié: ${title} pour ${employee.name}`);
    
    res.json({
      success: true,
      message: 'Document réassocié avec succès',
      data: document
    });
  } catch (error) {
    console.error('❌ Erreur réassociation document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réassociation',
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
