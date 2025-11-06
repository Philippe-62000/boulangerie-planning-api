const DailySales = require('../models/DailySales');
const Employee = require('../models/Employee');
const Parameter = require('../models/Parameters');

const getWeekStartDate = (inputDate = new Date()) => {
  const reference = inputDate instanceof Date ? new Date(inputDate) : new Date(inputDate);
  if (Number.isNaN(reference.getTime())) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  reference.setHours(0, 0, 0, 0);
  const day = reference.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  reference.setDate(reference.getDate() + diff);
  reference.setHours(0, 0, 0, 0);
  return reference;
};

const getWeekKey = (date = new Date()) => {
  const start = getWeekStartDate(date);
  return start.toISOString().split('T')[0];
};

const parseWeeklyObjectives = (rawString) => {
  if (!rawString || typeof rawString !== 'string') {
    return {};
  }
  try {
    const parsed = JSON.parse(rawString);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.warn('⚠️ Impossible de parser weeklyObjectives:', error.message);
  }
  return {};
};

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
    
    const startDate = weekStart ? getWeekStartDate(weekStart) : getWeekStartDate();
    const weekKey = getWeekKey(startDate);
    
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
    const weeklyObjectivesParam = await Parameter.findOne({ name: 'weeklyObjectives' });
    const weeklyObjectives = parseWeeklyObjectives(weeklyObjectivesParam?.stringValue);
    const objectiveEntry = weeklyObjectives[weekKey];
    
    const objectifPromoRaw = objectifPromoParam?.kmValue || 0;
    const objectifCartesFidRaw = objectifCartesFidParam?.kmValue || 0;
    
    const objectifPromo = objectiveEntry?.adjustedPromo ?? objectifPromoRaw;
    const objectifCartesFid = objectiveEntry?.adjustedCartesFid ?? objectifCartesFidRaw;
    const perPresencePromo = objectiveEntry?.perPresencePromo ?? 0;
    const perPresenceCartesFid = objectiveEntry?.perPresenceCartesFid ?? 0;
    const totalPresences = objectiveEntry?.totalPresences ?? 0;
    const objectivePromoRawValue = objectiveEntry?.objectifPromo ?? objectifPromoRaw;
    const objectiveCartesFidRawValue = objectiveEntry?.objectifCartesFid ?? objectifCartesFidRaw;
    
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
        perPresencePromo,
        perPresenceCartesFid,
        totalPresences,
        rawObjectivePromo: objectivePromoRawValue,
        rawObjectiveCartesFid: objectiveCartesFidRawValue,
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
    const { weekStart } = req.query;
    const startDate = weekStart ? getWeekStartDate(weekStart) : getWeekStartDate();
    const weekKey = getWeekKey(startDate);

    const objectifPromoParam = await Parameter.findOne({ name: 'objectifHebdoPromo' });
    const objectifCartesFidParam = await Parameter.findOne({ name: 'objectifHebdoCartesFid' });
    const weeklyObjectivesParam = await Parameter.findOne({ name: 'weeklyObjectives' });

    const weeklyObjectives = parseWeeklyObjectives(weeklyObjectivesParam?.stringValue);
    const entry = weeklyObjectives[weekKey] || {};

    const objectifPromoValue = entry.objectifPromo ?? objectifPromoParam?.kmValue ?? 0;
    const objectifCartesFidValue = entry.objectifCartesFid ?? objectifCartesFidParam?.kmValue ?? 0;
    const presences = entry.presences || {};
    const perPresencePromo = entry.perPresencePromo ?? 0;
    const perPresenceCartesFid = entry.perPresenceCartesFid ?? 0;
    const totalPresences = entry.totalPresences ?? 0;

    res.json({
      success: true,
      data: {
        weekStart: startDate,
        weekKey,
        objectifPromo: objectifPromoValue,
        objectifCartesFid: objectifCartesFidValue,
        presences,
        perPresencePromo,
        perPresenceCartesFid,
        totalPresences
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
    const { objectifPromo, objectifCartesFid, presences, weekStart } = req.body;
    
    const rawPromo = parseFloat(objectifPromo) || 0;
    const rawCartesFid = parseFloat(objectifCartesFid) || 0;
    const startDate = getWeekStartDate(weekStart);
    const weekKey = getWeekKey(startDate);

    const presencesData = presences && typeof presences === 'object' ? presences : {};
    let totalPresences = 0;
    Object.values(presencesData).forEach((employeePresences) => {
      if (employeePresences && typeof employeePresences === 'object') {
        totalPresences += Object.values(employeePresences).filter(Boolean).length;
      }
    });

    const perPresencePromo = totalPresences > 0 ? Math.ceil(rawPromo / totalPresences) : 0;
    const perPresenceCartesFid = totalPresences > 0 ? Math.ceil(rawCartesFid / totalPresences) : 0;

    const adjustedPromo = totalPresences > 0 ? perPresencePromo * totalPresences : rawPromo;
    const adjustedCartesFid = totalPresences > 0 ? perPresenceCartesFid * totalPresences : rawCartesFid;

    // Enregistrer les objectifs ajustés dans les paramètres historiques
    await Parameter.findOneAndUpdate(
      { name: 'objectifHebdoPromo' },
      { kmValue: adjustedPromo },
      { upsert: true, new: true }
    );

    await Parameter.findOneAndUpdate(
      { name: 'objectifHebdoCartesFid' },
      { kmValue: adjustedCartesFid },
      { upsert: true, new: true }
    );

    // Sauvegarder toutes les informations détaillées dans un paramètre dédié
    const weeklyObjectivesParam = await Parameter.findOne({ name: 'weeklyObjectives' });
    const weeklyObjectives = parseWeeklyObjectives(weeklyObjectivesParam?.stringValue);

    weeklyObjectives[weekKey] = {
      objectifPromo: rawPromo,
      objectifCartesFid: rawCartesFid,
      adjustedPromo,
      adjustedCartesFid,
      perPresencePromo,
      perPresenceCartesFid,
      totalPresences,
      presences: presencesData
    };

    await Parameter.findOneAndUpdate(
      { name: 'weeklyObjectives' },
      { stringValue: JSON.stringify(weeklyObjectives) },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'Objectifs hebdomadaires enregistrés',
      data: {
        weekKey,
        adjustedPromo,
        adjustedCartesFid,
        perPresencePromo,
        perPresenceCartesFid,
        totalPresences
      }
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




