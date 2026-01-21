const DailyLosses = require('../models/DailyLosses');

// Récupérer ou créer une entrée pour une date donnée
const getOrCreateDailyLosses = async (req, res) => {
  try {
    const { date, city = 'longuenesse' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'La date est requise'
      });
    }

    // Parser la date directement depuis "YYYY-MM-DD" pour éviter les problèmes de timezone
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) {
      return res.status(400).json({
        success: false,
        error: 'Format de date invalide. Format attendu: YYYY-MM-DD'
      });
    }

    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // Les mois commencent à 0 en JavaScript
    const day = parseInt(dateMatch[3], 10);

    // Normaliser la date à minuit (UTC)
    const normalizedDate = new Date(Date.UTC(year, month, day));

    let dailyLoss = await DailyLosses.findOne({
      date: normalizedDate,
      city: city.toLowerCase()
    });

    if (!dailyLoss) {
      // Créer une nouvelle entrée avec des valeurs par défaut
      dailyLoss = new DailyLosses({
        date: normalizedDate,
        month: normalizedDate.getUTCMonth() + 1,
        year: normalizedDate.getUTCFullYear(),
        city: city.toLowerCase(),
        invendus: 0,
        dons: 0,
        caisse1: 0,
        caisse2: 0,
        caisse3: 0,
        caisse4: 0
      });
      await dailyLoss.save();
    }

    res.json({
      success: true,
      data: dailyLoss
    });
  } catch (error) {
    console.error('Erreur lors de la récupération/création des pertes quotidiennes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// Mettre à jour une entrée quotidienne
const updateDailyLosses = async (req, res) => {
  try {
    const { id } = req.params;
    const { invendus, dons, caisse1, caisse2, caisse3, caisse4 } = req.body;

    const dailyLoss = await DailyLosses.findById(id);
    
    if (!dailyLoss) {
      return res.status(404).json({
        success: false,
        error: 'Entrée non trouvée'
      });
    }

    // Mettre à jour les champs
    if (invendus !== undefined) dailyLoss.invendus = parseFloat(invendus) || 0;
    if (dons !== undefined) dailyLoss.dons = parseFloat(dons) || 0;
    if (caisse1 !== undefined) dailyLoss.caisse1 = parseFloat(caisse1) || 0;
    if (caisse2 !== undefined) dailyLoss.caisse2 = parseFloat(caisse2) || 0;
    if (caisse3 !== undefined) dailyLoss.caisse3 = parseFloat(caisse3) || 0;
    if (caisse4 !== undefined) dailyLoss.caisse4 = parseFloat(caisse4) || 0;

    // Le hook pre-save calculera automatiquement les totaux et le pourcentage
    await dailyLoss.save();

    res.json({
      success: true,
      message: 'Données mises à jour avec succès',
      data: dailyLoss
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des pertes quotidiennes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// Récupérer toutes les entrées pour un mois donné
const getMonthlyLosses = async (req, res) => {
  try {
    const { month, year, city = 'longuenesse' } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Le mois et l\'année sont requis'
      });
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        success: false,
        error: 'Mois invalide'
      });
    }

    const dailyLosses = await DailyLosses.find({
      month: parsedMonth,
      year: parsedYear,
      city: city.toLowerCase()
    }).sort({ date: 1 });

    // Calculer les totaux cumulés
    const totalPertes = dailyLosses.reduce((sum, dl) => sum + dl.totalPertes, 0);
    const totalVentes = dailyLosses.reduce((sum, dl) => sum + dl.totalVentes, 0);
    const pourcentageMois = totalVentes > 0 
      ? Math.round((totalPertes / totalVentes) * 100 * 100) / 100 
      : 0;

    res.json({
      success: true,
      data: dailyLosses,
      totals: {
        totalPertes,
        totalVentes,
        pourcentageMois
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des pertes mensuelles:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// Récupérer les statistiques pour le dashboard (jour, semaine, mois)
const getDashboardStats = async (req, res) => {
  try {
    const { city = 'longuenesse' } = req.query;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Jour actuel
    const todayLoss = await DailyLosses.findOne({
      date: today,
      city: city.toLowerCase()
    });

    // Semaine actuelle (lundi à dimanche)
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = jour 1
    currentWeekStart.setUTCDate(today.getUTCDate() + diff);
    currentWeekStart.setUTCHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setUTCDate(currentWeekStart.getUTCDate() + 6);
    currentWeekEnd.setUTCHours(23, 59, 59, 999);

    const weekLosses = await DailyLosses.find({
      date: { $gte: currentWeekStart, $lte: currentWeekEnd },
      city: city.toLowerCase()
    });

    // Mois actuel
    const monthLosses = await DailyLosses.find({
      month: today.getUTCMonth() + 1,
      year: today.getUTCFullYear(),
      city: city.toLowerCase()
    });

    // Calculer les totaux et pourcentages
    const weekTotalPertes = weekLosses.reduce((sum, dl) => sum + dl.totalPertes, 0);
    const weekTotalVentes = weekLosses.reduce((sum, dl) => sum + dl.totalVentes, 0);
    const weekPourcentage = weekTotalVentes > 0 
      ? Math.round((weekTotalPertes / weekTotalVentes) * 100 * 100) / 100 
      : 0;

    const monthTotalPertes = monthLosses.reduce((sum, dl) => sum + dl.totalPertes, 0);
    const monthTotalVentes = monthLosses.reduce((sum, dl) => sum + dl.totalVentes, 0);
    const monthPourcentage = monthTotalVentes > 0 
      ? Math.round((monthTotalPertes / monthTotalVentes) * 100 * 100) / 100 
      : 0;

    // Année actuelle
    const yearLosses = await DailyLosses.find({
      year: today.getUTCFullYear(),
      city: city.toLowerCase()
    });
    const yearTotalPertes = yearLosses.reduce((sum, dl) => sum + dl.totalPertes, 0);
    const yearTotalVentes = yearLosses.reduce((sum, dl) => sum + dl.totalVentes, 0);
    const yearPourcentage = yearTotalVentes > 0 
      ? Math.round((yearTotalPertes / yearTotalVentes) * 100 * 100) / 100 
      : 0;

    res.json({
      success: true,
      data: {
        jour: todayLoss ? {
          totalPertes: todayLoss.totalPertes,
          totalVentes: todayLoss.totalVentes,
          pourcentage: todayLoss.pourcentagePertes
        } : null,
        semaine: {
          totalPertes: weekTotalPertes,
          totalVentes: weekTotalVentes,
          pourcentage: weekPourcentage
        },
        mois: {
          totalPertes: monthTotalPertes,
          totalVentes: monthTotalVentes,
          pourcentage: monthPourcentage
        },
        annee: {
          totalPertes: yearTotalPertes,
          totalVentes: yearTotalVentes,
          pourcentage: yearPourcentage
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

module.exports = {
  getOrCreateDailyLosses,
  updateDailyLosses,
  getMonthlyLosses,
  getDashboardStats
};
