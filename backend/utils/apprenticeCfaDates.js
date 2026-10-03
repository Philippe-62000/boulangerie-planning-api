const ApprenticePlanning = require('../models/ApprenticePlanning');

/** Jours du calendrier où l'apprenti n'est pas en magasin. */
const AWAY_KINDS = new Set(['cfa', 'examen']);

function siteKeyFromEnv() {
  const appBasePath = process.env.APP_BASE_PATH;
  if (appBasePath === '/lon') return 'lon';
  const corsOrigin = process.env.CORS_ORIGIN || '';
  return corsOrigin.includes('/lon') ? 'lon' : 'plan';
}

/**
 * Dates ISO (YYYY-MM-DD) de formation hors magasin, par salarié,
 * d'après le calendrier apprenti (pas les cases « tous les mardis »).
 */
async function cfaDatesByEmployee(dates, siteKey = siteKeyFromEnv()) {
  const dateSet = new Set((dates || []).map((item) => item.date).filter(Boolean));
  const plannings = await ApprenticePlanning.find(
    siteKey ? { $or: [{ siteKey }, { siteKey: { $exists: false } }] } : {}
  ).lean();
  const map = new Map();
  plannings.forEach((planning) => {
    const cfaDates = new Set();
    if (Array.isArray(planning.trainingEntries) && planning.trainingEntries.length) {
      planning.trainingEntries.forEach((entry) => {
        if (AWAY_KINDS.has(entry.kind) && dateSet.has(entry.date)) cfaDates.add(entry.date);
      });
    } else {
      (planning.trainingDates || []).forEach((date) => {
        if (dateSet.has(date)) cfaDates.add(date);
      });
    }
    if (cfaDates.size) map.set(String(planning.employeeId), cfaDates);
  });
  return map;
}

function weekFormationForEmployee(cfaMap, employeeId, dates) {
  const set = cfaMap.get(String(employeeId));
  const formationDayIndexes = [];
  const trainingDays = [];
  (dates || []).forEach((meta, index) => {
    if (set && meta?.date && set.has(meta.date)) {
      formationDayIndexes.push(index);
      if (meta.day) trainingDays.push(meta.day);
    }
  });
  return { formationDayIndexes, trainingDays };
}

module.exports = {
  AWAY_KINDS,
  siteKeyFromEnv,
  cfaDatesByEmployee,
  weekFormationForEmployee
};
