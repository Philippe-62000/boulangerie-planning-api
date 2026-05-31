const fs = require('fs');
const path = require('path');
const CamarisTerritoryEvent = require('../models/CamarisTerritoryEvent');

const DATA_DIR = path.join(__dirname, '../data');

let didYouKnowCache = null;
let ephemeridesCache = null;
let territoryCache = null;
let pauseGourmandeCache = null;
let pauseGourmandeDimancheCache = null;
let sportCache = null;

const loadJson = (filename) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
  } catch {
    return null;
  }
};

const FRENCH_DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const FRENCH_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
];

/** 1 = lundi … 7 = dimanche */
const jsDayToFrench = (jsDay) => (jsDay === 0 ? 7 : jsDay);

const getIsoWeekKey = (d = new Date()) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = date.getDay() || 7;
  date.setDate(date.getDate() + 4 - dayNum);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const getWeekMonday = (d = new Date()) => {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatFrenchDate = (d = new Date()) => {
  const weekday = FRENCH_DAYS[d.getDay()];
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalized} ${d.getDate()} ${FRENCH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatEphemeridePhrase = (raw) => {
  const t = String(raw || '').trim();
  if (!t) return null;
  if (/^aujourd['']hui/i.test(t) || /^nous fêtons/i.test(t)) return t;
  const label = /^[A-Za-zÀ-ÿ]/.test(t) && !/^le |^la |^l['']|^les /i.test(t) ? t : t;
  return `Aujourd'hui, nous fêtons ${label}`;
};

const getEphemeride = (d = new Date()) => {
  if (!ephemeridesCache) ephemeridesCache = loadJson('camaris-ephemerides.json') || {};
  const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const raw = ephemeridesCache[key];
  return raw ? formatEphemeridePhrase(raw) : null;
};

/** Audomarois → régional (Pas-de-Calais / local) → national (France). */
const TERRITORY_SCOPE_CASCADE = ['audomarois', 'pas-de-calais', 'local', 'france'];

const pickTerritoryHit = (hits) => {
  if (!hits.length) return null;
  for (const scope of TERRITORY_SCOPE_CASCADE) {
    const hit = hits.find((e) => e.scope === scope);
    if (hit) {
      return {
        type: 'territory',
        scope: hit.scope,
        title: hit.title,
        text: hit.text
      };
    }
  }
  return null;
};

const getTerritoryHighlightFromJson = (d = new Date()) => {
  if (!territoryCache) territoryCache = loadJson('camaris-territory-events.json') || [];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hits = territoryCache.filter((e) => e.month === m && e.day === day);
  return pickTerritoryHit(hits);
};

const getTerritoryHighlightAsync = async (d = new Date(), siteKey = 'lon') => {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = d.getFullYear();
  try {
    const dbHits = await CamarisTerritoryEvent.find({
      siteKey,
      isActive: true,
      month: m,
      day,
      $or: [{ year: null }, { year: y }]
    }).lean();
    const fromDb = pickTerritoryHit(dbHits);
    if (fromDb) return fromDb;
  } catch (e) {
    console.warn('getTerritoryHighlightAsync:', e.message);
  }
  return getTerritoryHighlightFromJson(d);
};

const getPauseGourmandeBody = (d = new Date()) => {
  const isSunday = d.getDay() === 0;
  if (isSunday) {
    if (!pauseGourmandeDimancheCache) {
      pauseGourmandeDimancheCache = loadJson('camaris-pause-gourmande-dimanche.json') || [];
    }
    const sundayList = pauseGourmandeDimancheCache.length
      ? pauseGourmandeDimancheCache
      : ['Pause gourmande Camaris : viennoiseries et pâtisseries préparées chaque matin par nos artisans.'];
    const idx = (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % sundayList.length;
    return sundayList[idx];
  }
  if (!pauseGourmandeCache) pauseGourmandeCache = loadJson('camaris-pause-gourmande.json') || [];
  const list = pauseGourmandeCache.length
    ? pauseGourmandeCache
    : ['Passez nous voir pour une pause gourmande : viennoiseries et pâtisseries maison.'];
  const idx = (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % list.length;
  return list[idx];
};

const getDidYouKnow = (d = new Date()) => {
  if (!didYouKnowCache) didYouKnowCache = loadJson('camaris-did-you-know.json') || [];
  if (!didYouKnowCache.length) {
    return { type: 'didYouKnow', title: 'Le savez-vous ?', text: 'Nos artisans préparent vos produits chaque matin.' };
  }
  const idx = (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % didYouKnowCache.length;
  return {
    type: 'didYouKnow',
    title: 'Le savez-vous ?',
    text: didYouKnowCache[idx]
  };
};

const getInfoBanner = async (d = new Date(), siteKey = 'lon') => {
  const territory = await getTerritoryHighlightAsync(d, siteKey);
  if (territory) return territory;
  return getDidYouKnow(d);
};

const AUTO_SUGGESTIONS = [
  {
    title: 'Pause gourmande',
    kind: 'pauseGourmande'
  },
  {
    title: 'Artisanat local',
    body: 'Nos boulangers sélectionnent des farines françaises et travaillent les pâtes sur place, chaque matin.'
  },
  {
    title: 'Idée du jour',
    body: 'Associez une baguette tradition encore tiède à un fromage des Flandres : un classique de la région.'
  },
  {
    title: 'Spécialité Camaris',
    body: 'Demandez nos conseils du jour : une animation surprise vous attend peut-être en boutique cette semaine.'
  }
];

const getAutoAnimation = (d = new Date()) => {
  const idx = (d.getFullYear() * 7 + jsDayToFrench(d.getDay())) % AUTO_SUGGESTIONS.length;
  const pick = AUTO_SUGGESTIONS[idx];
  const body = pick.kind === 'pauseGourmande' ? getPauseGourmandeBody(d) : pick.body || '';
  return {
    source: 'auto',
    title: pick.title,
    body,
    daysOfWeek: [jsDayToFrench(d.getDay())]
  };
};

const getNextIsoWeekKey = (d = new Date()) => {
  const monday = getWeekMonday(d);
  monday.setDate(monday.getDate() + 7);
  return getIsoWeekKey(monday);
};

const getSportHighlight = (d = new Date()) => {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = d.getFullYear();

  if (!sportCache) sportCache = loadJson('camaris-sport.json') || [];
  const dated = sportCache
    .filter((e) => e.month === m && e.day === day && (e.year == null || e.year === y || e.year === 0))
    .sort((a, b) => {
      const aYear = a.year === y ? 1 : 0;
      const bYear = b.year === y ? 1 : 0;
      if (bYear !== aYear) return bYear - aYear;
      return (b.priority || 0) - (a.priority || 0);
    });
  if (dated.length) {
    const audo = dated.find((e) => e.scope === 'audomarois');
    const regional = dated.find((e) => e.scope === 'pas-de-calais' || e.scope === 'local');
    const pick = audo || regional || dated.find((e) => e.scope === 'france') || dated[0];
    return { text: pick.text };
  }

  if ((m === 5 && day >= 18 && day <= 25) || (m === 6 && day === 9)) {
    const rgFallback = [
      'Tennis : Roland-Garros — suivez les matchs du jour et les Français encore en lice.',
      'Tennis : Roland-Garros — tableaux hommes et dames, ambiance Porte d’Auteuil.',
      'Tennis : Roland-Garros — terre battue parisienne, repérez les temps forts du jour.'
    ];
    const idx = (y * 366 + m * 31 + day) % rgFallback.length;
    return { text: rgFallback[idx] };
  }
  if (m === 6 && y === 2026 && day >= 11 && day <= 19) {
    return { text: 'Football : Coupe du monde 2026 — phase de groupes, matchs à ne pas manquer.' };
  }
  if (m === 6 && (day === 14 || day === 15 || day === 18)) {
    return { text: 'Football : Euro / sélections — soirées de matchs internationaux.' };
  }
  if (m === 7 && day >= 1 && day <= 27) {
    return { text: `Cyclisme : Tour de France ${y} — repérez l’étape du jour et les temps forts.` };
  }
  if (y % 4 === 0 && m === 7 && day >= 24 && day <= 31) {
    return { text: 'Jeux olympiques d’été : médailles et finales à suivre pour le sport français.' };
  }
  if (y % 4 === 0 && m === 8 && day <= 11) {
    return { text: 'Jeux olympiques : dernières finales et cérémonie de clôture à ne pas rater.' };
  }

  return null;
};

const formatBodyHtml = (raw) => {
  const text = String(raw || '').trim();
  if (!text) return '';
  const escape = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const inner = escape(para.trim())
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');
      return `<p>${inner}</p>`;
    })
    .join('');
};

const formatDayDateFr = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const buildWeekDays = (d = new Date()) => {
  const monday = getWeekMonday(d);
  const todayFrench = jsDayToFrench(d.getDay());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      dayOfWeek: i + 1,
      label: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
      dateISO: formatDayDateFr(date),
      isToday: i + 1 === todayFrench
    });
  }
  return days;
};

const pickAnimationForDay = (animations, frenchDay, weekKey) => {
  const day = Number(frenchDay);
  const list = (animations || []).filter((a) => {
    if (a.isActive === false || a.weekKey !== weekKey) return false;
    const days = (a.daysOfWeek || []).map((x) => Number(x));
    return days.includes(day);
  });
  if (!list.length) return null;
  list.sort((a, b) => {
    const lenA = (a.daysOfWeek || []).length;
    const lenB = (b.daysOfWeek || []).length;
    if (lenA !== lenB) return lenA - lenB;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  return list[0];
};

/** Toutes les animations actives pour un jour (semaine entière + jour ciblé, etc.). */
const pickAllAnimationsForDay = (animations, frenchDay, weekKey) => {
  const day = Number(frenchDay);
  const list = (animations || []).filter((a) => {
    if (a.isActive === false || a.weekKey !== weekKey) return false;
    const days = (a.daysOfWeek || []).map((x) => Number(x));
    return days.includes(day);
  });
  list.sort((a, b) => {
    const lenA = (a.daysOfWeek || []).length;
    const lenB = (b.daysOfWeek || []).length;
    if (lenA !== lenB) return lenA - lenB;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  return list;
};

module.exports = {
  jsDayToFrench,
  getIsoWeekKey,
  getNextIsoWeekKey,
  getWeekMonday,
  formatFrenchDate,
  getEphemeride,
  getTerritoryHighlightAsync,
  getInfoBanner,
  getAutoAnimation,
  getPauseGourmandeBody,
  getSportHighlight,
  formatBodyHtml,
  buildWeekDays,
  pickAnimationForDay,
  pickAllAnimationsForDay
};
