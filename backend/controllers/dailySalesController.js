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

const getISOWeekNumber = (date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
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
    const rolesAvecCode = ['vendeuse', 'apprenti', 'manager', 'responsable', 'responsable magasin', 'responsable magasin adjointe'];
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
    const totalPresences = entry.totalPresences ?? 0;
    const perPresencePromoRaw = entry.perPresencePromoRaw ?? (totalPresences > 0 ? objectifPromoValue / Math.max(totalPresences, 1) : 0);
    const perPresenceCartesFidRaw = entry.perPresenceCartesFidRaw ?? (totalPresences > 0 ? objectifCartesFidValue / Math.max(totalPresences, 1) : 0);
    const perPresencePromo = entry.perPresencePromo ?? (perPresencePromoRaw > 0 ? Math.ceil(perPresencePromoRaw) : 0);
    const perPresenceCartesFid = entry.perPresenceCartesFid ?? (perPresenceCartesFidRaw > 0 ? Math.ceil(perPresenceCartesFidRaw) : 0);

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
        perPresencePromoRaw,
        perPresenceCartesFidRaw,
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

    // Répartition plus précise : conserver l'objectif brut et arrondir à 2 décimales par présence
    const computePerPresenceRaw = (rawValue) => {
      if (totalPresences <= 0) return 0;
      return rawValue / totalPresences;
    };

    const perPresencePromoRaw = computePerPresenceRaw(rawPromo);
    const perPresenceCartesFidRaw = computePerPresenceRaw(rawCartesFid);

    const perPresencePromoRounded = perPresencePromoRaw > 0 ? Math.ceil(perPresencePromoRaw) : 0;
    const perPresenceCartesFidRounded = perPresenceCartesFidRaw > 0 ? Math.ceil(perPresenceCartesFidRaw) : 0;

    const adjustedPromo = totalPresences > 0 ? rawPromo : 0;
    const adjustedCartesFid = totalPresences > 0 ? rawCartesFid : 0;

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
      perPresencePromo: perPresencePromoRounded,
      perPresenceCartesFid: perPresenceCartesFidRounded,
      perPresencePromoRaw,
      perPresenceCartesFidRaw,
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
        perPresencePromo: perPresencePromoRounded,
        perPresenceCartesFid: perPresenceCartesFidRounded,
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

// Obtenir les informations hebdomadaires pour une vendeuse donnée
exports.getEmployeeInfoForDailySales = async (req, res) => {
  try {
    const { saleCode } = req.params;
    const { weekStart } = req.query;

    if (!saleCode) {
      return res.status(400).json({
        success: false,
        message: 'Code vendeuse requis'
      });
    }

    const employee = await Employee.findOne({ saleCode, isActive: true })
      .select('name role saleCode');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Vendeuse non trouvée ou inactive'
      });
    }

    const startDate = weekStart ? getWeekStartDate(weekStart) : getWeekStartDate();
    const weekKey = getWeekKey(startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const objectifPromoParam = await Parameter.findOne({ name: 'objectifHebdoPromo' });
    const objectifCartesFidParam = await Parameter.findOne({ name: 'objectifHebdoCartesFid' });
    const weeklyObjectivesParam = await Parameter.findOne({ name: 'weeklyObjectives' });

    const weeklyObjectives = parseWeeklyObjectives(weeklyObjectivesParam?.stringValue);
    const entry = weeklyObjectives[weekKey] || {};
    const presences = entry.presences || {};
    const employeeId = employee._id.toString();
    const employeePresence = presences[employeeId] || {};
    const presenceCount = Object.values(employeePresence).filter(Boolean).length;

    const rawPromo = entry.objectifPromo ?? objectifPromoParam?.kmValue ?? 0;
    const rawCartesFid = entry.objectifCartesFid ?? objectifCartesFidParam?.kmValue ?? 0;
    const totalPresences = entry.totalPresences ?? 0;

    const computePerPresenceRaw = (value) => {
      if (totalPresences <= 0) return 0;
      return value / totalPresences;
    };

    const perPresencePromoRaw = entry.perPresencePromoRaw ?? computePerPresenceRaw(rawPromo);
    const perPresenceCartesFidRaw = entry.perPresenceCartesFidRaw ?? computePerPresenceRaw(rawCartesFid);

    const perPresencePromoRounded = perPresencePromoRaw > 0 ? Math.ceil(perPresencePromoRaw) : 0;
    const perPresenceCartesFidRounded = perPresenceCartesFidRaw > 0 ? Math.ceil(perPresenceCartesFidRaw) : 0;

    const adjustedPromo = entry.adjustedPromo ?? (totalPresences > 0 ? rawPromo : 0);
    const adjustedCartesFid = entry.adjustedCartesFid ?? (totalPresences > 0 ? rawCartesFid : 0);

    const employeePromoObjectiveRaw = presenceCount > 0 ? perPresencePromoRaw * presenceCount : 0;
    const employeeCartesObjectiveRaw = presenceCount > 0 ? perPresenceCartesFidRaw * presenceCount : 0;

    const employeePromoObjective = employeePromoObjectiveRaw > 0 ? Math.ceil(employeePromoObjectiveRaw) : 0;
    const employeeCartesObjective = employeeCartesObjectiveRaw > 0 ? Math.ceil(employeeCartesObjectiveRaw) : 0;

    const employeeWeeklySales = await DailySales.find({
      saleCode,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const employeeActualTotals = employeeWeeklySales.reduce(
      (acc, sale) => {
        acc.cartes += sale.nbCartesFid || 0;
        acc.promo += sale.nbPromo || 0;
        return acc;
      },
      { cartes: 0, promo: 0 }
    );

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          role: employee.role,
          saleCode: employee.saleCode
        },
        week: {
          key: weekKey,
          start: startDate,
          end: endDate,
          number: getISOWeekNumber(startDate)
        },
      objectives: {
        totals: {
          promo: adjustedPromo,
          cartesFid: adjustedCartesFid,
          rawPromo,
          rawCartesFid,
          totalPresences
        },
        perPresence: {
          promo: perPresencePromoRounded,
          cartesFid: perPresenceCartesFidRounded,
          rawPromo: perPresencePromoRaw,
          rawCartesFid: perPresenceCartesFidRaw
        },
        employee: {
          presenceCount,
          promo: employeePromoObjective,
          cartesFid: employeeCartesObjective,
          rawPromo: employeePromoObjectiveRaw,
          rawCartesFid: employeeCartesObjectiveRaw,
          actualPromo: employeeActualTotals.promo,
          actualCartes: employeeActualTotals.cartes
        }
      }
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération informations vendeuse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations',
      error: error.message
    });
  }
};




