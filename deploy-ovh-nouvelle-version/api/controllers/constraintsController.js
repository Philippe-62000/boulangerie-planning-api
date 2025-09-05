const WeeklyConstraints = require('../models/WeeklyConstraints');
const Employee = require('../models/Employee');

// Créer ou mettre à jour les contraintes pour une semaine
exports.upsertConstraints = async (req, res) => {
  try {
    const { weekNumber, year, employeeId, constraints } = req.body;

    // Vérifier que l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Créer ou mettre à jour les contraintes
    const constraintData = await WeeklyConstraints.findOneAndUpdate(
      { weekNumber, year, employeeId },
      {
        constraints,
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    ).populate('employeeId', 'name role');

    res.json(constraintData);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les contraintes pour une semaine spécifique
exports.getConstraintsByWeek = async (req, res) => {
  try {
    const { weekNumber, year } = req.params;

    const constraints = await WeeklyConstraints.find({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year)
    }).populate('employeeId', 'name role contractType skills');

    res.json(constraints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les contraintes pour un employé spécifique
exports.getConstraintsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const constraints = await WeeklyConstraints.find({ employeeId })
      .sort({ year: -1, weekNumber: -1 })
      .populate('employeeId', 'name role');

    res.json(constraints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer les contraintes pour une semaine
exports.deleteConstraints = async (req, res) => {
  try {
    const { weekNumber, year, employeeId } = req.params;

    const result = await WeeklyConstraints.findOneAndDelete({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year),
      employeeId
    });

    if (!result) {
      return res.status(404).json({ error: 'Contraintes non trouvées' });
    }

    res.json({ message: 'Contraintes supprimées avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Appliquer une contrainte globale (comme "Fermé") à tous les employés pour un jour
exports.applyGlobalConstraint = async (req, res) => {
  try {
    const { weekNumber, year, day, constraint } = req.body;

    // Obtenir tous les employés actifs
    const employees = await Employee.find({ isActive: true });

    const updatePromises = employees.map(employee => {
      return WeeklyConstraints.findOneAndUpdate(
        { weekNumber, year, employeeId: employee._id },
        {
          [`constraints.${day}`]: constraint,
          updatedAt: new Date()
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );
    });

    await Promise.all(updatePromises);

    res.json({ message: `Contrainte "${constraint}" appliquée à tous les employés pour ${day}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

