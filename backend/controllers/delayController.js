const Employee = require('../models/Employee');

// Ajouter un retard pour un employé
const addDelay = async (req, res) => {
  try {
    const { employeeId, date, duration, reason } = req.body;

    console.log('🕐 Ajout retard:', { employeeId, date, duration, reason });

    // Validation des données
    if (!employeeId || !date || !duration) {
      return res.status(400).json({ 
        error: 'Données manquantes: employeeId, date et duration sont requis' 
      });
    }

    if (duration < 1) {
      return res.status(400).json({ 
        error: 'La durée du retard doit être d\'au moins 1 minute' 
      });
    }

    // Vérifier que l'employé existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Créer le retard
    const delayData = {
      date: new Date(date),
      duration: parseInt(duration),
      reason: reason || ''
    };

    // Ajouter le retard à l'employé
    employee.delays.push(delayData);
    await employee.save();

    console.log(`✅ Retard ajouté pour ${employee.name}: ${duration}min le ${new Date(date).toLocaleDateString('fr-FR')}`);

    res.json({ 
      success: true, 
      message: `Retard de ${duration} minutes ajouté pour ${employee.name}`,
      delay: delayData
    });

  } catch (error) {
    console.error('❌ Erreur ajout retard:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer les retards d'un employé
const getEmployeeDelays = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('📊 Récupération retards employé:', { employeeId, startDate, endDate });

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    let delays = employee.delays || [];

    // Filtrer par période si spécifiée
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      delays = delays.filter(delay => {
        const delayDate = new Date(delay.date);
        return delayDate >= start && delayDate <= end;
      });
    }

    // Trier par date décroissante
    delays.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ 
      success: true, 
      delays,
      employee: {
        id: employee._id,
        name: employee.name
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération retards:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les retards (pour les statistiques)
const getAllDelays = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('📊 Récupération tous les retards:', { startDate, endDate });

    let employees = await Employee.find({}, 'name delays');
    
    let allDelays = [];
    
    employees.forEach(employee => {
      if (employee.delays && employee.delays.length > 0) {
        employee.delays.forEach(delay => {
          allDelays.push({
            id: delay._id,
            employeeId: employee._id,
            employeeName: employee.name,
            date: delay.date,
            duration: delay.duration,
            reason: delay.reason,
            createdAt: delay.createdAt
          });
        });
      }
    });

    // Filtrer par période si spécifiée
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      allDelays = allDelays.filter(delay => {
        const delayDate = new Date(delay.date);
        return delayDate >= start && delayDate <= end;
      });
    }

    // Trier par date décroissante
    allDelays.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ 
      success: true, 
      delays: allDelays,
      total: allDelays.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération tous les retards:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un retard
const deleteDelay = async (req, res) => {
  try {
    const { employeeId, delayId } = req.params;

    console.log('🗑️ Suppression retard:', { employeeId, delayId });

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    // Trouver et supprimer le retard
    const delayIndex = employee.delays.findIndex(delay => delay._id.toString() === delayId);
    if (delayIndex === -1) {
      return res.status(404).json({ error: 'Retard non trouvé' });
    }

    const deletedDelay = employee.delays[delayIndex];
    employee.delays.splice(delayIndex, 1);
    await employee.save();

    console.log(`✅ Retard supprimé pour ${employee.name}`);

    res.json({ 
      success: true, 
      message: 'Retard supprimé avec succès',
      deletedDelay
    });

  } catch (error) {
    console.error('❌ Erreur suppression retard:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addDelay,
  getEmployeeDelays,
  getAllDelays,
  deleteDelay
};


