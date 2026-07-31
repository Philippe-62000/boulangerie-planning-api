/**
 * Extraction des jours de formation depuis les PDF calendrier CFA / In Situ Learning.
 * - Colonnes mois = bord gauche du libellé → mois suivant (évite le décalage d'1 mois)
 * - Couleurs via rendu PDF (canvas) : bleu=examen, rose=CFA, vert=In Situ Learning
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

const KIND_LABELS = {
  examen: "Période d'examen",
  cfa: 'CFA',
  insitu: 'In Situ Learning'
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
    return require('pdfjs-dist/legacy/build/pdf.mjs');
  } catch (err) {
    throw new Error(`pdfjs-dist indisponible: ${err.message}`);
  }
}

function loadCanvas() {
  try {
    // eslint-disable-next-line global-require
    return require('canvas');
  } catch {
    return null;
  }
}

function classifyRgb(r, g, b) {
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  if (chroma < 35) return null;
  // Bleu / cyan → période d'examen
  if (b > 140 && b >= r - 10 && b >= g && b - Math.min(r, g) > 40) return 'examen';
  // Rose / magenta → CFA
  if (r > 160 && b > 120 && g < 180 && r - g > 20) return 'cfa';
  // Vert → In Situ Learning
  if (g > 130 && g >= r && g >= b && g - Math.min(r, b) > 25) return 'insitu';
  return null;
}

function buildMonthColumns(items) {
  const years = items.filter((i) => /^20\d{2}$/.test(i.str));
  const monthHeaders = items
    .filter((i) => MONTHS[norm(i.str)])
    .sort((a, b) => a.x - b.x || a.page - b.page);
  if (monthHeaders.length < 3) return [];

  return monthHeaders.map((m, idx) => {
    const yNear = years
      .filter((y) => y.page === m.page && Math.abs(y.x - m.x) < 45)
      .sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x));
    const next = monthHeaders.slice(idx + 1).find((n) => n.page === m.page);
    return {
      month: MONTHS[norm(m.str)],
      year: yNear[0] ? Number(yNear[0].str) : new Date().getFullYear(),
      xLeft: m.x,
      // Le libellé du mois est au bord gauche de la colonne
      xRight: next ? next.x : m.x + 55,
      page: m.page
    };
  });
}

function assignColumn(cols, x, page) {
  return (
    cols.find(
      (c) => c.page === page && x >= c.xLeft - 2 && x < c.xRight - 2
    ) || null
  );
}

async function extractTextItemsFromPage(page, pageNum) {
  const content = await page.getTextContent();
  return content.items
    .map((i) => ({
      str: String(i.str || '').trim(),
      x: i.transform[4],
      y: i.transform[5],
      page: pageNum
    }))
    .filter((i) => i.str);
}

/** Fallback sans canvas : marqueur « 7 » à gauche du jour (sans type de couleur). */
function parseMemMarkerDates(items) {
  const cols = buildMonthColumns(items);
  if (!cols.length) return [];
  const map = new Map();
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
    const col = assignColumn(cols, d.x, d.page);
    if (!col || !isValidIsoDate(col.year, col.month, day)) continue;
    const iso = `${col.year}-${String(col.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!map.has(iso)) map.set(iso, { date: iso, kind: 'cfa' });
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function parseMemColoredDates(buffer) {
  const canvasMod = loadCanvas();
  if (!canvasMod) return null;
  const pdfjsLib = loadPdfJs();
  const data = toUint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data, stopAtErrors: false }).promise;
  const scale = 2.5;
  const allEntries = [];

  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const items = await extractTextItemsFromPage(page, p);
    const cols = buildMonthColumns(items);
    if (!cols.length) continue;

    const viewport = page.getViewport({ scale });
    const canvas = canvasMod.createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pageHeight = viewport.height / scale;

    const votesByIso = new Map();
    for (const d of items) {
      if (!/^\d{1,2}$/.test(d.str)) continue;
      const day = Number(d.str);
      if (day < 1 || day > 31) continue;
      const col = assignColumn(cols, d.x, d.page);
      if (!col || !isValidIsoDate(col.year, col.month, day)) continue;
      const iso = `${col.year}-${String(col.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const votes = { examen: 0, cfa: 0, insitu: 0 };
      for (let dx = -18; dx <= 10; dx += 3) {
        for (let dy = -4; dy <= 8; dy += 3) {
          const cx = Math.round((d.x + dx) * scale);
          const cy = Math.round((pageHeight - (d.y + dy)) * scale);
          if (cx < 0 || cy < 0 || cx >= canvas.width || cy >= canvas.height) continue;
          const pix = ctx.getImageData(cx, cy, 1, 1).data;
          const kind = classifyRgb(pix[0], pix[1], pix[2]);
          if (kind) votes[kind] += 1;
        }
      }
      const bestKind = ['examen', 'cfa', 'insitu'].sort(
        (a, b) => votes[b] - votes[a]
      )[0];
      if (!bestKind || votes[bestKind] < 3) continue;

      const prev = votesByIso.get(iso);
      if (!prev || votes[bestKind] > prev.score) {
        votesByIso.set(iso, { date: iso, kind: bestKind, score: votes[bestKind] });
      }
    }
    allEntries.push(...votesByIso.values());
  }

  // Dédupliquer multi-pages
  const map = new Map();
  for (const e of allEntries) {
    const prev = map.get(e.date);
    if (!prev || e.score > prev.score) map.set(e.date, e);
  }
  return [...map.values()]
    .map(({ date, kind }) => ({ date, kind }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

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
  const start = new Date(Date.UTC(startYear, 8, 1));
  const end = new Date(Date.UTC(startYear + 1, 7, 31));
  const out = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const d = new Date(t);
    if (wanted.has(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

async function parseApprenticePlanningPdf(buffer) {
  try {
    const colored = await parseMemColoredDates(buffer);
    if (colored && colored.length >= 5) {
      return {
        trainingEntries: colored,
        trainingDates: colored.map((e) => e.date),
        source: 'pdf-mem',
        error: null
      };
    }
  } catch (err) {
    console.warn('parseMemColoredDates:', err.message);
  }

  try {
    const pdfjsLib = loadPdfJs();
    const data = toUint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data, stopAtErrors: false }).promise;
    const items = [];
    for (let p = 1; p <= doc.numPages; p += 1) {
      const page = await doc.getPage(p);
      items.push(...(await extractTextItemsFromPage(page, p)));
    }
    const markers = parseMemMarkerDates(items);
    if (markers.length >= 5) {
      return {
        trainingEntries: markers,
        trainingDates: markers.map((e) => e.date),
        source: 'pdf-mem',
        error: null
      };
    }
  } catch (err) {
    console.warn('parseApprenticePlanningPdf fallback:', err.message);
    return {
      trainingEntries: [],
      trainingDates: [],
      source: 'none',
      error: err.message
    };
  }

  return { trainingEntries: [], trainingDates: [], source: 'none', error: null };
}

module.exports = {
  parseApprenticePlanningPdf,
  expandWeekdaysToDates,
  KIND_LABELS
};
