const Mutuelle = require('../models/Mutuelle');
const Employee = require('../models/Employee');
const sftpService = require('../services/sftpService');
const imageValidationService = require('../services/imageValidationService');
const emailService = require('../services/emailService');
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
  upload.single('document')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur Multer:', err);
      return res.status(400).json({
        success: false,
        error: 'Erreur lors de l\'upload du fichier',
        details: err.message
      });
    }
    next();
  });
};

// Upload d'un justificatif de mutuelle par un salarié
const uploadMutuelle = async (req, res) => {
  try {
    console.log('📤 Upload justificatif mutuelle reçu');
    
    const { employeeName, employeeEmail, employeeId } = req.body;
    
    if (!employeeName || !employeeEmail || !employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis (nom, email, employeeId)'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    // Validation automatique du fichier
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
        details: validationError.message
      });
    }

    // Upload vers le NAS
    let uploadResult;
    if (!process.env.SFTP_PASSWORD) {
      console.log('⚠️ Mot de passe SFTP non configuré, sauvegarde locale...');
      const fileName = `${Date.now()}_${employeeName.replace(/\s+/g, '_')}_mutuelle_${req.file.originalname}`;
      uploadResult = {
        fileName: fileName,
        remotePath: `/temp/${fileName}`,
        localPath: `/uploads/${fileName}`
      };
    } else {
      try {
        uploadResult = await sftpService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          `${employeeName}_mutuelle`
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
    let mutuelle;
    try {
      mutuelle = new Mutuelle({
        employeeName: employeeName.trim(),
        employeeId: employeeId,
        employeeEmail: employeeEmail.trim().toLowerCase(),
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
      await mutuelle.save();
      console.log('✅ Justificatif mutuelle enregistré:', mutuelle._id);
    } catch (saveError) {
      console.error('❌ Erreur sauvegarde en base:', saveError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la sauvegarde en base de données',
        details: saveError.message
      });
    }

    // Envoyer un accusé de réception au salarié
    try {
      const acknowledgementResult = await emailService.sendMutuelleAcknowledgement(mutuelle);
      if (acknowledgementResult.success) {
        console.log('✅ Accusé de réception envoyé au salarié');
      }
    } catch (ackError) {
      console.error('❌ Erreur envoi accusé de réception:', ackError.message);
    }

    // Envoyer une alerte aux administrateurs
    try {
      const Parameter = require('../models/Parameters');
      const storeEmailParam = await Parameter.findOne({ name: 'storeEmail' });
      const adminEmailParam = await Parameter.findOne({ name: 'adminEmail' });
      const alertStoreParam = await Parameter.findOne({ name: 'alertStore' });
      const alertAdminParam = await Parameter.findOne({ name: 'alertAdmin' });
      
      const recipientEmails = [];
      
      if (alertStoreParam?.booleanValue && storeEmailParam?.stringValue) {
        recipientEmails.push(storeEmailParam.stringValue);
      }
      
      if (alertAdminParam?.booleanValue && adminEmailParam?.stringValue) {
        recipientEmails.push(adminEmailParam.stringValue);
      }
      
      if (recipientEmails.length > 0) {
        const alertResult = await emailService.sendMutuelleAlert(mutuelle, recipientEmails);
        if (alertResult.success) {
          console.log('✅ Alerte email envoyée');
        }
      }
    } catch (alertError) {
      console.error('❌ Erreur envoi alerte email:', alertError.message);
    }

    res.json({
      success: true,
      message: 'Justificatif mutuelle uploadé avec succès',
      data: {
        id: mutuelle._id,
        status: mutuelle.status,
        validation: {
          score: validation.qualityScore,
          message: validation.message,
          isReadable: validation.isReadable
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur upload justificatif mutuelle:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload du justificatif mutuelle'
    });
  }
};

// Récupérer tous les justificatifs mutuelle (admin)
const getAllMutuelle = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'uploadDate', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const [mutuelles, total] = await Promise.all([
      Mutuelle.find(query)
        .populate('employeeId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Mutuelle.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        mutuelles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération justificatifs mutuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des justificatifs mutuelle'
    });
  }
};

// Récupérer un justificatif par ID
const getMutuelleById = async (req, res) => {
  try {
    const mutuelle = await Mutuelle.findById(req.params.id)
      .populate('employeeId', 'name email');
    
    if (!mutuelle) {
      return res.status(404).json({
        success: false,
        error: 'Justificatif mutuelle non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: mutuelle
    });
  } catch (error) {
    console.error('❌ Erreur récupération justificatif mutuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du justificatif mutuelle'
    });
  }
};

// Télécharger un fichier
const downloadFile = async (req, res) => {
  try {
    const mutuelle = await Mutuelle.findById(req.params.id);
    
    if (!mutuelle) {
      return res.status(404).json({
        success: false,
        error: 'Justificatif mutuelle non trouvé'
      });
    }
    
    try {
      const fileBuffer = await sftpService.downloadFile(mutuelle.filePath);
      
      res.setHeader('Content-Type', mutuelle.fileType);
      res.setHeader('Content-Disposition', `attachment; filename="${mutuelle.originalFileName}"`);
      res.setHeader('Content-Length', mutuelle.fileSize);
      
      res.send(fileBuffer);
    } catch (downloadError) {
      console.error('❌ Erreur téléchargement fichier:', downloadError);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du téléchargement du fichier'
      });
    }
  } catch (error) {
    console.error('❌ Erreur récupération justificatif mutuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du justificatif mutuelle'
    });
  }
};

// Valider un justificatif mutuelle
const validateMutuelle = async (req, res) => {
  try {
    const { validatedBy, notes } = req.body;
    const mutuelle = await Mutuelle.findById(req.params.id)
      .populate('employeeId', 'name email');
    
    if (!mutuelle) {
      return res.status(404).json({
        success: false,
        error: 'Justificatif mutuelle non trouvé'
      });
    }
    
    await mutuelle.markAsValidated(validatedBy || 'Admin', notes || '');
    
    // Envoyer un email de confirmation au salarié
    try {
      await emailService.sendMutuelleValidation(mutuelle, validatedBy || 'Admin');
    } catch (emailError) {
      console.error('❌ Erreur envoi email validation:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Justificatif mutuelle validé avec succès',
      data: mutuelle
    });
  } catch (error) {
    console.error('❌ Erreur validation justificatif mutuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation du justificatif mutuelle'
    });
  }
};

// Rejeter un justificatif mutuelle
const rejectMutuelle = async (req, res) => {
  try {
    const { rejectedBy, reason } = req.body;
    const mutuelle = await Mutuelle.findById(req.params.id)
      .populate('employeeId', 'name email');
    
    if (!mutuelle) {
      return res.status(404).json({
        success: false,
        error: 'Justificatif mutuelle non trouvé'
      });
    }
    
    await mutuelle.markAsRejected(rejectedBy || 'Admin', reason || 'Document illisible');
    
    // Envoyer un email de rejet au salarié
    try {
      await emailService.sendMutuelleRejection(mutuelle, reason || 'Document illisible', rejectedBy || 'Admin');
    } catch (emailError) {
      console.error('❌ Erreur envoi email rejet:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Justificatif mutuelle rejeté',
      data: mutuelle
    });
  } catch (error) {
    console.error('❌ Erreur rejet justificatif mutuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du rejet du justificatif mutuelle'
    });
  }
};

// Supprimer un justificatif mutuelle
const deleteMutuelle = async (req, res) => {
  try {
    const mutuelle = await Mutuelle.findById(req.params.id);
    
    if (!mutuelle) {
      return res.status(404).json({
        success: false,
        error: 'Justificatif mutuelle non trouvé'
      });
    }
    
    // Supprimer le fichier du NAS si possible
    try {
      await sftpService.deleteFile(mutuelle.filePath);
    } catch (deleteError) {
      console.error('⚠️ Erreur suppression fichier NAS:', deleteError);
      // Continuer même si la suppression du fichier échoue
    }
    
    await Mutuelle.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Justificatif mutuelle supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression justificatif mutuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du justificatif mutuelle'
    });
  }
};

// Obtenir les statistiques
const getStats = async (req, res) => {
  try {
    const stats = await Mutuelle.getStats();
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const employeesWithMutuelle = await Employee.countDocuments({ 
      isActive: true, 
      mutuelle: 'Oui Entreprise' 
    });
    const employeesWithoutMutuelle = await Employee.countDocuments({ 
      isActive: true, 
      mutuelle: 'Non Perso' 
    });
    
    res.json({
      success: true,
      data: {
        ...stats,
        employees: {
          total: totalEmployees,
          withMutuelle: employeesWithMutuelle,
          withoutMutuelle: employeesWithoutMutuelle
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération statistiques mutuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Obtenir la liste des employés avec leur statut mutuelle (pour impression)
const getEmployeesList = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .select('name email mutuelle')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('❌ Erreur récupération liste employés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la liste des employés'
    });
  }
};

// Envoyer des rappels pour les justificatifs qui expirent bientôt
const sendExpirationReminders = async () => {
  try {
    console.log('📧 Vérification des justificatifs mutuelle expirant bientôt...');
    
    // Récupérer les justificatifs qui expirent dans les 30 prochains jours
    const expiringSoon = await Mutuelle.getExpiringSoon(30);
    
    if (expiringSoon.length === 0) {
      console.log('✅ Aucun justificatif à rappeler');
      return { success: true, count: 0 };
    }
    
    console.log(`📧 ${expiringSoon.length} justificatif(s) nécessitant un rappel`);
    
    let sentCount = 0;
    for (const mutuelle of expiringSoon) {
      try {
        // Envoyer un email de rappel
        await emailService.sendMutuelleReminder(mutuelle);
        
        // Marquer comme rappel envoyé
        mutuelle.reminderSent = true;
        mutuelle.reminderSentAt = new Date();
        await mutuelle.save();
        
        sentCount++;
        console.log(`✅ Rappel envoyé à ${mutuelle.employeeName} (${mutuelle.employeeEmail})`);
      } catch (error) {
        console.error(`❌ Erreur envoi rappel à ${mutuelle.employeeName}:`, error);
      }
    }
    
    console.log(`✅ ${sentCount} rappel(s) envoyé(s) avec succès`);
    return { success: true, count: sentCount };
  } catch (error) {
    console.error('❌ Erreur envoi rappels mutuelle:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadMiddleware,
  uploadMutuelle,
  getAllMutuelle,
  getMutuelleById,
  downloadFile,
  validateMutuelle,
  rejectMutuelle,
  deleteMutuelle,
  getStats,
  getEmployeesList,
  sendExpirationReminders
};

