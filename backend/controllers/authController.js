const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const emailService = require('../services/emailService');

// Générer un mot de passe aléatoire
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Envoyer un mot de passe à un salarié
const sendPasswordToEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔐 Envoi de mot de passe pour l\'employé:', id);
    
    // Récupérer l'employé avec le mot de passe
    const employee = await Employee.findById(id).select('+password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employé non trouvé'
      });
    }
    
    if (!employee.email) {
      return res.status(400).json({
        success: false,
        error: 'Aucun email configuré pour cet employé'
      });
    }
    
    // Générer un nouveau mot de passe
    const newPassword = generateRandomPassword();
    
    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour l'employé avec le nouveau mot de passe
    employee.password = hashedPassword;
    await employee.save();
    
    console.log('✅ Mot de passe généré et hashé pour:', employee.name);
    
    // Envoyer l'email avec le mot de passe
    try {
      await emailService.sendEmployeePassword({
        employeeName: employee.name,
        employeeEmail: employee.email,
        password: newPassword,
        loginUrl: 'https://www.filmara.fr/plan/salarie-connexion.html'
      });
      
      console.log('✅ Email envoyé à:', employee.email);
      
      res.json({
        success: true,
        message: `Mot de passe envoyé à ${employee.email}`,
        email: employee.email
      });
      
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi de l\'email'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur sendPasswordToEmployee:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'envoi du mot de passe'
    });
  }
};

// Connexion d'un salarié
const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Tentative de connexion salarié:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }
    
    // Récupérer l'employé avec le mot de passe
    const employee = await Employee.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    }).select('+password');
    
    if (!employee) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }
    
    if (!employee.password) {
      return res.status(401).json({
        success: false,
        error: 'Aucun mot de passe configuré. Contactez votre administrateur.'
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }
    
    // Générer un token JWT
    const token = jwt.sign(
      { 
        employeeId: employee._id,
        email: employee.email,
        name: employee.name,
        role: 'employee'
      },
      process.env.JWT_SECRET || 'votre-cle-secrete-ici',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Connexion réussie pour:', employee.name);
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur employeeLogin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la connexion'
    });
  }
};

// Récupérer les informations de l'employé connecté
const getEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.employeeId; // Défini par le middleware d'authentification
    
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employé non trouvé'
      });
    }
    
    res.json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        contractType: employee.contractType
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur getEmployeeProfile:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// Changer le mot de passe d'un salarié
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const employeeId = req.user.id || req.employeeId; // ID de l'employé connecté
    
    console.log('🔍 req.user:', req.user);
    console.log('🔍 req.employeeId:', req.employeeId);
    console.log(`🔐 Changement de mot de passe pour l'employé: ${employeeId}`);
    
    // Vérifier que l'ID de l'employé est défini
    if (!employeeId) {
      console.error('❌ ID employé non défini dans le token');
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification invalide'
      });
    }
    
    // Validation des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Récupérer l'employé
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé non trouvé'
      });
    }
    
    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }
    
    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour le mot de passe
    employee.password = hashedNewPassword;
    await employee.save();
    
    console.log(`✅ Mot de passe changé avec succès pour: ${employee.name}`);
    
    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

module.exports = {
  sendPasswordToEmployee,
  employeeLogin,
  getEmployeeProfile,
  generateRandomPassword,
  changePassword
};