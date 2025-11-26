const mongoose = require('mongoose');
const AdvanceRequest = require('../models/AdvanceRequest');
const Employee = require('../models/Employee');
const emailService = require('../services/emailService');

// Créer une demande d'acompte
const createAdvanceRequest = async (req, res) => {
  try {
    const { amount, deductionMonth, comment } = req.body;
    const employeeId = req.user.id || req.employeeId;
    
    console.log(`💰 Nouvelle demande d'acompte: ${employeeId} - ${amount}€`);
    
    // Validation des données
    if (!amount || !deductionMonth) {
      return res.status(400).json({
        success: false,
        message: 'Montant et mois de déduction requis'
      });
    }
    
    if (amount < 1 || amount > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être entre 1€ et 5000€'
      });
    }
    
    // Récupérer les informations de l'employé
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé'
      });
    }
    
    // Créer la demande
    const advanceRequest = new AdvanceRequest({
      employeeId,
      employeeName: employee.name,
      employeeEmail: employee.email,
      amount,
      deductionMonth,
      comment: comment || ''
    });
    
    await advanceRequest.save();
    
    console.log(`✅ Demande d'acompte créée: ${advanceRequest._id}`);
    console.log(`📋 Détails demande: ${employee.name} - ${amount}€ - ${deductionMonth} - Status: ${advanceRequest.status} - isActive: ${advanceRequest.isActive}`);
    
    // Envoyer email de confirmation au salarié
    try {
      const emailResult = await emailService.sendAdvanceRequestConfirmation(
        employee.email,
        employee.name,
        amount,
        deductionMonth
      );
      
      if (emailResult.success) {
        console.log(`📧 Email confirmation envoyé à ${employee.name}`);
      } else {
        console.log(`⚠️ Échec envoi email à ${employee.name}: ${emailResult.message}`);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email confirmation:', emailError);
    }
    
    // Envoyer notification aux administrateurs configurés dans les paramètres
    try {
      // Récupérer les paramètres d'alerte (même logique que pour les arrêts maladie et congés)
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
      
      console.log(`📧 Destinataires configurés pour notification: ${recipientEmails.length} trouvé(s)`);
      
      if (recipientEmails.length === 0) {
        console.log('⚠️ Aucun destinataire configuré pour les notifications d\'acompte');
      } else {
        // Envoyer l'email à chaque destinataire
        for (const recipientEmail of recipientEmails) {
          // Récupérer le nom du destinataire (admin ou magasin)
          const recipientName = recipientEmail === adminEmailParam?.stringValue ? 'Administrateur' : 'Magasin';
          
          const emailResult = await emailService.sendAdvanceRequestNotification(
            recipientEmail,
            recipientName,
            employee.name,
            amount,
            deductionMonth,
            comment
          );
          
          if (emailResult.success) {
            console.log(`📧 Email notification envoyé à ${recipientName} (${recipientEmail})`);
          } else {
            console.log(`⚠️ Échec envoi email à ${recipientName} (${recipientEmail}): ${emailResult.message || emailResult.error}`);
          }
        }
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email notification:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Demande d\'acompte créée avec succès',
      data: advanceRequest
    });
    
  } catch (error) {
    console.error('❌ Erreur création demande acompte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Récupérer les demandes d'un employé
const getEmployeeAdvanceRequests = async (req, res) => {
  try {
    const employeeId = req.user.id || req.employeeId;
    
    const requests = await AdvanceRequest.getByEmployeeId(employeeId);
    
    res.json({
      success: true,
      data: requests
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération demandes employé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Récupérer toutes les demandes (manager)
const getAllAdvanceRequests = async (req, res) => {
  try {
    const { status, month } = req.query;
    
    let filter = { isActive: true };
    
    if (status) {
      filter.status = status;
    }
    
    if (month) {
      // Recherche insensible à la casse en utilisant une regex
      filter.deductionMonth = { $regex: new RegExp(`^${month.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }
    
    const requests = await AdvanceRequest.find(filter)
      .populate('employeeId', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: requests
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération demandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Récupérer les demandes en attente
const getPendingRequests = async (req, res) => {
  try {
    const requests = await AdvanceRequest.getPendingRequests();
    
    res.json({
      success: true,
      data: requests
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération demandes en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Valider/Rejeter une demande
const updateAdvanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, managerComment, approvedAmount } = req.body;
    // Rendre l'ID manager optionnel (comme les autres routes admin)
    // Utiliser null si pas d'authentification (le champ accepte null dans le modèle)
    const managerId = req.user?.id || req.employeeId || null;
    
    console.log(`💰 Mise à jour demande acompte: ${id} - ${status}`);
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    
    const request = await AdvanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }
    
    // Mettre à jour la demande
    request.status = status;
    request.managerComment = managerComment || '';
    // N'assigner approvedBy que si on a un ID valide (ObjectId MongoDB)
    if (managerId && mongoose.Types.ObjectId.isValid(managerId)) {
      request.approvedBy = managerId;
    }
    // Sinon, laisser approvedBy à null (valeur par défaut du modèle)
    request.approvedAt = new Date();
    
    if (status === 'approved' && approvedAmount) {
      request.amount = approvedAmount;
    }
    
    await request.save();
    
    console.log(`✅ Demande ${status}: ${request._id}`);
    
    // Envoyer email de confirmation au salarié
    try {
      let emailResult;
      
      if (status === 'approved') {
        emailResult = await emailService.sendAdvanceApproved(
          request.employeeEmail,
          request.employeeName,
          request.amount,
          request.deductionMonth,
          managerComment
        );
      } else {
        emailResult = await emailService.sendAdvanceRejected(
          request.employeeEmail,
          request.employeeName,
          request.amount,
          request.deductionMonth,
          managerComment
        );
      }
      
      if (emailResult.success) {
        console.log(`📧 Email ${status} envoyé à ${request.employeeName}`);
      } else {
        console.log(`⚠️ Échec envoi email ${status} à ${request.employeeName}: ${emailResult.message}`);
      }
    } catch (emailError) {
      console.error(`❌ Erreur envoi email ${status}:`, emailError);
    }
    
    res.json({
      success: true,
      message: `Demande ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
      data: request
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Supprimer une demande
const deleteAdvanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await AdvanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }
    
    request.isActive = false;
    await request.save();
    
    console.log(`🗑️ Demande supprimée: ${id}`);
    
    res.json({
      success: true,
      message: 'Demande supprimée avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression demande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

// Récupérer les statistiques
const getAdvanceStats = async (req, res) => {
  try {
    const { month } = req.query;
    
    let filter = { isActive: true };
    if (month) {
      // Recherche insensible à la casse en utilisant une regex
      filter.deductionMonth = { $regex: new RegExp(`^${month.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }
    
    const stats = await AdvanceRequest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalPending = stats.find(s => s._id === 'pending')?.count || 0;
    const totalApproved = stats.find(s => s._id === 'approved')?.count || 0;
    const totalRejected = stats.find(s => s._id === 'rejected')?.count || 0;
    const totalAmount = stats.reduce((sum, s) => sum + s.totalAmount, 0);
    
    res.json({
      success: true,
      data: {
        pending: totalPending,
        approved: totalApproved,
        rejected: totalRejected,
        totalAmount,
        total: totalPending + totalApproved + totalRejected
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

module.exports = {
  createAdvanceRequest,
  getEmployeeAdvanceRequests,
  getAllAdvanceRequests,
  getPendingRequests,
  updateAdvanceRequest,
  deleteAdvanceRequest,
  getAdvanceStats
};
