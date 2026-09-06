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
 * Foch avant le Saint-Omer générique pour éviter CA / Laverie Saint Omer.
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
    label: 'Boulangerie via Promocash'
  },
  {
    test: (n) => /\bberck\b/.test(n),
    hints: ['berck'],
    label: 'Berck'
  },
  {
    test: (n) => /\bfoc(h)?\b/.test(n) || /saint[\s-]*omer[\s-]*foch/.test(n),
    hints: ['saint omer foch', 'st omer foch', 'foch'],
    label: 'Saint Omer Foch'
  },
  {
    test: (n) => /\bsaint[\s-]*omer|\bst[\s-]*omer/.test(n),
    hints: ['saint omer foch', 'saint omer', 'st omer'],
    label: 'Saint Omer'
  }
];

/** Paiements carte entreprise : destinations connues (km + libellé commentaire). */
const CARD_DESTINATIONS = [
  {
    test: (n) => /\bboulanger\b/.test(n),
    km: 8,
    commentName: 'boulanger'
  },
  {
    test: (n) => /\bintermarche\b/.test(n),
    km: 8,
    commentName: 'intermarche'
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

function extractVersementLocation(block) {
  const m = block.match(/Versement\s+(.+)$/i);
  if (!m) return '';
  return m[1]
    .replace(/\d{2}\/\d{2}\/\d{2}\s*\d{1,2}[hH]\d{2}/gi, ' ')
    .replace(/\d{2}\/\d{2}\/\d{2}/gi, ' ')
    .replace(/\d{1,2}[hH]\d{2}/gi, ' ')
    .replace(/\s+\d[\d\s.,]*$/g, '')
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCardMerchant(block) {
  const m = block.match(/Carte\s+X\d+\s+(.+)$/i);
  if (!m) return '';
  return m[1]
    .replace(/\d{2}\/\d{2}(?:\/\d{2})?.*/g, ' ')
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCardPurchaseDate(block, fallback, docYear) {
  const matches = [...String(block || '').matchAll(/(\d{2})\/(\d{2})(?:\/(\d{2}))?/g)];
  if (!matches.length) return fallback;
  const last = matches[matches.length - 1];
  const parsed = parseDayMonth(last[1], last[2]);
  if (!parsed) return fallback;
  const year = last[3] ? fullYearFromTwoDigits(last[3]) : (fallback?.year || docYear);
  return { day: parsed.day, month: parsed.month, year, source: 'card' };
}

function commentForCard(merchant, day, month, known) {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const name = known?.commentName || normalize(merchant).split(' ')[0] || 'carte';
  return `${name} le ${dd}/${mm}`;
}

function resolveCardDestination(merchant) {
  const n = normalize(merchant);
  return CARD_DESTINATIONS.find((rule) => rule.test(n)) || null;
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
      continue;
    }

    if (/Versement\s+/i.test(block) && !/Rejet/i.test(block)) {
      const location = extractVersementLocation(block);
      if (!location || isIgnoredCentralis(location)) continue;
      events.push({
        kind: 'versement',
        day: dated.day,
        month: dated.month,
        year: dated.year,
        location,
        raw: block.slice(0, 180)
      });
      continue;
    }

    if (/Carte\s+X\d+/i.test(block) && !/Remise\s+Carte/i.test(block)) {
      const merchant = extractCardMerchant(block);
      if (!merchant) continue;
      const cardDated = extractCardPurchaseDate(block, dated, docYear);
      const known = resolveCardDestination(merchant);
      events.push({
        kind: 'card',
        day: cardDated.day,
        month: cardDated.month,
        year: cardDated.year,
        location: merchant,
        merchant,
        km: known ? known.km : null,
        comment: commentForCard(merchant, cardDated.day, cardDated.month, known),
        suggested: Boolean(known),
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
  const sortedHints = [...(hints || [])].sort((a, b) => normalize(b).length - normalize(a).length);
  for (const hint of sortedHints) {
    const h = normalize(hint);
    if (!h) continue;
    const exact = normalizedTypes.find(({ n }) => n === h || n.split(' ').join(' ') === h);
    if (exact) return exact.t;
    const found = normalizedTypes.find(({ n }) => n.includes(h));
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
  const cards = [];

  for (const ev of events) {
    if (ev.kind === 'card') {
      cards.push({
        day: ev.day,
        month: ev.month,
        year: ev.year,
        location: ev.location,
        merchant: ev.merchant,
        km: ev.km,
        comment: ev.comment,
        suggested: Boolean(ev.suggested),
        raw: ev.raw
      });
      continue;
    }
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

  return { matched, unmatched, cards };
}

module.exports = {
  parseBankStatementPdf,
  mapEventsToTripTypes,
  resolveLocationRule,
  normalize
};
