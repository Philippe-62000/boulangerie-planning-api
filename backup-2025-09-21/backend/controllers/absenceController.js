const Absence = require('../models/Absence');
const Employee = require('../models/Employee');

// Déclarer une absence
exports.declareAbsence = async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;

    // Vérifier que l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Créer l'absence
    const absence = new Absence({
      employeeId,
      employeeName: employee.name,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await absence.save();

    res.status(201).json({
      message: 'Absence déclarée avec succès',
      absence
    });
  } catch (error) {
    console.error('Erreur lors de la déclaration d\'absence:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les statistiques d'absences
exports.getAbsenceStats = async (req, res) => {
  try {
    const { period, startDate, endDate, employeeId } = req.query;

    console.log('📊 Récupération des statistiques d\'absences avec filtres:', { period, startDate, endDate, employeeId });

    // Construire la requête pour les employés
    let employeeQuery = { isActive: true };
    if (employeeId) {
      employeeQuery._id = employeeId;
    }

    // Récupérer tous les employés avec leurs absences
    const employees = await Employee.find(employeeQuery)
      .select('name role absences')
      .sort({ name: 1 });

    console.log(`📊 ${employees.length} employés trouvés`);

    // Traiter les absences pour chaque employé
    const stats = [];
    let globalTotals = {
      totalMal: 0,
      totalAbs: 0,
      totalRet: 0,
      totalAbsences: 0,
      totalDays: 0
    };

    employees.forEach(employee => {
      const employeeAbsences = employee.absences || [];
      
      // Filtrer par période si spécifiée
      let filteredAbsences = employeeAbsences;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredAbsences = employeeAbsences.filter(absence => {
          const absenceStart = new Date(absence.startDate);
          const absenceEnd = new Date(absence.endDate);
          return absenceStart <= end && absenceEnd >= start;
        });
      }

      // Compter par type
      const malCount = filteredAbsences.filter(a => a.type === 'MAL' || a.type === 'Arrêt maladie').length;
      const absCount = filteredAbsences.filter(a => a.type === 'ABS').length;
      const retCount = filteredAbsences.filter(a => a.type === 'RET').length;
      const totalAbsences = filteredAbsences.length;

      // Calculer le total de jours
      const totalDays = filteredAbsences.reduce((sum, absence) => {
        const start = new Date(absence.startDate);
        const end = new Date(absence.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0);

      if (totalAbsences > 0) {
        stats.push({
          employeeId: employee._id,
          employeeName: employee.name,
          absences: filteredAbsences,
          totalAbsences,
          totalDays,
          malCount,
          absCount,
          retCount
        });

        // Ajouter aux totaux globaux
        globalTotals.totalMal += malCount;
        globalTotals.totalAbs += absCount;
        globalTotals.totalRet += retCount;
        globalTotals.totalAbsences += totalAbsences;
        globalTotals.totalDays += totalDays;
      }
    });

    console.log(`📊 ${stats.length} employés avec absences trouvés`);
    console.log('📊 Totaux globaux:', globalTotals);

    res.json({
      stats,
      globalTotals,
      period: { startDate, endDate, employeeId }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir toutes les absences
exports.getAllAbsences = async (req, res) => {
  try {
    const absences = await Absence.find()
      .populate('employeeId', 'name role')
      .sort({ startDate: -1 });

    res.json(absences);
  } catch (error) {
    console.error('Erreur lors de la récupération des absences:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une absence
exports.deleteAbsence = async (req, res) => {
  try {
    const { id } = req.params;

    const absence = await Absence.findByIdAndDelete(id);
    if (!absence) {
      return res.status(404).json({ error: 'Absence non trouvée' });
    }

    res.json({ message: 'Absence supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'absence:', error);
    res.status(500).json({ error: error.message });
  }
};



