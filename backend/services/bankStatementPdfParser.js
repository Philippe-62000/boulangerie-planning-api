/**
 * Parse un relevé Crédit Agricole (compte Vulpinus) pour extraire
 * les versements Centralis et les prélèvements Promocash Béthune.
 */
const pdfParse = require('pdf-parse');

function normalize(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function parseYearFromText(text, fallbackYear) {
  const arretee = text.match(/Date d['’]arr[êe]t[ée]\s*:\s*\d{1,2}\s+\w+\s+(\d{4})/i);
  if (arretee) return parseInt(arretee[1], 10);
  const yy = text.match(/\b(\d{2})\/(\d{2})\/(\d{2})\b/);
  if (yy) {
    const two = parseInt(yy[3], 10);
    return two >= 70 ? 1900 + two : 2000 + two;
  }
  return fallbackYear;
}

function parseDayMonth(dd, mm) {
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  if (!day || !month || day < 1 || day > 31 || month < 1 || month > 12) return null;
  return { day, month };
}

function fullYearFromTwoDigits(yy) {
  const two = parseInt(yy, 10);
  if (Number.isNaN(two)) return null;
  return two >= 70 ? 1900 + two : 2000 + two;
}

/**
 * Découpe le relevé en blocs d'opérations (chaque bloc commence par DD.MM DD.MM).
 */
function splitOperations(text) {
  const flat = String(text || '').replace(/\r/g, '\n');
  const parts = flat.split(/(?=\d{2}\.\d{2}\s*\d{2}\.\d{2})/);
  return parts.map((p) => p.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function isIgnoredCentralis(location) {
  const n = normalize(location);
  return /deficit|verst|diff\./.test(n);
}

/**
 * Règles métier : Gbru → même ligne que Joffre ; Promocash → boulangerie via Promocash.
 */
const LOCATION_RULES = [
  {
    test: (n) => /\bgbru\b/.test(n),
    hints: ['bethune joffre', 'joffre'],
    label: 'Bethune Joffre'
  },
  {
    test: (n) => /\bjoffre\b/.test(n),
    hints: ['bethune joffre', 'joffre'],
    label: 'Bethune Joffre'
  },
  {
    test: (n) => /\bpromocash\b/.test(n),
    hints: ['promocash'],
    label: 'Boulangerie A via Promocash'
  },
  {
    test: (n) => /\bberck\b/.test(n),
    hints: ['berck'],
    label: 'Berck'
  },
  {
    test: (n) => /\bsaint[\s-]*omer|\bst[\s-]*omer|\bfoc\b/.test(n),
    hints: ['saint omer', 'st omer'],
    label: 'Saint Omer'
  }
];

function resolveLocationRule(locationText) {
  const n = normalize(locationText);
  for (const rule of LOCATION_RULES) {
    if (rule.test(n)) return rule;
  }
  const cleaned = n
    .replace(/\d{2}\/\d{2}\/\d{2}/g, '')
    .replace(/\d{1,2}h\d{2}/g, '')
    .replace(/[0-9.,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return { hints: [cleaned], label: locationText.trim().slice(0, 60) };
}

function extractDateFromBlock(block, fallbackOp) {
  const labeled = block.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (labeled) {
    const parsed = parseDayMonth(labeled[1], labeled[2]);
    const year = fullYearFromTwoDigits(labeled[3]);
    if (parsed && year) return { ...parsed, year, source: 'label' };
  }
  return fallbackOp;
}

function parseOperationHeader(block) {
  const m = block.match(/^(\d{2})\.(\d{2})\s*(\d{2})\.(\d{2})/);
  if (!m) return null;
  const op = parseDayMonth(m[1], m[2]);
  if (!op) return null;
  return { day: op.day, month: op.month };
}

function extractCentralisLocation(block) {
  const m = block.match(/Centralis\s+Niv\s+Recette(?:\s+Arras|\s+Longuenesse)?\s+(.+)$/i);
  if (!m) return '';
  return m[1]
    .replace(/\d{2}\/\d{2}\/\d{2}(?:\s+\d{1,2}[hH]\d{2})?/gi, ' ')
    .replace(/\s+\d{4,}[\s\S]*$/, '')
    .replace(/\s+\d[\d\s.,]*$/g, '')
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {Buffer} buffer
 * @param {number} month
 * @param {number} year
 */
async function parseBankStatementPdf(buffer, month, year) {
  const parsed = await pdfParse(buffer);
  const text = parsed.text || '';
  const docYear = parseYearFromText(text, year);
  const operations = splitOperations(text);
  const events = [];

  for (const block of operations) {
    const header = parseOperationHeader(block);
    if (!header) continue;

    const fallback = { day: header.day, month: header.month, year: docYear, source: 'operation' };
    const dated = extractDateFromBlock(block, fallback);

    if (/Prlv\s+Promocash\s+Bethune/i.test(block)) {
      events.push({
        kind: 'promocash',
        day: dated.day,
        month: dated.month,
        year: dated.year,
        location: 'Promocash Bethune',
        raw: block.slice(0, 180)
      });
      continue;
    }

    if (/Centralis\s+Niv\s+Recette(?:\s+Arras|\s+Longuenesse)?/i.test(block)) {
      const location = extractCentralisLocation(block);
      if (isIgnoredCentralis(location) || isIgnoredCentralis(block)) continue;
      events.push({
        kind: 'centralis',
        day: dated.day,
        month: dated.month,
        year: dated.year,
        location: location || 'Centralis',
        raw: block.slice(0, 180)
      });
    }
  }

  const inMonth = events.filter((e) => e.month === month && e.year === year);
  const otherMonth = events.filter((e) => e.month !== month || e.year !== year);

  return {
    textPreview: text.slice(0, 4000),
    documentYear: docYear,
    events,
    inMonth,
    otherMonth
  };
}

function matchTripType(tripTypes, hints) {
  const normalizedTypes = (tripTypes || []).map((t) => ({
    t,
    n: normalize(`${t.displayName || ''} ${t.name || ''}`)
  }));
  for (const hint of hints) {
    const h = normalize(hint);
    if (!h) continue;
    const found = normalizedTypes.find(({ n }) => n.includes(h) || h.includes(n));
    if (found) return found.t;
  }
  return null;
}

/**
 * Associe les événements extraits aux lignes du tableau frais KM.
 */
function mapEventsToTripTypes(events, tripTypes) {
  const matched = [];
  const unmatched = [];

  for (const ev of events) {
    const rule = ev.kind === 'promocash'
      ? LOCATION_RULES.find((r) => r.label.includes('Promocash'))
      : resolveLocationRule(ev.location);
    if (!rule) {
      unmatched.push({ ...ev, reason: 'Lieu non reconnu' });
      continue;
    }
    const trip = matchTripType(tripTypes, rule.hints);
    if (!trip) {
      unmatched.push({ ...ev, reason: `Ligne introuvable : ${rule.label}` });
      continue;
    }
    matched.push({
      day: ev.day,
      month: ev.month,
      year: ev.year,
      location: ev.location,
      tripTypeId: trip._id.toString(),
      tripDisplayName: trip.displayName,
      ruleLabel: rule.label,
      raw: ev.raw
    });
  }

  return { matched, unmatched };
}

module.exports = {
  parseBankStatementPdf,
  mapEventsToTripTypes,
  resolveLocationRule,
  normalize
};
