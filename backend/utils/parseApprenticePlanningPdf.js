/**
 * Extraction des jours de formation depuis les PDF calendrier CFA / In Situ Learning.
 * - Colonnes mois = bord gauche du libellé → mois suivant
 * - Jours ancrés par « n° + lettre » (évite le marqueur « 7 » heures)
 * - Couleurs via rendu PDF (canvas) : bleu=examen, rose=CFA, vert=In Situ Learning
 * - Dernière colonne parfois sans texte : échantillonnage par lignes Y globales
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
  if (r > 235 && g > 235 && b > 235) return null;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  if (chroma < 40) return null;
  // Orange fériés
  if (r > 200 && g > 90 && g < 190 && b < 100 && r > b + 80) return null;
  // Bleu → examen
  if (b > 150 && b > r + 30 && b >= g) return 'examen';
  // Rose → CFA
  if (r > 170 && b > 140 && g < 170 && r > g + 30 && b > g + 20) return 'cfa';
  // Vert → In Situ Learning
  if (g > 130 && g > r + 25 && g > b + 25) return 'insitu';
  return null;
}

function median(arr) {
  if (!arr || !arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
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
      xRight: next ? next.x : m.x + 55,
      page: m.page
    };
  });
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

function buildDayAnchors(items, cols) {
  const anchors = [];
  for (const col of cols) {
    const letters = items.filter(
      (i) =>
        i.page === col.page &&
        /^[LMMJVSD]$/.test(i.str) &&
        i.x >= col.xLeft &&
        i.x < col.xRight &&
        i.y > 112 &&
        i.y < 328
    );
    for (const letter of letters) {
      // N° de jour juste à gauche de la lettre (ignore le « 7 » heures plus à gauche)
      const nums = items.filter(
        (i) =>
          i.page === letter.page &&
          /^\d{1,2}$/.test(i.str) &&
          Math.abs(i.y - letter.y) < 2.5 &&
          i.x < letter.x &&
          letter.x - i.x < 18 &&
          i.x >= col.xLeft - 2
      );
      if (!nums.length) continue;
      nums.sort((a, b) => b.x - a.x);
      const num = nums[0];
      const day = Number(num.str);
      if (day < 1 || day > 31) continue;
      if (!isValidIsoDate(col.year, col.month, day)) continue;
      anchors.push({ col, day, x: num.x, y: num.y });
    }
  }
  return anchors;
}

function buildAssignedY(anchors) {
  const dayYs = {};
  for (const a of anchors) {
    if (!dayYs[a.day]) dayYs[a.day] = [];
    dayYs[a.day].push(a.y);
  }
  const assignedY = {};
  assignedY[1] = median((dayYs[1] || []).filter((y) => y > 300)) || median(dayYs[1]);
  for (let d = 2; d <= 31; d += 1) {
    const prev = assignedY[d - 1];
    if (prev == null) break;
    const below = (dayYs[d] || []).filter((y) => y < prev - 2).sort((a, b) => b - a);
    const near = below.filter((y) => y > prev - 16);
    assignedY[d] = near.length ? median(near) : below[0] || null;
  }
  return assignedY;
}

function sampleCellKind(ctx, scale, pageHeight, canvas, col, day, x, y, assignedY) {
  const yPrev = assignedY[day - 1] ?? y + 6.9;
  const yNext = assignedY[day + 1] ?? y - 6.9;
  // Bande surtout au-dessus du n° (PDF Y↑) pour ne pas prendre la couleur du jour suivant
  const yBot = y - Math.min(1.2, (y - yNext) * 0.05);
  const yTop = y + (yPrev - y) * 0.58;
  const x0 = Math.max(col.xLeft + 0.8, x - 16);
  const x1 = Math.min(col.xRight - 2, x + 12);
  const votes = { examen: 0, cfa: 0, insitu: 0 };
  let samples = 0;
  let strongCols = 0;
  for (let xx = x0; xx <= x1; xx += 0.8) {
    let localBest = 0;
    let localN = 0;
    for (let yy = yBot; yy <= yTop; yy += 0.45) {
      const cx = Math.round(xx * scale);
      const cy = Math.round((pageHeight - yy) * scale);
      if (cx < 0 || cy < 0 || cx >= canvas.width || cy >= canvas.height) continue;
      const pix = ctx.getImageData(cx, cy, 1, 1).data;
      samples += 1;
      localN += 1;
      const kind = classifyRgb(pix[0], pix[1], pix[2]);
      if (kind) {
        votes[kind] += 1;
        localBest += 1;
      }
    }
    if (localN && localBest / localN >= 0.35) strongCols += 1;
  }
  const best = ['examen', 'cfa', 'insitu'].sort((a, b) => votes[b] - votes[a])[0];
  if (!best || votes[best] < 12) return null;
  const ratio = votes[best] / samples;
  if (best === 'cfa') {
    // Barre rose continue (strongCols) — ratio seul insuffisant (pastille « 7h »)
    // Début juillet : rose partiel mais sur plusieurs colonnes de pixels
    if (strongCols < 4 && ratio < 0.22) return null;
  } else if (best === 'insitu') {
    if (ratio < 0.24 || strongCols < 3) return null;
  } else if (ratio < 0.14) {
    return null;
  }
  return { kind: best, score: votes[best] };
}

/** Fallback sans canvas : marqueur « 7 » à gauche du jour (sans type de couleur). */
function parseMemMarkerDates(items) {
  const cols = buildMonthColumns(items);
  if (!cols.length) return [];
  const map = new Map();
  for (const col of cols) {
    for (const d of items) {
      if (d.page !== col.page) continue;
      if (!/^\d{1,2}$/.test(d.str)) continue;
      const day = Number(d.str);
      if (day < 1 || day > 31 || !isValidIsoDate(col.year, col.month, day)) continue;
      if (d.x < col.xLeft - 2 || d.x >= col.xRight) continue;
      const letter = items.find(
        (i) =>
          i.page === d.page &&
          /^[LMMJVSD]$/.test(i.str) &&
          Math.abs(i.y - d.y) < 2.5 &&
          i.x > d.x &&
          i.x < d.x + 20
      );
      if (!letter) continue;
      const marker = items.find(
        (i) =>
          i.page === d.page &&
          i.str === '7' &&
          Math.abs(i.y - d.y) < 3.5 &&
          i.x < d.x &&
          d.x - i.x < 22 &&
          i.x >= col.xLeft - 2
      );
      if (!marker) continue;
      const iso = `${col.year}-${String(col.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (!map.has(iso)) map.set(iso, { date: iso, kind: 'cfa' });
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function parseMemColoredDates(buffer) {
  const canvasMod = loadCanvas();
  if (!canvasMod) return null;
  const pdfjsLib = loadPdfJs();
  const data = toUint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data, stopAtErrors: false }).promise;
  const scale = 3;
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

    const anchors = buildDayAnchors(items, cols);
    const assignedY = buildAssignedY(anchors);
    const votesByIso = new Map();

    for (const a of anchors) {
      const sampled = sampleCellKind(
        ctx,
        scale,
        pageHeight,
        canvas,
        a.col,
        a.day,
        a.x,
        a.y,
        assignedY
      );
      if (!sampled) continue;
      const iso = `${a.col.year}-${String(a.col.month).padStart(2, '0')}-${String(a.day).padStart(2, '0')}`;
      const prev = votesByIso.get(iso);
      if (!prev || sampled.score > prev.score) {
        votesByIso.set(iso, { date: iso, kind: sampled.kind, score: sampled.score });
      }
    }

    // Colonnes sans n° de jour (ex. Juillet examen) : parcourir les lignes Y
    for (const col of cols) {
      const dim = new Date(col.year, col.month, 0).getDate();
      let anchoredInCol = 0;
      for (const a of anchors) {
        if (a.col === col) anchoredInCol += 1;
      }
      if (anchoredInCol >= 10) continue;
      for (let day = 1; day <= dim; day += 1) {
        const y = assignedY[day];
        if (y == null) continue;
        const iso = `${col.year}-${String(col.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (votesByIso.has(iso)) continue;
        const xMid = col.xLeft + (col.xRight - col.xLeft) * 0.45;
        const sampled = sampleCellKind(
          ctx,
          scale,
          pageHeight,
          canvas,
          col,
          day,
          xMid,
          y,
          assignedY
        );
        if (!sampled) continue;
        votesByIso.set(iso, { date: iso, kind: sampled.kind, score: sampled.score });
      }
    }

    allEntries.push(...votesByIso.values());
  }

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
        source: 'pdf-mem-markers',
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
