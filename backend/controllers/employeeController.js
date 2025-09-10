const Employee = require('../models/Employee');
const Absence = require('../models/Absence');

// Obtenir tous les employés avec leurs absences
exports.getAllEmployees = async (req, res) => {
  try {
    // Récupérer les employés actifs
    const employees = await Employee.find({ isActive: true })
      .sort({ name: 1 });
    
    // Récupérer les absences pour chaque employé
    const employeesWithAbsences = await Promise.all(
      employees.map(async (employee) => {
        // Récupérer les absences actuelles et futures de l'employé
        const absences = await Absence.find({ 
          employeeId: employee._id,
          endDate: { $gte: new Date() } // Absences qui ne sont pas encore terminées
        }).sort({ startDate: 1 });
        
        // Séparer les différents types d'absences
        const currentAbsences = absences.filter(a => 
          a.startDate <= new Date() && a.endDate >= new Date()
        );
        
        const futureAbsences = absences.filter(a => 
          a.startDate > new Date()
        );
        
        return {
          ...employee.toObject(),
          absences: {
            current: currentAbsences.filter(a => a.type === 'ABS'),
            future: futureAbsences.filter(a => a.type === 'ABS'),
            all: absences.filter(a => a.type === 'ABS')
          },
          sickLeaves: {
            current: currentAbsences.filter(a => a.type === 'MAL'),
            future: futureAbsences.filter(a => a.type === 'MAL'),
            all: absences.filter(a => a.type === 'MAL')
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
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
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

