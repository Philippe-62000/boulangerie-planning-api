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
exports.getEmployeeById = async (req, res) => {
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
exports.createEmployee = async (req, res) => {
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
exports.updateEmployee = async (req, res) => {
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
exports.deactivateEmployee = async (req, res) => {
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
exports.reactivateEmployee = async (req, res) => {
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
exports.deleteEmployee = async (req, res) => {
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
exports.declareSickLeave = async (req, res) => {
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

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeSkills,
  updateEmployeeAbsence,
  updateEmployeeSickLeave,
  sendPasswordToEmployee
};

