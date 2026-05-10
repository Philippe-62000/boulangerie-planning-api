const VacationRequest = require('../models/VacationRequest');
const Employee = require('../models/Employee');
const emailService = require('../services/emailService');
const sftpService = require('../services/sftpService');

// Récupérer toutes les demandes de congés
const getAllVacationRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, city = 'Arras' } = req.query;
    
    let query = { city: city };
    if (status) {
      query.status = status;
    }
    
    const vacationRequests = await VacationRequest.find(query)
      .sort({ uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await VacationRequest.countDocuments(query);
    
    res.json({
      success: true,
      data: vacationRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération demandes congés:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des demandes de congés'
    });
  }
};

// Récupérer une demande de congés par ID
const getVacationRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const vacationRequest = await VacationRequest.findById(id);
    
    if (!vacationRequest) {
      return res.status(404).json({
        success: false,
        error: 'Demande de congés non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: vacationRequest
    });
  } catch (error) {
    console.error('❌ Erreur récupération demande congés:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la demande de congés'
    });
  }
};

// Créer une nouvelle demande de congés
const createVacationRequest = async (req, res) => {
  try {
    console.log('📝 Création nouvelle demande de congés...');
    
    // Vérification des données requises
    const { employeeName, employeeEmail, startDate, endDate, reason, precisions, city = 'Arras' } = req.body;
    
    if (!employeeName || !employeeEmail || !startDate || !endDate) {
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

    // Calculer la durée
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Créer la demande de congés
    const vacationRequest = new VacationRequest({
      employeeName,
      employeeEmail,
      city,
      startDate: start,
      endDate: end,
      duration,
      reason: reason || 'Congés payés',
      precisions: precisions || null
    });

    await vacationRequest.save();

    // Envoyer un email de confirmation de réception
    try {
      const confirmationResult = await emailService.sendVacationRequestConfirmation(vacationRequest);
      if (confirmationResult.success) {
        console.log('✅ Email de confirmation envoyé:', confirmationResult.messageId);
      } else {
        console.log('⚠️ Email de confirmation non envoyé:', confirmationResult.error);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email confirmation:', emailError.message);
    }

    // Envoyer un email d'alerte aux administrateurs
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
        const alertResult = await emailService.sendVacationRequestAlert(vacationRequest, recipientEmails);
        if (alertResult.success) {
          console.log('✅ Email d\'alerte envoyé:', alertResult.messageId);
        } else {
          console.log('⚠️ Email d\'alerte non envoyé:', alertResult.error);
        }
      } else {
        console.log('⚠️ Aucun destinataire configuré pour les alertes de congés');
      }
    } catch (alertError) {
      console.error('❌ Erreur envoi email alerte:', alertError.message);
    }

    res.json({
      success: true,
      message: 'Demande de congés créée avec succès',
      data: vacationRequest
    });

  } catch (error) {
    console.error('❌ Erreur création demande congés:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la demande de congés'
    });
  }
};

// Valider une demande de congés
const validateVacationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { validatedBy, notes } = req.body;

    const vacationRequest = await VacationRequest.findById(id);
    
    if (!vacationRequest) {
      return res.status(404).json({
        success: false,
        error: 'Demande de congés non trouvée'
      });
    }

    if (vacationRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cette demande de congés a déjà été traitée'
      });
    }

    // Marquer comme validé
    await vacationRequest.markAsValidated(validatedBy, notes);

    // Créer automatiquement une absence dans "Gestion des salariés"
    try {
      const absenceResult = await createAbsenceFromVacationRequest(vacationRequest);
      if (absenceResult.success) {
        console.log('✅ Absence créée automatiquement:', absenceResult.message);
        
        // Synchroniser l'employé avec les congés
        try {
          console.log('🔍 Recherche employé pour synchronisation:', vacationRequest.employeeName);
          
          // Lister tous les employés pour debug
          const allEmployees = await Employee.find({}, 'name role');
          console.log('👥 Employés disponibles:', allEmployees.map(emp => `${emp.name} (${emp.role})`));
          
          // Recherche plus flexible par nom (sans accents, insensible à la casse)
          const employee = await Employee.findOne({
            $or: [
              { name: { $regex: new RegExp(vacationRequest.employeeName.replace(/[àâäéèêëïîôöùûüÿç]/gi, '[àâäéèêëïîôöùûüÿça]'), 'i') } },
              { name: { $regex: new RegExp(vacationRequest.employeeName, 'i') } }
            ]
          });
          
          console.log('🔍 Employé trouvé:', employee ? `${employee.name} (ID: ${employee._id})` : 'Aucun');
          
          if (employee) {
            const updateResult = await Employee.findByIdAndUpdate(
              employee._id, 
              {
                $set: {
                  'vacation.isOnVacation': true,
                  'vacation.startDate': vacationRequest.startDate,
                  'vacation.endDate': vacationRequest.endDate,
                  'vacation.vacationRequestId': vacationRequest._id
                }
              },
              { new: true }
            );
            
            if (updateResult) {
              console.log('✅ Employé synchronisé avec les congés:', employee.name);
              console.log('📅 Période de congés:', vacationRequest.startDate, '→', vacationRequest.endDate);
            } else {
              console.log('❌ Échec de la mise à jour de l\'employé');
            }
          } else {
            console.log('⚠️ Employé non trouvé pour la synchronisation:', vacationRequest.employeeName);
            
            // Lister tous les employés pour debug
            const allEmployees = await Employee.find({}, 'name role');
            console.log('👥 Employés disponibles:', allEmployees.map(emp => `${emp.name} (${emp.role})`));
          }
        } catch (syncError) {
          console.error('❌ Erreur synchronisation employé:', syncError.message);
        }
      } else {
        console.log('⚠️ Absence non créée:', absenceResult.message);
      }
    } catch (absenceError) {
      console.error('❌ Erreur création absence:', absenceError.message);
    }

    // Envoyer un email de validation au salarié
    try {
      const emailResult = await emailService.sendVacationRequestValidation(vacationRequest, validatedBy);
      if (emailResult.success) {
        console.log('✅ Email de validation envoyé au salarié:', emailResult.messageId);
      } else {
        console.log('⚠️ Email de validation non envoyé au salarié:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email validation au salarié:', emailError.message);
    }

    // Envoyer un email au magasin avec le lien d'impression
    try {
      const Parameter = require('../models/Parameters');
      const storeEmailParam = await Parameter.findOne({ name: 'storeEmail' });
      
      if (storeEmailParam?.stringValue) {
        const storeEmailResult = await emailService.sendVacationRequestValidationToStore(
          vacationRequest,
          storeEmailParam.stringValue,
          validatedBy
        );
        if (storeEmailResult.success) {
          console.log('✅ Email de validation envoyé au magasin:', storeEmailResult.messageId);
        } else {
          console.log('⚠️ Email de validation non envoyé au magasin:', storeEmailResult.error);
        }
      } else {
        console.log('⚠️ Email du magasin non configuré');
      }
    } catch (storeEmailError) {
      console.error('❌ Erreur envoi email validation au magasin:', storeEmailError.message);
    }

    res.json({
      success: true,
      message: 'Demande de congés validée avec succès',
      data: vacationRequest
    });

  } catch (error) {
    console.error('❌ Erreur validation demande congés:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation de la demande de congés'
    });
  }
};

// Rejeter une demande de congés
const rejectVacationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;

    const vacationRequest = await VacationRequest.findById(id);
    
    if (!vacationRequest) {
      return res.status(404).json({
        success: false,
        error: 'Demande de congés non trouvée'
      });
    }

    if (vacationRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cette demande de congés a déjà été traitée'
      });
    }

    // Marquer comme rejeté
    await vacationRequest.markAsRejected(rejectedBy, reason);

    // Envoyer un email de rejet
    try {
      const emailResult = await emailService.sendVacationRequestRejection(vacationRequest, rejectedBy, reason);
      if (emailResult.success) {
        console.log('✅ Email de rejet envoyé:', emailResult.messageId);
      } else {
        console.log('⚠️ Email de rejet non envoyé:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email rejet:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Demande de congés rejetée avec succès',
      data: vacationRequest
    });

  } catch (error) {
    console.error('❌ Erreur rejet demande congés:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du rejet de la demande de congés'
    });
  }
};

// Annuler une demande de congés validée
const cancelVacationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelledBy } = req.body;

    const vacationRequest = await VacationRequest.findById(id);
    
    if (!vacationRequest) {
      return res.status(404).json({
        success: false,
        error: 'Demande de congés non trouvée'
      });
    }

    if (vacationRequest.status !== 'validated') {
      return res.status(400).json({
        success: false,
        error: 'Seules les demandes validées peuvent être annulées'
      });
    }

    // Marquer comme annulé
    await vacationRequest.markAsCancelled(cancelledBy);

    console.log('✅ Demande de congés annulée:', vacationRequest._id);

    res.json({
      success: true,
      message: 'Demande de congés annulée avec succès',
      data: vacationRequest
    });

  } catch (error) {
    console.error('❌ Erreur annulation demande congés:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'annulation de la demande de congés'
    });
  }
};

/**
 * Supprimer définitivement une demande de congés (admin).
 * Aucune notification e-mail envoyée — utile pour effacer une demande
 * créée par erreur ou un doublon, sans alerter le salarié.
 */
const deleteVacationRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const vacationRequest = await VacationRequest.findById(id);
    if (!vacationRequest) {
      return res.status(404).json({
        success: false,
        error: 'Demande de congés non trouvée'
      });
    }

    await VacationRequest.findByIdAndDelete(id);

    console.log(`🗑️ Demande de congés supprimée (sans email): ${id} — ${vacationRequest.employeeName}`);

    res.json({
      success: true,
      message: 'Demande supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression demande congés:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la demande'
    });
  }
};

// Modifier une demande de congés
const updateVacationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    console.log('📝 Modification demande congés:', { id, startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Les dates de début et fin sont requises'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'La date de fin doit être postérieure ou égale à la date de début'
      });
    }

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const vacationRequest = await VacationRequest.findByIdAndUpdate(
      id,
      { 
        startDate: start,
        endDate: end,
        duration
      },
      { new: true }
    );

    if (!vacationRequest) {
      return res.status(404).json({
        success: false,
        error: 'Demande de congés non trouvée'
      });
    }

    console.log('✅ Demande de congés modifiée:', vacationRequest._id);

    res.json({
      success: true,
      message: 'Demande de congés modifiée avec succès',
      data: vacationRequest
    });

  } catch (error) {
    console.error('❌ Erreur modification demande congés:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de la demande de congés'
    });
  }
};

// Fonction utilitaire pour créer une absence depuis une demande de congés
const createAbsenceFromVacationRequest = async (vacationRequest) => {
  try {
    console.log('📋 Création automatique d\'absence pour:', vacationRequest.employeeName);
    
    // Trouver l'employé par nom
    const employee = await Employee.findOne({
      name: { $regex: new RegExp(vacationRequest.employeeName, 'i') }
    });
    
    if (!employee) {
      console.log('❌ Employé non trouvé:', vacationRequest.employeeName);
      throw new Error(`Employé non trouvé: ${vacationRequest.employeeName}`);
    }
    
    console.log('✅ Employé trouvé:', employee.name);
    
    // Vérifier si une absence existe déjà pour cette période
    const existingAbsence = await Employee.findOne({
      _id: employee._id,
      'absences': {
        $elemMatch: {
          startDate: { $lte: vacationRequest.endDate },
          endDate: { $gte: vacationRequest.startDate },
          type: 'Congés payés'
        }
      }
    });
    
    if (existingAbsence) {
      console.log('⚠️ Absence déjà existante pour cette période');
      return {
        success: false,
        message: 'Une absence existe déjà pour cette période',
        existingAbsence: true
      };
    }
    
    // Créer la nouvelle absence
    const newAbsence = {
      startDate: vacationRequest.startDate,
      endDate: vacationRequest.endDate,
      type: 'Congés payés',
      reason: 'Congés validés automatiquement',
      status: 'validated',
      createdAt: new Date(),
      vacationRequestId: vacationRequest._id
    };
    
    // Ajouter l'absence à l'employé
    await Employee.findByIdAndUpdate(
      employee._id,
      { $push: { absences: newAbsence } },
      { new: true }
    );
    
    console.log('✅ Absence créée automatiquement:', newAbsence);
    
    return {
      success: true,
      message: 'Absence créée automatiquement',
      absence: newAbsence,
      employee: employee.name
    };
    
  } catch (error) {
    console.error('❌ Erreur création absence depuis congés:', error.message);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// Forcer la synchronisation des congés avec les employés
const syncVacationsWithEmployees = async (req, res) => {
  try {
    console.log('🔄 SYNCHRONISATION FORCÉE DES CONGÉS');
    
    // Récupérer toutes les demandes de congés validées
    const validatedVacations = await VacationRequest.find({ status: 'validated' });
    console.log(`📋 ${validatedVacations.length} demandes de congés validées trouvées`);
    
    let syncCount = 0;
    
    for (const vacation of validatedVacations) {
      try {
        console.log(`🔍 Synchronisation: ${vacation.employeeName}`);
        
        // Rechercher l'employé
        const employee = await Employee.findOne({
          $or: [
            { name: { $regex: new RegExp(vacation.employeeName.replace(/[àâäéèêëïîôöùûüÿç]/gi, '[àâäéèêëïîôöùûüÿça]'), 'i') } },
            { name: { $regex: new RegExp(vacation.employeeName, 'i') } }
          ]
        });
        
        if (employee) {
          // Mettre à jour l'employé avec les congés
          await Employee.findByIdAndUpdate(employee._id, {
            $set: {
              vacation: {
                isOnVacation: true,
                startDate: vacation.startDate,
                endDate: vacation.endDate,
                vacationRequestId: vacation._id
              }
            }
          });
          
          console.log(`✅ ${employee.name} synchronisé avec les congés`);
          syncCount++;
        } else {
          console.log(`❌ Employé non trouvé: ${vacation.employeeName}`);
        }
      } catch (error) {
        console.error(`❌ Erreur synchronisation ${vacation.employeeName}:`, error.message);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Synchronisation terminée: ${syncCount} employés mis à jour`,
      syncedCount: syncCount,
      totalVacations: validatedVacations.length
    });
  } catch (error) {
    console.error('❌ Erreur synchronisation forcée:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllVacationRequests,
  getVacationRequestById,
  createVacationRequest,
  validateVacationRequest,
  rejectVacationRequest,
  cancelVacationRequest,
  updateVacationRequest,
  deleteVacationRequest,
  syncVacationsWithEmployees
};
