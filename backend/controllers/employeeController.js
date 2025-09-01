const Employee = require('../models/Employee');

// Obtenir tous les employés
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });f
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

