const SickLeave = require('../models/SickLeave');
const sftpService = require('../services/sftpService');
const imageValidationService = require('../services/imageValidationService');
const emailService = require('../services/emailService');
const absenceService = require('../services/absenceService');
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

// Middleware d'upload avec gestion d'erreurs
const uploadMiddleware = (req, res, next) => {
  console.log('🔧 Middleware Multer - Début');
  console.log('🔧 Headers:', req.headers);
  console.log('🔧 Content-Type:', req.headers['content-type']);
  console.log('🔧 Body (avant multer):', req.body);
  
  upload.single('document')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur Multer:', err);
      return res.status(400).json({
        success: false,
        error: 'Erreur lors de l\'upload du fichier',
        details: err.message
      });
    }
    
    console.log('✅ Middleware Multer - Succès');
    console.log('✅ File après Multer:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : 'undefined'
    } : 'Aucun fichier');
    console.log('✅ Body après Multer:', req.body);
    
    next();
  });
};

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
    const therapeuticPartTime =
      req.body.therapeuticPartTime === true ||
      req.body.therapeuticPartTime === 'true' ||
      req.body.therapeuticPartTime === 'on';
    
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
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'La date de fin doit être postérieure ou égale à la date de début'
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
        therapeuticPartTime,
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

    // Envoyer un accusé de réception au salarié
    try {
      const acknowledgementResult = await emailService.sendSickLeaveAcknowledgement(sickLeave);
      if (acknowledgementResult.success) {
        console.log('✅ Accusé de réception envoyé au salarié:', acknowledgementResult.messageId);
        // Enregistrer le statut d'envoi
        sickLeave.confirmationEmail = {
          sent: true,
          sentAt: new Date(),
          messageId: acknowledgementResult.messageId || ''
        };
        await sickLeave.save();
      } else {
        console.log('⚠️ Accusé de réception non envoyé:', acknowledgementResult.error);
        sickLeave.confirmationEmail = {
          sent: false,
          sentAt: null,
          messageId: ''
        };
        await sickLeave.save();
      }
    } catch (ackError) {
      console.error('❌ Erreur envoi accusé de réception:', ackError.message);
      // Enregistrer l'échec
      sickLeave.confirmationEmail = {
        sent: false,
        sentAt: null,
        messageId: ''
      };
      await sickLeave.save();
      // Continuer même si l'email d'accusé échoue
    }

    // Envoyer une alerte aux administrateurs/magasin
    try {
      // Récupérer les paramètres d'alerte
      const Parameter = require('../models/Parameters');
      const storeEmailParam = await Parameter.findOne({ name: 'storeEmail' });
      const adminEmailParam = await Parameter.findOne({ name: 'adminEmail' });
      const alertStoreParam = await Parameter.findOne({ name: 'alertStore' });
      const alertAdminParam = await Parameter.findOne({ name: 'alertAdmin' });
      
      const recipientEmails = [];
      
      // Ajouter l'email du magasin si activé
      if (alertStoreParam?.booleanValue && storeEmailParam?.stringValue) {
        recipientEmails.push(storeEmailParam.stringValue);
      }
      
      // Ajouter l'email de l'admin si activé
      if (alertAdminParam?.booleanValue && adminEmailParam?.stringValue) {
        recipientEmails.push(adminEmailParam.stringValue);
      }
      
      if (recipientEmails.length > 0) {
        const alertResult = await emailService.sendAlertEmail(sickLeave, recipientEmails);
        if (alertResult.success) {
          console.log('✅ Alerte email envoyée:', alertResult.messageId);
        } else {
          console.log('⚠️ Alerte email non envoyée:', alertResult.error);
        }
      } else {
        console.log('⚠️ Aucun destinataire configuré pour les alertes');
      }
    } catch (alertError) {
      console.error('❌ Erreur envoi alerte email:', alertError.message);
      // Continuer même si l'alerte échoue
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

// Créer un arrêt maladie (déclaration manuelle, fichier optionnel)
const createSickLeave = async (req, res) => {
  try {
    console.log('📝 Création arrêt maladie (déclaration manuelle)');
    console.log('📝 Body:', req.body);
    console.log('📝 File:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'Aucun fichier');
    
    // Vérification des données requises
    const { employeeId, employeeName, employeeEmail, startDate, endDate, reason } = req.body;
    
    // Récupérer l'employé si employeeId est fourni
    let employee = null;
    if (employeeId) {
      const Employee = require('../models/Employee');
      employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employé non trouvé'
        });
      }
    }
    
    // Utiliser les données de l'employé si disponibles, sinon celles du body
    const finalEmployeeName = employeeName || (employee ? employee.name : '');
    const finalEmployeeEmail = employeeEmail || (employee ? employee.email : '');
    
    if (!finalEmployeeName || !finalEmployeeEmail || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis (nom, email, date début, date fin)'
      });
    }

    // Validation des dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'La date de fin doit être postérieure ou égale à la date de début'
      });
    }

    // Traitement du fichier si fourni
    let uploadResult = null;
    let validation = null;
    
    if (req.file) {
      console.log('📤 Fichier fourni, traitement en cours...');
      
      // Validation automatique du fichier
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
          details: validationError.message
        });
      }

      // Upload vers le NAS (ou sauvegarde locale si SFTP non configuré)
      if (!process.env.SFTP_PASSWORD) {
        console.log('⚠️ Mot de passe SFTP non configuré, sauvegarde locale...');
        const fileName = `${Date.now()}_${finalEmployeeName.replace(/\s+/g, '_')}_${req.file.originalname}`;
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
            finalEmployeeName
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
    } else {
      console.log('ℹ️ Aucun fichier fourni, arrêt maladie créé sans certificat médical');
    }

    // Création de l'enregistrement en base
    console.log('💾 Création de l\'enregistrement en base...');
    
    const sickLeaveData = {
      employeeName: finalEmployeeName.trim(),
      employeeEmail: finalEmployeeEmail.trim().toLowerCase(),
      startDate: start,
      endDate: end,
      status: 'pending'
    };
    
    // Ajouter les données de fichier si disponibles
    if (uploadResult && req.file) {
      sickLeaveData.fileName = uploadResult.fileName;
      sickLeaveData.originalFileName = req.file.originalname;
      sickLeaveData.fileSize = req.file.size;
      sickLeaveData.fileType = req.file.mimetype;
      sickLeaveData.filePath = uploadResult.remotePath;
      
      if (validation) {
        sickLeaveData.autoValidation = {
          isReadable: validation.isReadable,
          qualityScore: validation.qualityScore,
          validationMessage: validation.message
        };
      }
    }
    
    let sickLeave;
    try {
      sickLeave = new SickLeave(sickLeaveData);
      await sickLeave.save();
      console.log('✅ Arrêt maladie créé:', sickLeave._id);
    } catch (createError) {
      console.error('❌ Erreur création arrêt maladie:', createError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de l\'arrêt maladie',
        details: createError.message
      });
    }

    // Synchroniser l'employé avec l'arrêt maladie créé manuellement
    // Cela permet au dashboard de prendre en compte l'arrêt maladie même s'il est en statut 'pending'
    if (employee && employee._id) {
      try {
        await Employee.findByIdAndUpdate(employee._id, {
          $set: {
            'sickLeave.isOnSickLeave': true,
            'sickLeave.startDate': sickLeave.startDate,
            'sickLeave.endDate': sickLeave.endDate
          }
        });
        console.log('✅ Employé synchronisé avec l\'arrêt maladie créé manuellement:', employee.name);
      } catch (syncError) {
        console.error('❌ Erreur synchronisation employé lors de la création:', syncError.message);
        // Ne pas bloquer si la synchronisation échoue
      }
    } else {
      // Si employeeId est fourni mais employee n'a pas été trouvé, essayer de synchroniser quand même
      if (employeeId) {
        try {
          const Employee = require('../models/Employee');
          const employeeToSync = await Employee.findById(employeeId);
          if (employeeToSync) {
            await Employee.findByIdAndUpdate(employeeId, {
              $set: {
                'sickLeave.isOnSickLeave': true,
                'sickLeave.startDate': sickLeave.startDate,
                'sickLeave.endDate': sickLeave.endDate
              }
            });
            console.log('✅ Employé synchronisé avec l\'arrêt maladie (par ID):', employeeToSync.name);
          }
        } catch (syncError) {
          console.error('❌ Erreur synchronisation employé par ID:', syncError.message);
        }
      }
    }

    // Envoyer un accusé de réception au salarié si email disponible
    if (finalEmployeeEmail) {
      try {
        const acknowledgementResult = await emailService.sendSickLeaveAcknowledgement(sickLeave);
        if (acknowledgementResult.success) {
          console.log('✅ Accusé de réception envoyé au salarié:', acknowledgementResult.messageId);
          sickLeave.confirmationEmail = {
            sent: true,
            sentAt: new Date(),
            messageId: acknowledgementResult.messageId || ''
          };
          await sickLeave.save();
        } else {
          console.log('⚠️ Accusé de réception non envoyé:', acknowledgementResult.error);
          sickLeave.confirmationEmail = {
            sent: false,
            sentAt: null,
            messageId: ''
          };
          await sickLeave.save();
        }
      } catch (ackError) {
        console.error('❌ Erreur envoi accusé de réception:', ackError.message);
        sickLeave.confirmationEmail = {
          sent: false,
          sentAt: null,
          messageId: ''
        };
        await sickLeave.save();
      }
    }

    res.json({
      success: true,
      message: 'Arrêt maladie créé avec succès',
      data: {
        id: sickLeave._id,
        status: sickLeave.status,
        hasFile: !!req.file,
        validation: validation ? {
          score: validation.qualityScore,
          message: validation.message,
          isReadable: validation.isReadable
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Erreur création arrêt maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'arrêt maladie',
      details: error.message
    });
  }
};

// Récupérer tous les arrêts maladie (admin)
const getAllSickLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;
    
    const query = {};
    // Si status est 'all', ne pas filtrer par statut (retourner tous les arrêts maladie)
    if (status && status !== 'all') {
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

    let sickLeave = await SickLeave.findById(id);
    
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

    // Récupérer sickLeave à nouveau pour avoir la dernière version
    sickLeave = await SickLeave.findById(id);

    // Créer automatiquement une absence dans "Gestion des salariés"
    try {
      const absenceResult = await absenceService.createAbsenceFromSickLeave(sickLeave);
      if (absenceResult.success) {
        console.log('✅ Absence créée automatiquement:', absenceResult.message);
        
        // Synchroniser l'employé avec l'arrêt maladie (utiliser le même employé trouvé par absenceService)
        try {
          const Employee = require('../models/Employee');
          
          // Nettoyer le nom (enlever les suffixes comme "- Manager", "- Salarié", etc.)
          const cleanName = sickLeave.employeeName.split(' - ')[0].trim();
          
          // Recherche d'employé : d'abord par email (plus fiable), puis par nom
          let employee = null;
          
          // 1. Recherche par email si disponible
          if (sickLeave.employeeEmail) {
            employee = await Employee.findOne({
              email: { $regex: new RegExp(`^${sickLeave.employeeEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
          }
          
          // 2. Recherche par nom exact
          if (!employee) {
            employee = await Employee.findOne({
              name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
          }
          
          // 3. Recherche par nom partiel (contient le nom nettoyé)
          if (!employee) {
            employee = await Employee.findOne({
              name: { $regex: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
            });
          }
          
          // 4. Recherche par nom original (avec tous les suffixes)
          if (!employee) {
            employee = await Employee.findOne({
              name: { $regex: new RegExp(sickLeave.employeeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
            });
          }
          
          if (employee) {
            await Employee.findByIdAndUpdate(employee._id, {
              $set: {
                'sickLeave.isOnSickLeave': true,
                'sickLeave.startDate': sickLeave.startDate,
                'sickLeave.endDate': sickLeave.endDate
              }
            });
            console.log('✅ Employé synchronisé avec l\'arrêt maladie:', employee.name);
          } else {
            console.log('⚠️ Employé non trouvé pour la synchronisation:', sickLeave.employeeName, 'email:', sickLeave.employeeEmail);
          }
        } catch (syncError) {
          console.error('❌ Erreur synchronisation employé:', syncError.message);
        }
      } else {
        console.log('⚠️ Absence non créée:', absenceResult.message);
      }
    } catch (absenceError) {
      console.error('❌ Erreur création absence:', absenceError.message);
      // Continuer même si la création d'absence échoue
    }

    // Envoyer un email de validation au salarié
    try {
      const emailResult = await emailService.sendSickLeaveValidation(sickLeave, validatedBy);
      // Récupérer sickLeave à nouveau avant d'enregistrer le statut d'email
      sickLeave = await SickLeave.findById(id);
      if (emailResult.success) {
        console.log('✅ Email de validation envoyé:', emailResult.messageId);
        // Enregistrer le statut d'envoi
        sickLeave.validationEmail = {
          sent: true,
          sentAt: new Date(),
          messageId: emailResult.messageId || ''
        };
        await sickLeave.save();
      } else {
        console.log('⚠️ Email de validation non envoyé:', emailResult.error);
        sickLeave.validationEmail = {
          sent: false,
          sentAt: null,
          messageId: ''
        };
        await sickLeave.save();
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email validation:', emailError.message);
      // Récupérer sickLeave à nouveau avant d'enregistrer l'échec
      sickLeave = await SickLeave.findById(id);
      // Enregistrer l'échec
      sickLeave.validationEmail = {
        sent: false,
        sentAt: null,
        messageId: ''
      };
      await sickLeave.save();
      // Continuer même si l'email échoue
    }

    // Passer automatiquement en "declared" après validation et envoyer l'email au comptable
    try {
      // Récupérer sickLeave à nouveau avant de déclarer
      sickLeave = await SickLeave.findById(id);
      
      // Marquer comme déclaré automatiquement
      await sickLeave.markAsDeclared(validatedBy || 'Système', 'Déclaré automatiquement après validation');
      
      // Déplacer le fichier vers le dossier déclaré
      try {
        const newPath = await sftpService.moveFile(sickLeave.filePath, 'declared');
        sickLeave.filePath = newPath;
        await sickLeave.save();
      } catch (error) {
        console.error('❌ Erreur déplacement fichier vers declared:', error.message);
        // Continuer même si le déplacement échoue
      }
      
      // Récupérer sickLeave à nouveau
      sickLeave = await SickLeave.findById(id);
      
      // Envoyer l'email au comptable
      try {
        const Parameter = require('../models/Parameters');
        const accountantEmailParam = await Parameter.findOne({ name: 'accountantEmail' });
        
        if (accountantEmailParam && accountantEmailParam.stringValue) {
          const emailResult = await emailService.sendToAccountant(sickLeave, accountantEmailParam.stringValue);
          // Récupérer sickLeave à nouveau avant d'enregistrer le statut d'email
          sickLeave = await SickLeave.findById(id);
          if (emailResult.success) {
            console.log('✅ Email au comptable envoyé:', emailResult.messageId);
            // Enregistrer le statut d'envoi
            sickLeave.accountantNotification = {
              sent: true,
              sentAt: new Date(),
              sentTo: accountantEmailParam.stringValue
            };
            await sickLeave.save();
          } else {
            console.log('⚠️ Email au comptable non envoyé:', emailResult.error);
            sickLeave.accountantNotification = {
              sent: false,
              sentAt: null,
              sentTo: accountantEmailParam.stringValue
            };
            await sickLeave.save();
          }
        } else {
          console.log('⚠️ Email du comptable non configuré');
        }
      } catch (emailError) {
        console.error('❌ Erreur envoi email comptable:', emailError.message);
        // Récupérer sickLeave à nouveau avant d'enregistrer l'échec
        try {
          const Parameter = require('../models/Parameters');
          const accountantEmailParam = await Parameter.findOne({ name: 'accountantEmail' });
          sickLeave = await SickLeave.findById(id);
          sickLeave.accountantNotification = {
            sent: false,
            sentAt: null,
            sentTo: accountantEmailParam?.stringValue || ''
          };
          await sickLeave.save();
        } catch (saveError) {
          console.error('❌ Erreur enregistrement statut email comptable:', saveError.message);
        }
        // Continuer même si l'email échoue
      }
    } catch (declareError) {
      console.error('❌ Erreur lors du passage en déclaré:', declareError.message);
      // Continuer même si la déclaration échoue
    }

    // Récupérer sickLeave à nouveau pour avoir toutes les mises à jour
    sickLeave = await SickLeave.findById(id);

    res.json({
      success: true,
      message: 'Arrêt maladie validé et déclaré avec succès',
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

    // Supprimer l'absence si elle a été créée automatiquement
    try {
      const absenceResult = await absenceService.removeAbsenceFromSickLeave(sickLeave._id);
      if (absenceResult.success) {
        console.log('✅ Absence supprimée:', absenceResult.message);
      }
    } catch (absenceError) {
      console.error('❌ Erreur suppression absence:', absenceError.message);
      // Continuer même si la suppression échoue
    }

    // Envoyer un email de rejet au salarié
    try {
      const emailResult = await emailService.sendSickLeaveRejection(sickLeave, reason, rejectedBy);
      if (emailResult.success) {
        console.log('✅ Email de rejet envoyé:', emailResult.messageId);
      } else {
        console.log('⚠️ Email de rejet non envoyé:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email rejet:', emailError.message);
      // Continuer même si l'email échoue
    }

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
    const { declaredBy, notes, sendToAccountant = true } = req.body;

    let sickLeave = await SickLeave.findById(id);
    
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

    // Récupérer sickLeave à nouveau pour avoir la dernière version
    sickLeave = await SickLeave.findById(id);

    // Synchroniser l'employé avec l'arrêt maladie déclaré
    try {
      const Employee = require('../models/Employee');
      
      // Nettoyer le nom (enlever les suffixes comme "- Manager", "- Salarié", etc.)
      const cleanName = sickLeave.employeeName.split(' - ')[0].trim();
      
      // Recherche d'employé : d'abord par email (plus fiable), puis par nom
      let employee = null;
      
      // 1. Recherche par email si disponible
      if (sickLeave.employeeEmail) {
        employee = await Employee.findOne({
          email: { $regex: new RegExp(`^${sickLeave.employeeEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
      }
      
      // 2. Recherche par nom exact
      if (!employee) {
        employee = await Employee.findOne({
          name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
      }
      
      // 3. Recherche par nom partiel (contient le nom nettoyé)
      if (!employee) {
        employee = await Employee.findOne({
          name: { $regex: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        });
      }
      
      // 4. Recherche par nom original (avec tous les suffixes)
      if (!employee) {
        employee = await Employee.findOne({
          name: { $regex: new RegExp(sickLeave.employeeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        });
      }
      
      if (employee) {
        await Employee.findByIdAndUpdate(employee._id, {
          $set: {
            'sickLeave.isOnSickLeave': true,
            'sickLeave.startDate': sickLeave.startDate,
            'sickLeave.endDate': sickLeave.endDate
          }
        });
        console.log('✅ Employé synchronisé avec l\'arrêt maladie déclaré:', employee.name);
      } else {
        console.log('⚠️ Employé non trouvé pour la synchronisation lors de la déclaration:', sickLeave.employeeName, 'email:', sickLeave.employeeEmail);
      }
    } catch (syncError) {
      console.error('❌ Erreur synchronisation employé lors de la déclaration:', syncError.message);
    }

    // Envoyer un email au comptable uniquement si demandé
    if (sendToAccountant) {
      try {
        // Récupérer l'email du comptable depuis les paramètres
        const Parameter = require('../models/Parameters');
        const accountantEmailParam = await Parameter.findOne({ name: 'accountantEmail' });
        
        if (accountantEmailParam && accountantEmailParam.stringValue) {
          const emailResult = await emailService.sendToAccountant(sickLeave, accountantEmailParam.stringValue);
          // Récupérer sickLeave à nouveau avant d'enregistrer le statut d'email
          sickLeave = await SickLeave.findById(id);
          if (emailResult.success) {
            console.log('✅ Email au comptable envoyé:', emailResult.messageId);
            // Enregistrer le statut d'envoi
            sickLeave.accountantNotification = {
              sent: true,
              sentAt: new Date(),
              sentTo: accountantEmailParam.stringValue
            };
            await sickLeave.save();
          } else {
            console.log('⚠️ Email au comptable non envoyé:', emailResult.error);
            sickLeave.accountantNotification = {
              sent: false,
              sentAt: null,
              sentTo: accountantEmailParam.stringValue
            };
            await sickLeave.save();
          }
        } else {
          console.log('⚠️ Email du comptable non configuré');
        }
      } catch (emailError) {
        console.error('❌ Erreur envoi email comptable:', emailError.message);
        // Récupérer sickLeave à nouveau avant d'enregistrer l'échec
        try {
          const Parameter = require('../models/Parameters');
          const accountantEmailParam = await Parameter.findOne({ name: 'accountantEmail' });
          sickLeave = await SickLeave.findById(id);
          sickLeave.accountantNotification = {
            sent: false,
            sentAt: null,
            sentTo: accountantEmailParam?.stringValue || ''
          };
          await sickLeave.save();
        } catch (saveError) {
          console.error('❌ Erreur enregistrement statut email comptable:', saveError.message);
        }
        // Continuer même si l'email échoue
      }
    } else {
      console.log('ℹ️ Email au comptable non demandé lors de la déclaration');
    }

    // Récupérer sickLeave à nouveau pour avoir toutes les mises à jour
    sickLeave = await SickLeave.findById(id);

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
    let fileBuffer;
    try {
      console.log('📥 Tentative de téléchargement:', sickLeave.filePath);
      fileBuffer = await sftpService.downloadFile(sickLeave.filePath);
      console.log('✅ Fichier téléchargé avec succès, taille:', fileBuffer.length);
    } catch (error) {
      console.error('❌ Erreur téléchargement fichier:', error.message);
      
      // Si le fichier n'est pas trouvé au chemin enregistré, essayer le chemin de l'ancien format
      if (error.message.includes('No such file') || error.message.includes('ENOENT')) {
        console.log('⚠️ Fichier non trouvé au chemin enregistré, essai avec l\'ancien format...');
        
        // Extraire le nom du fichier du chemin
        const fileName = sickLeave.filePath.split('/').pop();
        const year = new Date(sickLeave.uploadDate).getFullYear();
        
        // Essayer le chemin de l'ancien format (directement dans le dossier année)
        const oldFormatPath = `/n8n/sick-leaves/${year}/${fileName}`;
        console.log(`🔄 Essai avec l'ancien format: ${oldFormatPath}`);
        
        try {
          fileBuffer = await sftpService.downloadFile(oldFormatPath);
          console.log('✅ Fichier trouvé avec l\'ancien format, taille:', fileBuffer.length);
        } catch (oldFormatError) {
          console.error('❌ Fichier non trouvé même avec l\'ancien format:', oldFormatError.message);
          
          // Retourner une erreur plus claire
          return res.status(404).json({
            success: false,
            error: 'Fichier non trouvé sur le serveur. Le fichier a peut-être été supprimé ou déplacé.',
            details: {
              originalPath: sickLeave.filePath,
              alternativePath: oldFormatPath,
              fileName: sickLeave.originalFileName
            }
          });
        }
      } else {
        // Autre erreur (connexion, permissions, etc.)
        console.error('❌ Erreur de téléchargement:', error.message);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors du téléchargement du fichier',
          details: error.message
        });
      }
    }

  res.set({
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Type, Content-Length',
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

// Test de la configuration email
const testEmailConfiguration = async (req, res) => {
  try {
    console.log('📧 Test de la configuration email...');
    
    const emailConfig = {
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpUser: process.env.SMTP_USER || process.env.EMAIL_USER,
      smtpPass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
      configured: !!(process.env.SMTP_USER || process.env.EMAIL_USER) && !!(process.env.SMTP_PASS || process.env.EMAIL_PASSWORD),
      nodemailerAvailable: !!require('nodemailer'),
      nodeModulesPath: require.resolve('nodemailer')
    };

    // Vérifier la connexion SMTP
    const connectionResult = await emailService.verifyConnection();
    
    res.json({
      success: true,
      message: 'Test de configuration email terminé',
      config: {
        ...emailConfig,
        smtpPass: emailConfig.smtpPass ? '***' + emailConfig.smtpPass.slice(-3) : 'Non configuré',
        connectionTest: connectionResult
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur test configuration email:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du test de configuration email'
    });
  }
};

// Supprimer tous les arrêts maladie (admin uniquement)
const deleteAllSickLeaves = async (req, res) => {
  try {
    console.log('🗑️ Suppression de tous les arrêts maladie...');
    
    // Compter les arrêts maladie avant suppression
    const count = await SickLeave.countDocuments();
    
    if (count === 0) {
      return res.json({
        success: true,
        message: 'Aucun arrêt maladie à supprimer',
        deletedCount: 0
      });
    }
    
    // Supprimer tous les arrêts maladie de la base de données
    // NOTE: On ne supprime PAS les fichiers du NAS pour des raisons légales
    const result = await SickLeave.deleteMany({});
    
    console.log(`✅ ${result.deletedCount} arrêts maladie supprimés de la base de données`);
    console.log('⚠️ Les fichiers sur le NAS sont conservés pour des raisons légales');
    
    res.json({
      success: true,
      message: `${result.deletedCount} arrêts maladie supprimés de la base de données`,
      deletedCount: result.deletedCount,
      note: 'Les fichiers sur le NAS sont conservés'
    });

  } catch (error) {
    console.error('❌ Erreur suppression tous les arrêts maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression des arrêts maladie'
    });
  }
};

// Modifier les dates d'un arrêt maladie
const updateSickLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, therapeuticPartTime } = req.body;

    console.log('📝 Modification arrêt maladie:', { id, startDate, endDate, therapeuticPartTime });

    // Validation des dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Les dates de début et de fin sont requises'
      });
    }

    // Vérifier que la date de fin est après la date de début
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      return res.status(400).json({
        success: false,
        error: 'La date de fin doit être après la date de début'
      });
    }

    // Calculer la durée
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const updatePayload = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      updatedAt: new Date()
    };
    if (therapeuticPartTime !== undefined) {
      updatePayload.therapeuticPartTime =
        therapeuticPartTime === true || therapeuticPartTime === 'true';
    }

    // Mettre à jour l'arrêt maladie
    const updatedSickLeave = await SickLeave.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    );

    if (!updatedSickLeave) {
      return res.status(404).json({
        success: false,
        error: 'Arrêt maladie non trouvé'
      });
    }

    console.log('✅ Arrêt maladie modifié:', updatedSickLeave._id);

    res.json({
      success: true,
      message: 'Dates modifiées avec succès',
      data: updatedSickLeave
    });

  } catch (error) {
    console.error('❌ Erreur modification arrêt maladie:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification des dates'
    });
  }
};

// Renvoyer l'email au comptable
const resendAccountantEmail = async (req, res) => {
  try {
    const { id } = req.params;
    
    let sickLeave = await SickLeave.findById(id);
    
    if (!sickLeave) {
      return res.status(404).json({
        success: false,
        error: 'Arrêt maladie non trouvé'
      });
    }

    // Récupérer l'email du comptable depuis les paramètres
    const Parameter = require('../models/Parameters');
    const accountantParam = await Parameter.findOne({ name: 'accountantEmail' });
    let accountantEmail = accountantParam?.stringValue || process.env.ACCOUNTANT_EMAIL;
    
    if (!accountantEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email du comptable non configuré'
      });
    }

    // Envoyer l'email au comptable
    console.log('📧 Renvoi email comptable à:', accountantEmail);
    const accountantResult = await emailService.sendToAccountant(sickLeave, accountantEmail);
    
    // Récupérer sickLeave à nouveau avant d'enregistrer le statut
    sickLeave = await SickLeave.findById(id);
    
    if (accountantResult.success) {
      console.log('✅ Email comptable renvoyé:', accountantResult.messageId);
      // Enregistrer le statut d'envoi
      sickLeave.accountantNotification = {
        sent: true,
        sentAt: new Date(),
        sentTo: accountantEmail
      };
      await sickLeave.save();
      
      // Récupérer à nouveau pour retourner la version mise à jour
      sickLeave = await SickLeave.findById(id);
      
      res.json({
        success: true,
        message: 'Email au comptable renvoyé avec succès',
        data: sickLeave
      });
    } else {
      console.log('⚠️ Email comptable non renvoyé:', accountantResult.error);
      // Enregistrer l'échec
      sickLeave.accountantNotification = {
        sent: false,
        sentAt: null,
        sentTo: accountantEmail
      };
      await sickLeave.save();
      
      // Récupérer à nouveau pour retourner la version mise à jour
      sickLeave = await SickLeave.findById(id);
      
      res.status(500).json({
        success: false,
        error: 'Erreur lors du renvoi de l\'email au comptable',
        details: accountantResult.error
      });
    }

  } catch (error) {
    console.error('❌ Erreur renvoi email comptable:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du renvoi de l\'email au comptable'
    });
  }
};

module.exports = {
  uploadMiddleware,
  testSftpConnection,
  testUpload,
  testEmailConfiguration,
  uploadSickLeave,
  createSickLeave,
  getAllSickLeaves,
  getSickLeaveById,
  validateSickLeave,
  rejectSickLeave,
  markAsDeclared,
  updateSickLeave,
  downloadFile,
  getStats,
  deleteSickLeave,
  deleteAllSickLeaves,
  resendAccountantEmail
};
