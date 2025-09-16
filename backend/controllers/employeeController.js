const Employee = require('../models/Employee');
const Absence = require('../models/Absence');

// Obtenir tous les employés avec leurs absences
const getAllEmployees = async (req, res) => {
  try {
    // Récupérer les employés actifs
    const employees = await Employee.find({ isActive: true })
      .sort({ name: 1 });
    
    // Récupérer les absences pour chaque employé
    const employeesWithAbsences = await Promise.all(
      employees.map(async (employee) => {
        // Récupérer les absences depuis le modèle Employee
        const absences = employee.absences || [];
        
        // Filtrer les absences actuelles et futures
        const currentAbsences = absences.filter(a => {
          const startDate = new Date(a.startDate);
          const endDate = new Date(a.endDate);
          const now = new Date();
          return startDate <= now && endDate >= now;
        });
        
        const futureAbsences = absences.filter(a => {
          const startDate = new Date(a.startDate);
          return startDate > new Date();
        });
        
        return {
          ...employee.toObject(),
          absences: {
            current: currentAbsences.filter(a => a.type === 'ABS'),
            future: futureAbsences.filter(a => a.type === 'ABS'),
            all: absences.filter(a => a.type === 'ABS')
          },
          sickLeaves: {
            current: currentAbsences.filter(a => a.type === 'MAL' || a.type === 'Arrêt maladie'),
            future: futureAbsences.filter(a => a.type === 'MAL' || a.type === 'Arrêt maladie'),
            all: absences.filter(a => a.type === 'MAL' || a.type === 'Arrêt maladie')
          },
          delays: {
            current: currentAbsences.filter(a => a.type === 'RET'),
            future: futureAbsences.filter(a => a.type === 'RET'),
            all: absences.filter(a => a.type === 'RET')
          },
          totalAbsences: absences.length
        };
      })
    );
    
    console.log(`📊 ${employeesWithAbsences.length} employés récupérés avec leurs absences`);
    res.json({ 
      success: true, 
      data: employeesWithAbsences 
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des employés:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir un employé par ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer un nouvel employé
const createEmployee = async (req, res) => {
  try {
    console.log('🔍 Création employé - Données reçues:', req.body);
    
    const employee = new Employee(req.body);
    await employee.save();
    
    console.log('✅ Employé créé avec succès:', employee);
    res.status(201).json(employee);
  } catch (error) {
    console.error('❌ Erreur création employé:', error);
    if (error.name === 'ValidationError') {
      console.error('❌ Erreurs de validation:', error.errors);
      return res.status(400).json({ 
        error: error.message,
        details: error.errors 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un employé
const updateEmployee = async (req, res) => {
  try {
    console.log('Update employee - ID:', req.params.id);
    console.log('Update employee - Body:', req.body);
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    console.log('Employee updated:', employee);
    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Désactiver un employé (soft delete)
const deactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    res.json({ message: 'Employé désactivé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Réactiver un employé
const reactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer définitivement un employé
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    res.json({ message: 'Employé supprimé définitivement' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Déclarer un arrêt maladie
const declareSickLeave = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        sickLeave: {
          isOnSickLeave: true,
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    
    res.json(employee);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Envoyer un mot de passe à un employé (temporaire - en attendant la résolution jsonwebtoken)
const sendPasswordToEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log('📧 Envoi de mot de passe pour employé:', employeeId);
    
    // Trouver l'employé
    const employee = await Employee.findById(employeeId);
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
    
    // Générer un mot de passe temporaire simple
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Sauvegarder le mot de passe temporaire en base de données
    employee.password = tempPassword;
    await employee.save();
    
    console.log(`📧 Mot de passe temporaire sauvegardé pour ${employee.name}: ${tempPassword}`);
    
    // Envoyer l'email (simulation - en attendant le service email)
    console.log(`📧 Email simulé envoyé à ${employee.email}:`);
    console.log(`   - Employé: ${employee.name}`);
    console.log(`   - Mot de passe temporaire: ${tempPassword}`);
    console.log(`   - URL de connexion: https://www.filmara.fr/plan/salarie-connexion.html`);
    
    // TODO: Implémenter l'envoi d'email réel quand le service sera configuré
    // Pour l'instant, on retourne le mot de passe dans la réponse (à des fins de test)
    
    res.json({
      success: true,
      message: `Mot de passe envoyé à ${employee.email}`,
      tempPassword: tempPassword, // À retirer en production
      employeeName: employee.name,
      employeeEmail: employee.email
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'envoi du mot de passe'
    });
  }
};

// Connexion employé simple (sans JWT)
const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Tentative de connexion employé:', email);
    
    // Trouver l'employé par email (inclure le champ password)
    const employee = await Employee.findOne({ 
      email: email,
      isActive: true 
    }).select('+password');
    
    if (!employee) {
      console.log('❌ Employé non trouvé:', email);
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }
    
    // Debug: Afficher les mots de passe (temporaire)
    console.log('🔍 Mot de passe saisi:', password);
    console.log('🔍 Mot de passe en base:', employee.password);
    
    // Vérification simple du mot de passe (pour les mots de passe temporaires)
    // En production, il faudrait hasher et comparer
    if (employee.password !== password) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }
    
    console.log('✅ Connexion réussie pour:', employee.name);
    
    // Retourner les informations de l'employé (sans JWT pour l'instant)
    res.json({
      success: true,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role || 'employee',
        skills: employee.skills,
        weeklyHours: employee.weeklyHours
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur connexion employé:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la connexion'
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  deleteEmployee,
  declareSickLeave,
  sendPasswordToEmployee,
  employeeLogin
};

