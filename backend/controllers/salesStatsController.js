const SalesStats = require('../models/SalesStats');
const Employee = require('../models/Employee');

// Sauvegarder les statistiques de vente pour un mois/année
exports.saveSalesStats = async (req, res) => {
  try {
    const { month, year, salesData } = req.body;

    // Validation des données
    if (!month || !year || !salesData) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes: month, year, salesData requis'
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Mois invalide (doit être entre 1 et 12)'
      });
    }

    if (year < 2020 || year > 2030) {
      return res.status(400).json({
        success: false,
        error: 'Année invalide (doit être entre 2020 et 2030)'
      });
    }

    // Vérifier que les employés existent
    const employeeIds = Object.keys(salesData);
    const employees = await Employee.find({ _id: { $in: employeeIds } });
    
    if (employees.length !== employeeIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Certains employés n\'existent pas'
      });
    }

    // Créer ou mettre à jour les statistiques
    const statsData = {
      month: parseInt(month),
      year: parseInt(year),
      salesData: new Map()
    };

    // Convertir les données en Map MongoDB
    for (const [employeeId, data] of Object.entries(salesData)) {
      statsData.salesData.set(employeeId, {
        caNetHt: parseFloat(data.caNetHt) || 0,
        nbClients: parseInt(data.nbClients) || 0,
        panierMoyen: parseFloat(data.panierMoyen) || 0,
        nbPromo: parseInt(data.nbPromo || data.nbMenus) || 0, // Support ancien format
        nbCartesFid: parseInt(data.nbCartesFid) || 0,
        nbAvisPositifs: parseInt(data.nbAvisPositifs) || 0,
        nbAvisNegatifs: parseInt(data.nbAvisNegatifs) || 0
      });
    }

    // Utiliser upsert pour créer ou mettre à jour
    const result = await SalesStats.findOneAndUpdate(
      { month: statsData.month, year: statsData.year },
      statsData,
      { 
        new: true, 
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`✅ Statistiques de vente sauvegardées pour ${month}/${year}`);

    res.json({
      success: true,
      message: 'Statistiques de vente sauvegardées avec succès',
      data: {
        month: result.month,
        year: result.year,
        employeesCount: result.salesData.size,
        createdAt: result.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde statistiques vente:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde des statistiques',
      details: error.message
    });
  }
};

// Obtenir les statistiques pour une période spécifique
exports.getSalesStatsForPeriod = async (req, res) => {
  try {
    const { month, year } = req.params;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Mois et année requis'
      });
    }

    const stats = await SalesStats.getStatsForPeriod(parseInt(month), parseInt(year));

    if (!stats) {
      return res.json({
        success: true,
        data: null,
        message: 'Aucune statistique trouvée pour cette période'
      });
    }

    // Enrichir avec les noms des employés
    const enrichedData = {};
    for (const [employeeId, data] of stats.salesData.entries()) {
      const employee = await Employee.findById(employeeId);
      enrichedData[employeeId] = {
        ...data.toObject(),
        employeeName: employee ? employee.name : 'Employé inconnu',
        function: employee ? employee.function : 'Inconnue'
      };
    }

    res.json({
      success: true,
      data: {
        month: stats.month,
        year: stats.year,
        salesData: enrichedData,
        createdAt: stats.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération statistiques période:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
};

// Obtenir les statistiques mensuelles agrégées pour une année
exports.getMonthlyStatsForYear = async (req, res) => {
  try {
    const { year } = req.params;

    if (!year) {
      return res.status(400).json({
        success: false,
        error: 'Année requise'
      });
    }

    const monthlyStats = await SalesStats.getMonthlyAggregatedStats(parseInt(year));

    // Formater les données pour le frontend
    const formattedStats = {};
    monthlyStats.forEach(stat => {
      formattedStats[String(stat.month).padStart(2, '0')] = {
        totalCA: stat.totalCA || 0,
        totalClients: stat.totalClients || 0,
        totalCartesFid: stat.totalCartesFid || 0,
        totalAvisPositifs: stat.totalAvisPositifs || 0,
        totalAvisNegatifs: stat.totalAvisNegatifs || 0
      };
    });

    res.json({
      success: true,
      data: formattedStats,
      year: parseInt(year)
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats mensuelles:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques mensuelles',
      details: error.message
    });
  }
};

// Obtenir le classement des employés pour une période
exports.getEmployeeRanking = async (req, res) => {
  try {
    const { month, year } = req.params;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Mois et année requis'
      });
    }

    const ranking = await SalesStats.getEmployeeRanking(parseInt(month), parseInt(year));

    // Enrichir avec les informations des employés
    const enrichedRanking = await Promise.all(
      ranking.map(async (emp, index) => {
        const employee = await Employee.findById(emp.employeeId);
        return {
          rank: index + 1,
          employeeId: emp.employeeId,
          name: employee ? employee.name : 'Employé inconnu',
          function: employee ? employee.function : 'Inconnue',
          caNetHt: emp.caNetHt,
          nbClients: emp.nbClients,
          panierMoyen: emp.panierMoyen,
          nbMenus: emp.nbMenus,
          nbCartesFid: emp.nbCartesFid,
          nbAvisPositifs: emp.nbAvisPositifs,
          nbAvisNegatifs: emp.nbAvisNegatifs,
          score: emp.score
        };
      })
    );

    res.json({
      success: true,
      data: {
        month: parseInt(month),
        year: parseInt(year),
        ranking: enrichedRanking
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération classement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du classement',
      details: error.message
    });
  }
};

// Obtenir toutes les statistiques disponibles
exports.getAllSalesStats = async (req, res) => {
  try {
    const stats = await SalesStats.find().sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: stats,
      count: stats.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération toutes stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de toutes les statistiques',
      details: error.message
    });
  }
};

// Supprimer les statistiques d'une période
exports.deleteSalesStats = async (req, res) => {
  try {
    const { month, year } = req.params;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Mois et année requis'
      });
    }

    const result = await SalesStats.findOneAndDelete({
      month: parseInt(month),
      year: parseInt(year)
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Statistiques non trouvées pour cette période'
      });
    }

    console.log(`🗑️ Statistiques supprimées pour ${month}/${year}`);

    res.json({
      success: true,
      message: 'Statistiques supprimées avec succès',
      data: {
        month: result.month,
        year: result.year,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erreur suppression statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression des statistiques',
      details: error.message
    });
  }
};
