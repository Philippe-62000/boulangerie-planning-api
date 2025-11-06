const DailySales = require('../models/DailySales');
const Employee = require('../models/Employee');
const Parameter = require('../models/Parameters');

// Enregistrer une saisie quotidienne
exports.submitDailySales = async (req, res) => {
  try {
    const { saleCode, nbPromo, nbCartesFid } = req.body;
    
    if (!saleCode || nbPromo === undefined || nbCartesFid === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }
    
    // Trouver l'employé avec ce code
    const employee = await Employee.findOne({ saleCode, isActive: true });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Code vendeuse non trouvé ou inactif'
      });
    }
    
    // Vérifier que le rôle est concerné
    const rolesAvecCode = ['vendeuse', 'apprenti', 'manager', 'responsable'];
    if (!rolesAvecCode.includes(employee.role)) {
      return res.status(403).json({
        success: false,
        message: 'Ce code ne correspond pas à une vendeuse'
      });
    }
    
    // Obtenir la date du jour (UTC, puis conversion locale)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Vérifier si une saisie existe déjà pour ce jour
    const existingSale = await DailySales.findOne({
      saleCode,
      date: {
        $gte: new Date(today),
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (existingSale) {
      // Mettre à jour la saisie existante
      existingSale.nbPromo = parseInt(nbPromo) || 0;
      existingSale.nbCartesFid = parseInt(nbCartesFid) || 0;
      await existingSale.save();
      
      return res.json({
        success: true,
        message: 'Saisie mise à jour avec succès',
        data: existingSale
      });
    }
    
    // Créer une nouvelle saisie
    const dailySale = new DailySales({
      saleCode,
      employeeId: employee._id,
      date: today,
      nbPromo: parseInt(nbPromo) || 0,
      nbCartesFid: parseInt(nbCartesFid) || 0
    });
    
    await dailySale.save();
    
    res.json({
      success: true,
      message: 'Saisie enregistrée avec succès',
      data: dailySale
    });
    
  } catch (error) {
    console.error('❌ Erreur saisie quotidienne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement',
      error: error.message
    });
  }
};

// Obtenir les stats hebdomadaires
exports.getWeeklyStats = async (req, res) => {
  try {
    const { weekStart } = req.query; // Date de début de semaine (format YYYY-MM-DD)
    
    let startDate;
    if (weekStart) {
      startDate = new Date(weekStart);
    } else {
      // Par défaut, début de la semaine actuelle (lundi)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = 1
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diff);
    }
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    // Récupérer toutes les ventes de la semaine
    const weeklySales = await DailySales.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('employeeId', 'name role saleCode');
    
    // Calculer les totaux par objectif
    let totalPromo = 0;
    let totalCartesFid = 0;
    
    weeklySales.forEach(sale => {
      totalPromo += sale.nbPromo || 0;
      totalCartesFid += sale.nbCartesFid || 0;
    });
    
    // Récupérer les objectifs hebdomadaires depuis les paramètres
    const objectifPromoParam = await Parameter.findOne({ name: 'objectifHebdoPromo' });
    const objectifCartesFidParam = await Parameter.findOne({ name: 'objectifHebdoCartesFid' });
    
    const objectifPromo = objectifPromoParam?.kmValue || 0;
    const objectifCartesFid = objectifCartesFidParam?.kmValue || 0;
    
    // Calculer les pourcentages
    const pourcentagePromo = objectifPromo > 0 ? (totalPromo / objectifPromo) * 100 : 0;
    const pourcentageCartesFid = objectifCartesFid > 0 ? (totalCartesFid / objectifCartesFid) * 100 : 0;
    
    // Récupérer les marges depuis les paramètres
    const margeVert = await Parameter.findOne({ name: 'margeVert' });
    const margeJaune = await Parameter.findOne({ name: 'margeJaune' });
    const margeOrange = await Parameter.findOne({ name: 'margeOrange' });
    
    const seuilVert = margeVert?.kmValue || 100;
    const seuilJaune = margeJaune?.kmValue || 80;
    const seuilOrange = margeOrange?.kmValue || 50;
    
    // Déterminer les couleurs
    const getColor = (pourcentage) => {
      if (pourcentage >= seuilVert) return 'green';
      if (pourcentage >= seuilJaune) return 'yellow';
      if (pourcentage >= seuilOrange) return 'orange';
      return 'red';
    };
    
    res.json({
      success: true,
      data: {
        weekStart: startDate,
        weekEnd: endDate,
        totalPromo,
        totalCartesFid,
        objectifPromo,
        objectifCartesFid,
        pourcentagePromo,
        pourcentageCartesFid,
        colorPromo: getColor(pourcentagePromo),
        colorCartesFid: getColor(pourcentageCartesFid),
        dailySales: weeklySales
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération stats hebdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// Obtenir les objectifs hebdomadaires
exports.getWeeklyObjectives = async (req, res) => {
  try {
    const objectifPromoParam = await Parameter.findOne({ name: 'objectifHebdoPromo' });
    const objectifCartesFidParam = await Parameter.findOne({ name: 'objectifHebdoCartesFid' });
    const presencesParam = await Parameter.findOne({ name: 'presencesHebdo' });

    let presences = {};
    if (presencesParam?.stringValue) {
      try {
        const parsed = JSON.parse(presencesParam.stringValue);
        if (parsed && typeof parsed === 'object') {
          presences = parsed;
        }
      } catch (parseError) {
        console.warn('⚠️ Impossible de parser presencesHebdo:', parseError.message);
      }
    }
    
    res.json({
      success: true,
      data: {
        objectifPromo: objectifPromoParam?.kmValue || 0,
        objectifCartesFid: objectifCartesFidParam?.kmValue || 0,
        presences
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération objectifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

// Enregistrer les objectifs hebdomadaires
exports.setWeeklyObjectives = async (req, res) => {
  try {
    const { objectifPromo, objectifCartesFid, presences } = req.body;
    
    // Enregistrer les objectifs dans les paramètres
    if (objectifPromo !== undefined) {
      await Parameter.findOneAndUpdate(
        { name: 'objectifHebdoPromo' },
        { kmValue: parseFloat(objectifPromo) || 0 },
        { upsert: true, new: true }
      );
    }
    
    if (objectifCartesFid !== undefined) {
      await Parameter.findOneAndUpdate(
        { name: 'objectifHebdoCartesFid' },
        { kmValue: parseFloat(objectifCartesFid) || 0 },
        { upsert: true, new: true }
      );
    }
    
    // Enregistrer les présences (optionnel, peut être géré côté frontend)
    if (presences) {
      await Parameter.findOneAndUpdate(
        { name: 'presencesHebdo' },
        { stringValue: JSON.stringify(presences) },
        { upsert: true, new: true }
      );
    }
    
    res.json({
      success: true,
      message: 'Objectifs hebdomadaires enregistrés'
    });
    
  } catch (error) {
    console.error('❌ Erreur enregistrement objectifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement',
      error: error.message
    });
  }
};




