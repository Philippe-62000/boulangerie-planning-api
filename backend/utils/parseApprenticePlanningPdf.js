/**
 * Extraction des jours de formation depuis les PDF de calendrier CFA.
 * - Format In Situ Learning / MEM : marqueur « 7 » à gauche du numéro du jour
 * - Autres formats (Altern'Emploi, etc.) : pas d'extraction fiable → tableau vide
 * pdfjs est chargé à la demande pour ne pas faire planter le démarrage API
 * si le module est absent du node_modules racine Render.
 */

const MONTHS = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12
};

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isValidIsoDate(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

function toUint8Array(buffer) {
  if (Buffer.isBuffer(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }
  if (buffer instanceof Uint8Array) return buffer;
  return new Uint8Array(buffer);
}

function loadPdfJs() {
  try {
    // eslint-disable-next-line global-require
    return require('pdfjs-dist/legacy/build/pdf.js');
  } catch (err) {
    throw new Error(`pdfjs-dist indisponible: ${err.message}`);
  }
}

async function extractTextItems(buffer) {
  const pdfjsLib = loadPdfJs();
  const data = toUint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data, stopAtErrors: false }).promise;
  const items = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    content.items.forEach((i) => {
      const str = String(i.str || '').trim();
      if (!str) return;
      items.push({ str, x: i.transform[4], y: i.transform[5], page: p });
    });
  }
  return items;
}

/** Calendrier type MEM / In Situ Learning (colonnes mois + marqueur 7). */
function parseMemStyleDates(items) {
  const years = items.filter((i) => /^20\d{2}$/.test(i.str));
  const monthHeaders = items.filter((i) => MONTHS[norm(i.str)]);
  if (monthHeaders.length < 3) return [];

  const cols = monthHeaders.map((m) => {
    const yNear = years
      .filter((y) => y.page === m.page && Math.abs(y.x - m.x) < 45)
      .sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x));
    const year = yNear[0] ? Number(yNear[0].str) : new Date().getFullYear();
    return { month: MONTHS[norm(m.str)], year, x: m.x, page: m.page };
  });

  const dates = new Set();
  for (const d of items) {
    if (!/^\d{1,2}$/.test(d.str)) continue;
    const day = Number(d.str);
    if (day < 1 || day > 31) continue;

    const marker = items.find(
      (i) =>
        i.page === d.page &&
        i.str === '7' &&
        Math.abs(i.y - d.y) < 3.5 &&
        i.x < d.x &&
        d.x - i.x < 22
    );
    if (!marker) continue;

    let best = null;
    let bestDist = Infinity;
    for (const c of cols) {
      if (c.page !== d.page) continue;
      const dist = Math.abs(c.x - d.x);
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    if (!best || bestDist > 48) continue;
    if (!isValidIsoDate(best.year, best.month, day)) continue;
    dates.add(
      `${best.year}-${String(best.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    );
  }
  return [...dates].sort();
}

/**
 * Génère les dates de formation à partir des jours de la semaine du salarié
 * (ex. ['Mardi','Jeudi']) sur une année scolaire (1er sept → 31 août).
 */
function expandWeekdaysToDates(trainingDays, schoolYearStart) {
  const dayMap = {
    Dimanche: 0,
    Lundi: 1,
    Mardi: 2,
    Mercredi: 3,
    Jeudi: 4,
    Vendredi: 5,
    Samedi: 6
  };
  const wanted = new Set(
    (trainingDays || []).map((d) => dayMap[d]).filter((n) => n !== undefined)
  );
  if (wanted.size === 0) return [];

  const startYear = Number(schoolYearStart) || new Date().getFullYear();
  const start = new Date(Date.UTC(startYear, 8, 1)); // 1 sept
  const end = new Date(Date.UTC(startYear + 1, 7, 31)); // 31 août
  const out = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const d = new Date(t);
    if (wanted.has(d.getUTCDay())) {
      out.push(d.toISOString().slice(0, 10));
    }
  }
  return out;
}

async function parseApprenticePlanningPdf(buffer) {
  let items = [];
  try {
    items = await extractTextItems(buffer);
  } catch (err) {
    console.warn('parseApprenticePlanningPdf: pdfjs', err.message);
    return { trainingDates: [], source: 'none', error: err.message };
  }

  const memDates = parseMemStyleDates(items);
  if (memDates.length >= 5) {
    return { trainingDates: memDates, source: 'pdf-mem', error: null };
  }

  return { trainingDates: [], source: 'none', error: null };
}

module.exports = {
  parseApprenticePlanningPdf,
  expandWeekdaysToDates
};
