const pdfParse = require('pdf-parse');

async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return String(data?.text || '');
  } catch (err) {
    const msg = String(err?.message || err || '');
    // Certains PDF (souvent générés/imprimés par des systèmes tiers) ont des XRef invalides.
    // pdf-parse (pdf.js) échoue alors avec "bad XRef entry", alors que le PDF est lisible.
    // On retente via pdfjs-dist avec stopAtErrors=false.
    if (!/bad\s+xref\s+entry/i.test(msg)) {
      throw err;
    }

    let pdfjsLib;
    try {
      // Dépendance ajoutée côté backend: pdfjs-dist
      pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    } catch (e) {
      // Fallback indisponible → remonter l'erreur originale (plus explicite pour l'utilisateur)
      throw err;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      stopAtErrors: false,
      disableFontFace: true,
      useSystemFonts: true
    });
    const doc = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const line = (content.items || [])
        .map((it) => (it && typeof it.str === 'string' ? it.str : ''))
        .filter(Boolean)
        .join(' ');
      text += `${line}\n`;
    }
    return text;
  }
}

const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const normalizeText = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Présence = au moins un créneau horaire (ex. 07h30) sur la journée. */
const hasWorkHours = (dayToken) => /\d{1,2}h\d{2}/i.test(String(dayToken || ''));

const parseWeekMeta = (text) => {
  const flat = String(text || '').replace(/\s+/g, ' ');
  const weekMatch = flat.match(/semaine\s+(\d{1,2})\s+du\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+au\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!weekMatch) {
    return null;
  }
  const [, weekNumber, d1, m1, y1, d2, m2, y2] = weekMatch;
  const pad = (n) => String(n).padStart(2, '0');
  const weekStartStr = `${y1}-${pad(m1)}-${pad(d1)}`;
  const weekEndStr = `${y2}-${pad(m2)}-${pad(d2)}`;
  const [ys, ms, ds] = weekStartStr.split('-').map(Number);
  const startDate = new Date(ys, ms - 1, ds, 12, 0, 0, 0);
  const [ye, me, de] = weekEndStr.split('-').map(Number);
  const endDate = new Date(ye, me - 1, de, 12, 0, 0, 0);
  const day = startDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startDate.setDate(startDate.getDate() + diff);
  return {
    weekNumber: Number(weekNumber),
    weekStart: startDate,
    weekEnd: endDate,
    weekStartStr: `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`
  };
};

const parseDayTokens = (shiftPart) => {
  let remaining = String(shiftPart || '').trim();
  const days = [];

  while (remaining && days.length < 7) {
    let token = '';

    if (/^MAL/i.test(remaining)) {
      days.push('MAL');
      remaining = remaining.slice(3);
      continue;
    }
    if (/^CFAREP/i.test(remaining)) {
      days.push('CFAREP');
      remaining = remaining.slice(6);
      continue;
    }
    if (/^CFA/i.test(remaining)) {
      days.push('CFA');
      remaining = remaining.slice(3);
      continue;
    }
    if (/^PREP/i.test(remaining)) {
      days.push('PREP');
      remaining = remaining.slice(4);
      continue;
    }

    if (/^REP/i.test(remaining)) {
      const afterRep = remaining.slice(3);
      const hourStart = afterRep.match(/^(\d{1,2})h\d{2}/i);
      const startHour = hourStart ? parseInt(hourStart[1], 10) : null;
      const repSameDayWork = startHour != null && startHour >= 11;

      if (repSameDayWork) {
        token += 'REP';
        remaining = remaining.slice(3);
      } else {
        days.push('REP');
        remaining = remaining.slice(3);
        continue;
      }
    }

    let hourCount = 0;
    while (/^\d{1,2}h\d{2}/i.test(remaining) && hourCount < 2) {
      const hm = remaining.match(/^\d{1,2}h\d{2}/i)[0];
      token += hm;
      remaining = remaining.slice(hm.length);
      hourCount += 1;
      if (/^(REP|MAL|CFA|CFAREP|PREP)/i.test(remaining)) break;
    }

    days.push(token);
  }

  while (days.length < 7) days.push('');
  return days.slice(0, 7);
};

const parseEmployeeRows = (text) => {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  const rowRe =
    /([A-ZÀ-ÿ][A-Za-zÀ-ÿ'’\-]+)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\-]+?)((?:MAL|REP|CFA|CFAREP|PREP|\d{1,2}h\d{2})+)(\d{1,2}h\d{2}\s*\/\s*\d{1,2}h\d{2})\s*(Vendeuse|Premiere-Vendeuse|Première-Vendeuse|Apprentie-Vente|Apprenti-Vendeuse)/gi;

  const employees = [];
  let m;
  while ((m = rowRe.exec(flat)) !== null) {
    const parsedName = `${m[1].trim()} ${m[2].trim()}`;
    let shiftsOnly = m[3] || '';
    if (m[4]) {
      shiftsOnly = shiftsOnly.replace(/\d{1,2}h\d{2}$/i, '');
    }
    const dayTokens = parseDayTokens(shiftsOnly);
    const presenceByDay = {};
    WEEK_DAYS.forEach((jour, idx) => {
      presenceByDay[jour] = hasWorkHours(dayTokens[idx]);
    });
    employees.push({ parsedName, presenceByDay, dayTokens });
  }
  return employees;
};

const nameTokens = (name) =>
  normalizeText(name)
    .split(' ')
    .filter((t) => t.length > 1);

const matchEmployee = (parsedName, employees) => {
  const tokens = nameTokens(parsedName);
  if (tokens.length < 2) return null;

  let best = null;
  let bestScore = 0;

  for (const emp of employees) {
    const empTokens = nameTokens(emp.name);
    if (empTokens.length < 2) continue;
    const overlap = tokens.filter((t) => empTokens.includes(t)).length;
    if (overlap >= 2 && overlap > bestScore) {
      bestScore = overlap;
      best = emp;
    }
  }
  return best;
};

/**
 * @param {Buffer} buffer - PDF planning (format export Filmara / VULPINUS)
 * @param {Array<{_id, name, role}>} employees - liste employés actifs
 */
async function parseSalesPlanningPdf(buffer, employees = []) {
  const text = await extractTextFromPdf(buffer);
  const weekMeta = parseWeekMeta(text);
  if (!weekMeta) {
    throw new Error(
      'Impossible de lire la semaine dans le PDF (attendu : « semaine XX du JJ/MM/AAAA au … »).'
    );
  }

  const parsedRows = parseEmployeeRows(text);
  if (!parsedRows.length) {
    throw new Error('Aucune ligne salarié reconnue dans le planning.');
  }

  const vendeuseRoles = new Set([
    'vendeuse',
    'apprenti',
    'apprenti vendeuse',
    'manager',
    'responsable',
    'premiere-vendeuse',
    'première-vendeuse'
  ]);

  const eligible = (employees || []).filter((e) =>
    vendeuseRoles.has(normalizeText(e.role))
  );

  const presences = {};
  const matched = [];
  const unmatched = [];

  for (const row of parsedRows) {
    const emp = matchEmployee(row.parsedName, eligible);
    if (emp) {
      presences[String(emp._id)] = row.presenceByDay;
      matched.push({ employeeId: emp._id, employeeName: emp.name, parsedName: row.parsedName });
    } else {
      unmatched.push(row.parsedName);
    }
  }

  const weekKey = weekMeta.weekStartStr;

  return {
    weekMeta,
    weekKey,
    weekStart: weekKey,
    presences,
    matched,
    unmatched,
    parsedCount: parsedRows.length
  };
}

module.exports = {
  WEEK_DAYS,
  parseSalesPlanningPdf,
  parseDayTokens,
  hasWorkHours,
  normalizeText
};
