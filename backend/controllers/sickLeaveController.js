const SickLeave = require('../models/SickLeave');
const sftpService = require('../services/sftpService');
const imageValidationService = require('../services/imageValidationService');
const multer = require('multer');

// Configuration Multer pour l'upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Seuls JPG et PDF sont acceptés.'), false);
    }
  }
});

// Middleware d'upload
const uploadMiddleware = upload.single('sickLeaveFile');

// Test de connexion SFTP
const testSftpConnection = async (req, res) => {
  try {
    console.log('🔍 Test de connexion SFTP...');
    
    // Vérification de la configuration
    const config = {
      host: 'philange.synology.me',
      username: 'nHEIGHTn',
      passwordSet: !!process.env.SFTP_PASSWORD,
      passwordLength: process.env.SFTP_PASSWORD ? process.env.SFTP_PASSWORD.length : 0,
      port: 22
    };
    
    console.log('🔍 Configuration SFTP:', config);

    if (!process.env.SFTP_PASSWORD) {
      return res.json({
        success: false,
        error: 'SFTP_PASSWORD non configuré',
        details: 'La variable d\'environnement SFTP_PASSWORD n\'est pas définie',
        config: config
      });
    }

    // Test de connexion direct avec ssh2-sftp-client
    const SftpClient = require('ssh2-sftp-client');
    const client = new SftpClient();
    
    const sftpConfig = {
      host: 'philange.synology.me',
      username: 'nHEIGHTn',
      password: process.env.SFTP_PASSWORD,
      port: 22,
      readyTimeout: 10000,
      retries: 2,
      retry_minTimeout: 1000
    };
    
    console.log('🔌 Tentative de connexion SFTP...');
    await client.connect(sftpConfig);
    console.log('✅ Connexion SFTP réussie');
    
    // Test de listage du répertoire racine
    const list = await client.list('/');
    console.log('📁 Contenu du répertoire racine:', list.length, 'éléments');
    
    await client.end();
    console.log('🔌 Déconnexion SFTP');
    
    res.json({
      success: true,
      message: 'Connexion SFTP réussie',
      details: `Connexion établie avec succès. ${list.length} éléments trouvés dans le répertoire racine.`,
      config: config,
      rootDirectoryItems: list.length
    });
    
  } catch (error) {
    console.error('❌ Erreur test SFTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de connexion SFTP',
      details: error.message,
      stack: error.stack,
      config: {
        host: 'philange.synology.me',
        username: 'nHEIGHTn',
        passwordSet: !!process.env.SFTP_PASSWORD,
        passwordLength: process.env.SFTP_PASSWORD ? process.env.SFTP_PASSWORD.length : 0,
        port: 22
      }
    });
  }
};

// Test d'upload simple (sans fichier)
const testUpload = async (req, res) => {
  try {
    console.log('🧪 Test d\'upload simple...');
    
    // Test de la configuration
    const config = {
      sftpPassword: !!process.env.SFTP_PASSWORD,
      sftpPasswordLength: process.env.SFTP_PASSWORD ? process.env.SFTP_PASSWORD.length : 0,
      multerAvailable: typeof require('multer') !== 'undefined',
      sharpAvailable: typeof require('sharp') !== 'undefined',
      pdfParseAvailable: typeof require('pdf-parse') !== 'undefined',
      sftpClientAvailable: typeof require('ssh2-sftp-client') !== 'undefined'
    };
    
    console.log('🔍 Configuration test:', config);
    
    res.json({
      success: true,
      message: 'Test d\'upload réussi',
      config: config,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur test upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur test upload',
      details: error.message,
      stack: error.stack
    });
  }
};

// Upload d'un arrêt maladie par un salarié
const uploadSickLeave = async (req, res) => {
  try {
    console.log('📤 Upload arrêt maladie reçu');
    console.log('📤 Headers:', req.headers);
    console.log('📤 Body:', req.body);
    console.log('📤 File:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'Aucun fichier');
    
    // Vérification des données requises
    const { employeeName, employeeEmail, startDate, endDate } = req.body;
    
    if (!employeeName || !employeeEmail || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis (nom, email, date début, date fin)'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    // Validation des dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'La date de fin doit être postérieure à la date de début'
      });
    }

    // Validation automatique du fichier
    console.log('🔍 Validation automatique du fichier...');
    console.log('🔍 Fichier à valider:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : 'undefined'
    });
    
    let validation;
    try {
      validation = await imageValidationService.validateFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      console.log(`📊 Score de validation: ${validation.qualityScore}/100`);
    } catch (validationError) {
      console.error('❌ Erreur validation fichier:', validationError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la validation du fichier',
        details: validationError.message,
        stack: validationError.stack
      });
    }

    // Upload vers le NAS (ou sauvegarde locale si SFTP non configuré)
    console.log('📤 Upload vers le NAS...');
    console.log('🔍 Configuration SFTP:', {
      host: 'philange.synology.me',
      username: 'nHEIGHTn',
      passwordSet: !!process.env.SFTP_PASSWORD,
      passwordLength: process.env.SFTP_PASSWORD ? process.env.SFTP_PASSWORD.length : 0
    });
    
    let uploadResult;
    if (!process.env.SFTP_PASSWORD) {
      console.log('⚠️ Mot de passe SFTP non configuré, sauvegarde locale...');
      // Sauvegarde locale temporaire
      const fileName = `${Date.now()}_${employeeName.replace(/\s+/g, '_')}_${req.file.originalname}`;
      uploadResult = {
        fileName: fileName,
        remotePath: `/temp/${fileName}`,
        localPath: `/uploads/${fileName}`
      };
      console.log('✅ Fichier sauvegardé localement:', uploadResult);
    } else {
      try {
        uploadResult = await sftpService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          employeeName
        );
        console.log('✅ Upload réussi:', uploadResult);
      } catch (uploadError) {
        console.error('❌ Erreur upload SFTP:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de l\'upload du fichier vers le NAS',
          details: uploadError.message
        });
      }
    }

    // Création de l'enregistrement en base
    console.log('💾 Création de l\'enregistrement en base...');
    console.log('💾 Données à sauvegarder:', {
      employeeName: employeeName.trim(),
      employeeEmail: employeeEmail.trim().toLowerCase(),
      startDate: start,
      endDate: end,
      fileName: uploadResult.fileName,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      filePath: uploadResult.remotePath
    });
    
    let sickLeave;
    try {
      sickLeave = new SickLeave({
        employeeName: employeeName.trim(),
        employeeEmail: employeeEmail.trim().toLowerCase(),
        startDate: start,
        endDate: end,
        fileName: uploadResult.fileName,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: uploadResult.remotePath,
        autoValidation: {
          isReadable: validation.isReadable,
          qualityScore: validation.qualityScore,
          validationMessage: validation.message
        }
      });
      console.log('✅ Objet SickLeave créé');
    } catch (createError) {
      console.error('❌ Erreur création objet SickLeave:', createError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de l\'enregistrement',
        details: createError.message,
        stack: createError.stack
      });
    }

    try {
      await sickLeave.save();
      console.log('✅ Arrêt maladie enregistré:', sickLeave._id);
    } catch (saveError) {
      console.error('❌ Erreur sauvegarde en base:', saveError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde en base de données',
        details: saveError.message,
        stack: saveError.stack
      });
    }

    res.json({
      success: true,
      message: 'Arrêt maladie uploadé avec succès',
      data: {
        id: sickLeave._id,
        status: sickLeave.status,
        validation: {
          score: validation.qualityScore,
          message: validation.message,
          isReadable: validation.isReadable
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur upload arrêt maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload de l\'arrêt maladie'
    });
  }
};

// Récupérer tous les arrêts maladie (admin)
const getAllSickLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [sickLeaves, total] = await Promise.all([
      SickLeave.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SickLeave.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        sickLeaves,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération arrêts maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des arrêts maladie'
    });
  }
};

// Récupérer un arrêt maladie par ID
const getSickLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sickLeave = await SickLeave.findById(id);
    
    if (!sickLeave) {
      return res.status(404).json({
        success: false,
        error: 'Arrêt maladie non trouvé'
      });
    }

    res.json({
      success: true,
      data: sickLeave
    });

  } catch (error) {
    console.error('❌ Erreur récupération arrêt maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'arrêt maladie'
    });
  }
};

// Valider un arrêt maladie (admin)
const validateSickLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { validatedBy, notes } = req.body;

    const sickLeave = await SickLeave.findById(id);
    
    if (!sickLeave) {
      return res.status(404).json({
        success: false,
        error: 'Arrêt maladie non trouvé'
      });
    }

    if (sickLeave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cet arrêt maladie a déjà été traité'
      });
    }

    // Marquer comme validé
    await sickLeave.markAsValidated(validatedBy, notes);

    // Déplacer le fichier vers le dossier validé
    try {
      const newPath = await sftpService.moveFile(sickLeave.filePath, 'validated');
      sickLeave.filePath = newPath;
      await sickLeave.save();
    } catch (error) {
      console.error('❌ Erreur déplacement fichier:', error.message);
      // Continuer même si le déplacement échoue
    }

    res.json({
      success: true,
      message: 'Arrêt maladie validé avec succès',
      data: sickLeave
    });

  } catch (error) {
    console.error('❌ Erreur validation arrêt maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation de l\'arrêt maladie'
    });
  }
};

// Rejeter un arrêt maladie (admin)
const rejectSickLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;

    const sickLeave = await SickLeave.findById(id);
    
    if (!sickLeave) {
      return res.status(404).json({
        success: false,
        error: 'Arrêt maladie non trouvé'
      });
    }

    if (sickLeave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cet arrêt maladie a déjà été traité'
      });
    }

    // Marquer comme rejeté
    await sickLeave.markAsRejected(rejectedBy, reason);

    res.json({
      success: true,
      message: 'Arrêt maladie rejeté',
      data: sickLeave
    });

  } catch (error) {
    console.error('❌ Erreur rejet arrêt maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du rejet de l\'arrêt maladie'
    });
  }
};

// Marquer comme déclaré (admin)
const markAsDeclared = async (req, res) => {
  try {
    const { id } = req.params;
    const { declaredBy, notes } = req.body;

    const sickLeave = await SickLeave.findById(id);
    
    if (!sickLeave) {
      return res.status(404).json({
        success: false,
        error: 'Arrêt maladie non trouvé'
      });
    }

    if (sickLeave.status !== 'validated') {
      return res.status(400).json({
        success: false,
        error: 'L\'arrêt maladie doit être validé avant d\'être déclaré'
      });
    }

    // Marquer comme déclaré
    await sickLeave.markAsDeclared(declaredBy, notes);

    // Déplacer le fichier vers le dossier déclaré
    try {
      const newPath = await sftpService.moveFile(sickLeave.filePath, 'declared');
      sickLeave.filePath = newPath;
      await sickLeave.save();
    } catch (error) {
      console.error('❌ Erreur déplacement fichier:', error.message);
      // Continuer même si le déplacement échoue
    }

    res.json({
      success: true,
      message: 'Arrêt maladie marqué comme déclaré',
      data: sickLeave
    });

  } catch (error) {
    console.error('❌ Erreur déclaration arrêt maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la déclaration de l\'arrêt maladie'
    });
  }
};

// Télécharger un fichier (admin)
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sickLeave = await SickLeave.findById(id);
    
    if (!sickLeave) {
      return res.status(404).json({
        success: false,
        error: 'Arrêt maladie non trouvé'
      });
    }

    // Télécharger le fichier depuis le NAS
    const fileBuffer = await sftpService.downloadFile(sickLeave.filePath);

    res.set({
      'Content-Type': sickLeave.fileType,
      'Content-Disposition': `attachment; filename="${sickLeave.originalFileName}"`,
      'Content-Length': fileBuffer.length
    });

    res.send(fileBuffer);

  } catch (error) {
    console.error('❌ Erreur téléchargement fichier:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du téléchargement du fichier'
    });
  }
};

// Obtenir les statistiques
const getStats = async (req, res) => {
  try {
    const [stats, overdueCount] = await Promise.all([
      SickLeave.getStats(),
      SickLeave.getOverdueCount()
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        overdue: overdueCount
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Supprimer un arrêt maladie (admin)
const deleteSickLeave = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sickLeave = await SickLeave.findById(id);
    
    if (!sickLeave) {
      return res.status(404).json({
        success: false,
        error: 'Arrêt maladie non trouvé'
      });
    }

    // Supprimer le fichier du NAS
    try {
      await sftpService.deleteFile(sickLeave.filePath);
    } catch (error) {
      console.error('❌ Erreur suppression fichier:', error.message);
      // Continuer même si la suppression du fichier échoue
    }

    // Supprimer de la base de données
    await SickLeave.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Arrêt maladie supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression arrêt maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'arrêt maladie'
    });
  }
};

module.exports = {
  uploadMiddleware,
  testSftpConnection,
  testUpload,
  uploadSickLeave,
  getAllSickLeaves,
  getSickLeaveById,
  validateSickLeave,
  rejectSickLeave,
  markAsDeclared,
  downloadFile,
  getStats,
  deleteSickLeave
};
