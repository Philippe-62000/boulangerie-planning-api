const Employee = require('../models/Employee');
const Absence = require('../models/Absence');
const SickLeave = require('../models/SickLeave');

// Obtenir tous les employés avec leurs absences
const getAllEmployees = async (req, res) => {
  try {
    // Récupérer les employés actifs
    const employees = await Employee.find({ isActive: true })
      .sort({ name: 1 });
    
    // Récupérer toutes les absences depuis le modèle Absence
    const allAbsences = await Absence.find({});
    
    // Récupérer tous les arrêts maladie depuis le modèle SickLeave
    const allSickLeaves = await SickLeave.find({});
    
    // Récupérer les absences pour chaque employé
    const employeesWithAbsences = await Promise.all(
      employees.map(async (employee) => {
        // Récupérer les absences depuis le modèle Employee (ancien système)
        const employeeAbsences = employee.absences || [];
        
        // Récupérer les absences depuis le modèle Absence (nouveau système)
        const absenceModelAbsences = allAbsences.filter(a => 
          a.employeeId && a.employeeId.toString() === employee._id.toString()
        );
        
        // Récupérer les arrêts maladie depuis le modèle SickLeave (par nom ou email)
        const sickLeaveModelAbsences = allSickLeaves.filter(sl => {
          // Comparer par nom (insensible à la casse) ou email
          const nameMatch = sl.employeeName && employee.name && 
            sl.employeeName.toLowerCase().trim() === employee.name.toLowerCase().trim();
          const emailMatch = sl.employeeEmail && employee.email && 
            sl.employeeEmail.toLowerCase().trim() === employee.email.toLowerCase().trim();
          return nameMatch || emailMatch;
        });
        
        // Fusionner les deux sources d'absences
        const mergedAbsences = [...employeeAbsences];
        
        // Ajouter les absences du modèle Absence qui ne sont pas déjà dans employee.absences
        absenceModelAbsences.forEach(absenceModel => {
          // Vérifier si l'absence existe déjà par absenceId
          const existsById = mergedAbsences.some(a => 
            a.absenceId && a.absenceId.toString() === absenceModel._id.toString()
          );
          
          // Si c'est un arrêt maladie (type MAL), vérifier aussi par sickLeaveId pour éviter les doublons
          if (!existsById && (absenceModel.type === 'MAL' || absenceModel.type === 'Arrêt maladie')) {
            if (absenceModel.sickLeaveId) {
              const existsBySickLeaveId = mergedAbsences.some(a => 
                a.sickLeaveId && a.sickLeaveId.toString() === absenceModel.sickLeaveId.toString()
              );
              if (existsBySickLeaveId) {
                return; // Ne pas ajouter si déjà présent via sickLeaveId
              }
            }
          }
          
          if (!existsById) {
            mergedAbsences.push({
              startDate: absenceModel.startDate,
              endDate: absenceModel.endDate,
              type: absenceModel.type,
              reason: absenceModel.reason || '',
              createdAt: absenceModel.createdAt,
              absenceId: absenceModel._id,
              sickLeaveId: absenceModel.sickLeaveId // Inclure le sickLeaveId si disponible
            });
          }
        });
        
        // Ajouter les arrêts maladie du modèle SickLeave qui ne sont pas déjà dans mergedAbsences
        sickLeaveModelAbsences.forEach(sickLeaveModel => {
          const sickLeaveIdStr = sickLeaveModel._id.toString();
          
          // Vérifier si un arrêt maladie avec le même sickLeaveId existe déjà dans mergedAbsences
          // (vérifier dans employee.absences, Absence model, ou déjà ajouté)
          const existsById = mergedAbsences.some(a => {
            if (a.type !== 'MAL' && a.type !== 'Arrêt maladie') return false;
            // Vérifier par sickLeaveId si disponible (le plus fiable)
            if (a.sickLeaveId) {
              return a.sickLeaveId.toString() === sickLeaveIdStr;
            }
            return false;
          });
          
          // Si pas trouvé par ID, vérifier par dates (pour les anciens arrêts maladie sans sickLeaveId)
          // Mais seulement si l'absence n'a pas déjà un sickLeaveId différent
          if (!existsById) {
            const existsByDate = mergedAbsences.some(a => {
              if (a.type !== 'MAL' && a.type !== 'Arrêt maladie') return false;
              // Si l'absence a déjà un sickLeaveId, c'est un autre arrêt, ne pas comparer par dates
              if (a.sickLeaveId) return false;
              
              const aStart = new Date(a.startDate).toISOString().split('T')[0];
              const aEnd = new Date(a.endDate).toISOString().split('T')[0];
              const slStart = new Date(sickLeaveModel.startDate).toISOString().split('T')[0];
              const slEnd = new Date(sickLeaveModel.endDate).toISOString().split('T')[0];
              return aStart === slStart && aEnd === slEnd;
            });
            
            if (!existsByDate) {
              mergedAbsences.push({
                startDate: sickLeaveModel.startDate,
                endDate: sickLeaveModel.endDate,
                type: 'MAL', // Normaliser en 'MAL'
                reason: 'Arrêt maladie',
                createdAt: sickLeaveModel.uploadDate || sickLeaveModel.createdAt,
                sickLeaveId: sickLeaveModel._id // Référence vers le document SickLeave
              });
            }
          }
        });
        
        // Filtrer les absences actuelles et futures
        const currentAbsences = mergedAbsences.filter(a => {
          const startDate = new Date(a.startDate);
          const endDate = new Date(a.endDate);
          const now = new Date();
          return startDate <= now && endDate >= now;
        });
        
        const futureAbsences = mergedAbsences.filter(a => {
          const startDate = new Date(a.startDate);
          return startDate > new Date();
        });
        
        return {
          ...employee.toObject(),
          absences: {
            current: currentAbsences.filter(a => a.type === 'ABS'),
            future: futureAbsences.filter(a => a.type === 'ABS'),
            all: mergedAbsences.filter(a => a.type === 'ABS')
          },
          sickLeaves: {
            current: currentAbsences.filter(a => a.type === 'MAL' || a.type === 'Arrêt maladie'),
            future: futureAbsences.filter(a => a.type === 'MAL' || a.type === 'Arrêt maladie'),
            all: mergedAbsences.filter(a => a.type === 'MAL' || a.type === 'Arrêt maladie')
          },
          delays: {
            current: currentAbsences.filter(a => a.type === 'RET'),
            future: futureAbsences.filter(a => a.type === 'RET'),
            all: mergedAbsences.filter(a => a.type === 'RET')
          },
          totalAbsences: mergedAbsences.length
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
    
    // Préparer les données : convertir les chaînes vides en undefined pour les champs avec index sparse unique
    const employeeData = { ...req.body };
    if (employeeData.saleCode === '') {
      employeeData.saleCode = undefined;
    }
    if (employeeData.connectionCode === '') {
      employeeData.connectionCode = undefined;
    }
    
    const employee = new Employee(employeeData);
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
    
    // Trouver l'employé existant
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    
    // ⚠️ IMPORTANT: Supprimer le champ password du body pour éviter de l'écraser
    const updateData = { ...req.body };
    delete updateData.password;

    // Le frontend envoie explicitement null pour les salariés hors vente ; Mongoose ne peut pas
    // caster null sur le sous-schéma vendeusePlanningPreferences → ValidationError 400.
    const shouldUnsetVendeusePrefs =
      Object.prototype.hasOwnProperty.call(req.body, 'vendeusePlanningPreferences') &&
      req.body.vendeusePlanningPreferences === null;
    if (shouldUnsetVendeusePrefs) {
      delete updateData.vendeusePlanningPreferences;
    }
    
    console.log('🔐 Champ password préservé lors de la mise à jour');
    
    // Mettre à jour les champs
    Object.assign(employee, updateData);

    if (shouldUnsetVendeusePrefs) {
      employee.vendeusePlanningPreferences = undefined;
      employee.markModified('vendeusePlanningPreferences');
    }
    
    // Sauvegarder (cela déclenchera le middleware pre('save') pour générer le code vente si nécessaire)
    await employee.save();
    
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
    console.log(`🔍 Avant sauvegarde - Mot de passe: ${tempPassword}`);
    employee.password = tempPassword;
    console.log(`🔍 Après assignation - employee.password: ${employee.password}`);
    
    const savedEmployee = await employee.save();
    console.log(`🔍 Après sauvegarde - savedEmployee.password: ${savedEmployee.password}`);
    
    console.log(`📧 Mot de passe temporaire sauvegardé pour ${employee.name}: ${tempPassword}`);
    
    // Envoyer l'email (simulation - en attendant le service email)
    console.log(`📧 Email simulé envoyé à ${employee.email}:`);
    console.log(`   - Employé: ${employee.name}`);
    console.log(`   - Mot de passe temporaire: ${tempPassword}`);
    console.log(`   - URL de connexion: https://www.filmara.fr/salarie-connexion.html`);
    
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

