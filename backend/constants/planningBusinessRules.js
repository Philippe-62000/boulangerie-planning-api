/**
 * Règles métier magasin (boulangerie) — référence pour le moteur de planning / scoring.
 * Les poids et l’application exacte sont dans le générateur (AG).
 */

const SHOP_HOURS = { open: '06:00', close: '20:30' };

/** Types d’affluence par jour (paramétrage hebdo, ex. page contraintes / génération) */
const AFFLUENCE_TYPES = {
  NORMAL: 'normal',
  VACANCES: 'vacances',
  GROSSE_JOURNEE: 'grosse_journee',
  PETITE_JOURNEE: 'petite_journee'
};

/**
 * Couverture minimale vendeuses (créneaux indicatifs, à respecter par le solveur).
 * 1 vendeuse dès 6h, une autre ouverture plus tard, 3 entre 12h–14h, 2 de 15h30 à 20h30, jamais 0 vendeuse.
 */
const VENDEUSE_COVERAGE_WINDOWS = [
  { label: 'Ouverture tôt', start: '06:00', end: '07:00', minStaff: 1 },
  { label: 'Ouverture élargie', start: '07:00', startAlt: '07:30', end: '12:00', minStaff: 2 },
  { label: 'Midi', start: '12:00', end: '14:00', minStaff: 3 },
  { label: 'Après-midi / fermeture', start: '15:30', end: '20:30', minStaff: 2 }
];

/** Repos : 2 jours / semaine par défaut ; 1 seul si semaine avec absences où 2 repos ne sont pas possibles */
const DEFAULT_REST_DAYS_PER_WEEK = 2;

/** Mineurs : 2 jours de repos dont le dimanche ; majeurs vendeuses : au moins 1 jour de repos */
const MINOR_MAX_WORK_DAYS = 5; // 7 - 2 repos
const MINOR_SUNDAY_REQUIRED_OFF = true;

/** Pause repas standard (non incluse dans le volume contractuel) — minutes */
const DEFAULT_DAILY_BREAK_MINUTES = 30;

module.exports = {
  SHOP_HOURS,
  AFFLUENCE_TYPES,
  VENDEUSE_COVERAGE_WINDOWS,
  DEFAULT_REST_DAYS_PER_WEEK,
  MINOR_MAX_WORK_DAYS,
  MINOR_SUNDAY_REQUIRED_OFF,
  DEFAULT_DAILY_BREAK_MINUTES
};
