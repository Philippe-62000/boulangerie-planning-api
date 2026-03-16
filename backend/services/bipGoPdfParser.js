/**
 * Parse Bip&Go PDF facture autoroute pour extraire les transactions (date, entrée, sortie, montant)
 * et le montant total TTC
 * Note: Les montants par ligne dans le PDF Bip&Go sont en HT ; on les convertit en TTC (TVA 20%)
 */
const pdfParse = require('pdf-parse');

const TVA_TAUX = 1.2; // TVA 20% : TTC = HT * 1.2
const roundEuro = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Normalise un nom de péage pour la comparaison (minuscules, sans accents, sans espaces multiples)
 */
function normalizePeageName(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Vérifie si une entrée/sortie correspond au paramètre (comparaison partielle)
 */
function matchesPeage(extracted, configured) {
  if (!configured) return false;
  const nExt = normalizePeageName(extracted);
  const nConf = normalizePeageName(configured);
  if (!nExt || !nConf) return false;
  return nExt.includes(nConf) || nConf.includes(nExt);
}

/**
 * Découpe une chaîne concaténée au format Bip&Go (ex: 25007026A266BETHUNE25007024A264AIRE SUR LA LYS)
 * Chaque gare commence par 8 chiffres (code gantt). Supporte aussi 25007983GARE FORFAITAIRE.
 * @returns {{ entry: string, exit: string } | null}
 */
function splitConcatenatedGantts(concatenated) {
  if (!concatenated || typeof concatenated !== 'string') return null;
  // Enlever les montants/km collés à la fin (ex: 12,802,330,00 %33,3)
  const cleaned = concatenated.replace(/\d+[,.]\d[\d,.\s%]*$/g, '').trim();
  // Pattern: 8 chiffres + reste jusqu'au prochain bloc 8 chiffres ou fin (lettres/minuscules inclus)
  const ganttPattern = /\d{8}[A-Za-z0-9\s]+?(?=\d{8}|$)/g;
  const matches = cleaned.match(ganttPattern);
  if (!matches) return null;
  // Enlever montants/km éventuellement collés à la fin de chaque gantt
  const trimmed = matches.map(m => m.replace(/\d+[,.]\d[\d,.\s%]*$/, '').trim()).filter(Boolean);
  if (trimmed.length >= 2) {
    return { entry: trimmed[0], exit: trimmed[1] };
  }
  if (trimmed.length === 1) {
    return { entry: trimmed[0], exit: '' };
  }
  return null;
}

/** Mots-clés à exclure : faux positifs (pied de page, règlement, BIC/IBAN...) */
const EXCLUDE_PATTERNS = [
  /date\s+de\s+règlement/i,
  /prelevement\s+automatique/i,
  /bic\s*:/i,
  /iban\s*:/i,
  /compte\s+/i,
  /^du\s*$/i,
  /^sur\s+le\s+compte/i,
  /^\d{8}[A-Z0-9]*$/,  // code gantt seul sans nom de gare
  /^[a-z]{1,2}\s*$/i   // 1-2 lettres seules (ex: "du")
];

function isInvalidPeageEntry(entry, exit) {
  const e = (entry || '').trim();
  const s = (exit || '').trim();
  // Ne pas filtrer si les deux sont vides : on garde la transaction (jour + montant) pour unmatched
  if (e.length === 0 && s.length === 0) return false;
  // Filtrer seulement si on a du contenu qui ressemble à un faux positif
  for (const pat of EXCLUDE_PATTERNS) {
    if (pat.test(e) || pat.test(s)) return true;
  }
  return false;
}

/**
 * Extrait les transactions depuis le texte PDF
 * Format typique: Date | Entrée | Sortie | Tarif
 * Format Bip&Go concaténé: Date 25007026A266BETHUNE25007024A264AIRE SUR LA LYS  12,80  2,33
 * @returns {{ transactions: Array<{day, month, year, entry, exit, amountTTC}>, totalTTC: number }}
 */
function extractTransactions(text, expectedMonth, expectedYear) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;

    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const year = parseInt(dateMatch[3], 10);

    if (month !== expectedMonth || year !== expectedYear || day < 1 || day > 31) continue;

    // Montant: dernier nombre format X,XX ou X.XX (PDF Bip&Go = HT, on convertit en TTC)
    const amountMatches = line.match(/([\d\s]+[,.]\d{2})\s*€?/g);
    let amountTTC = 0;
    if (amountMatches && amountMatches.length > 0) {
      const lastAmount = amountMatches[amountMatches.length - 1];
      const amountHT = parseFloat(lastAmount.replace(/\s/g, '').replace(',', '.')) || 0;
      amountTTC = roundEuro(amountHT * TVA_TAUX);
    }

    // Entrée/Sortie: colonnes séparées par | ou 2+ espaces
    let entry = '';
    let exit = '';
    const withoutDate = line.replace(dateMatch[0], '').trim();
    const parts = withoutDate.split(/\s*\|\s*|\s{2,}|\t/).map(p => p.trim()).filter(p => p.length > 0);
    // Retirer le montant des parts
    const filtered = parts.filter(p => !/^[\d\s,.]+\s*€?$/.test(p));
    if (filtered.length >= 2) {
      entry = filtered[0];
      exit = filtered.slice(1, -1).join(' '); // tout entre entrée et montant = sortie
      if (filtered.length === 2) exit = filtered[1];
    } else if (filtered.length === 1) {
      const part = filtered[0];
      // Format Bip&Go concaténé: 25007026A266BETHUNE25007024A264AIRE SUR LA LYS
      const split = splitConcatenatedGantts(part);
      if (split) {
        entry = split.entry;
        exit = split.exit;
      } else {
        entry = part;
      }
    } else {
      // Fallback: chercher pattern gantt (8 chiffres) dans toute la ligne
      const split = splitConcatenatedGantts(withoutDate);
      if (split) {
        entry = split.entry;
        exit = split.exit;
      } else if (entry === '' && exit === '' && i + 1 < lines.length) {
        // Ligne suivante peut contenir entrée/sortie (format PDF à lignes séparées)
        const nextLine = lines[i + 1];
        const nextSplit = splitConcatenatedGantts(nextLine);
        if (nextSplit) {
          entry = nextSplit.entry;
          exit = nextSplit.exit;
        }
        const nextAmount = nextLine.match(/([\d\s]+[,.]\d{2})\s*€?/g);
        if (nextAmount && nextAmount.length > 0 && amountTTC === 0) {
          const lastAmt = nextAmount[nextAmount.length - 1];
          const ht = parseFloat(lastAmt.replace(/\s/g, '').replace(',', '.')) || 0;
          amountTTC = roundEuro(ht * TVA_TAUX);
        }
      }
    }

    // Exclure les faux positifs (pied de page, règlement, BIC/IBAN, "du", etc.)
    if (isInvalidPeageEntry(entry, exit)) continue;

    transactions.push({ day, month, year, entry, exit, amountTTC });
  }

  // Montant total depuis "NET A PAYER"
  let totalTTC = 0;
  const totalMatch = text.match(/NET\s*A\s*PAYER\s*([\d\s,]+)\s*€/i);
  if (totalMatch) {
    totalTTC = parseFloat(totalMatch[1].replace(/\s/g, '').replace(',', '.')) || 0;
  }
  if (totalTTC === 0 && transactions.length > 0) {
    totalTTC = transactions.reduce((s, t) => s + t.amountTTC, 0);
  }

  return { transactions, totalTTC };
}

/**
 * Parse Bip&Go PDF et retourne les données structurées pour la réconciliation
 * @param {Buffer} buffer - Contenu du fichier PDF
 * @param {number} expectedMonth - Mois attendu (1-12)
 * @param {number} expectedYear - Année attendue
 * @param {string} entreePeage - Nom du péage d'entrée configuré (ex: "BETHUNE")
 * @param {string} sortiePeage - Nom du péage de sortie configuré (ex: "AIRE SUR LA LYS")
 * @returns {{
 *   allerCount: number,
 *   allerRetourCount: number,
 *   unmatched: Array<{day, entry, exit, amountTTC, refuserImport?: boolean}>,
 *   totalTTC: number,
 *   dates: number[],
 *   amountTTC: number,
 *   rawText: string
 * }}
 */
async function parseBipGoPdf(buffer, expectedMonth, expectedYear, entreePeage = '', sortiePeage = '') {
  const data = await pdfParse(buffer);
  const text = data.text || '';

  const { transactions, totalTTC } = extractTransactions(text, expectedMonth, expectedYear);

  // Fallback: si pas de transactions structurées, utiliser l'ancienne logique (dates simples)
  if (transactions.length === 0) {
    const dates = [];
    const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/g;
    let match;
    while ((match = dateRegex.exec(text)) !== null) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      if (month === expectedMonth && year === expectedYear && day >= 1 && day <= 31 && !dates.includes(day)) {
        dates.push(day);
      }
    }
    dates.sort((a, b) => a - b);
    return {
      allerCount: 0,
      allerRetourCount: 0,
      recognizedDays: dates.map(d => ({ day: d, count: 1 })),
      unmatched: dates.map(d => ({ day: d, entry: '', exit: '', amountTTC: 0 })),
      totalTTC,
      dates,
      amountTTC: totalTTC,
      rawText: text.substring(0, 500),
      legacyMode: true
    };
  }

  // Grouper par jour
  const byDay = {};
  for (const t of transactions) {
    if (!byDay[t.day]) byDay[t.day] = [];
    byDay[t.day].push(t);
  }

  let allerCount = 0;
  let allerRetourCount = 0;
  const unmatched = [];

  const hasConfig = entreePeage && sortiePeage;
  const recognizedDays = []; // [{ day, count }] count=1 aller, count=2 aller-retour

  for (const [dayStr, dayTx] of Object.entries(byDay)) {
    const day = parseInt(dayStr, 10);
    const dayAmount = dayTx.reduce((s, t) => s + t.amountTTC, 0);

    if (!hasConfig) {
      unmatched.push({ day, entry: dayTx[0]?.entry || '', exit: dayTx[0]?.exit || '', amountTTC: dayAmount });
      continue;
    }

    let aller = 0;
    let retour = 0;

    for (const t of dayTx) {
      const entryMatch = matchesPeage(t.entry, entreePeage);
      const exitMatch = matchesPeage(t.exit, sortiePeage);
      const entryMatchSortie = matchesPeage(t.entry, sortiePeage);
      const exitMatchEntree = matchesPeage(t.exit, entreePeage);

      if (entryMatch && exitMatch) {
        aller++;
      } else if (entryMatchSortie && exitMatchEntree) {
        retour++;
      } else {
        unmatched.push({ day, entry: t.entry, exit: t.exit, amountTTC: t.amountTTC });
      }
    }

    if (aller > 0 || retour > 0) {
      const roundTrips = Math.min(aller, retour);
      const oneWay = Math.max(0, aller - roundTrips) + Math.max(0, retour - roundTrips);
      allerRetourCount += roundTrips;
      allerCount += oneWay;
      const count = roundTrips * 2 + oneWay;
      recognizedDays.push({ day, count });
    }
    // Ne pas ajouter de ligne "combinée" : les transactions non reconnues sont déjà ajoutées une par une dans la boucle ci-dessus
  }

  recognizedDays.sort((a, b) => a.day - b.day);
  const dates = recognizedDays.map(d => d.day);

  return {
    allerCount,
    allerRetourCount,
    recognizedDays,
    unmatched,
    totalTTC,
    dates,
    amountTTC: totalTTC,
    rawText: text.substring(0, 500)
  };
}

module.exports = { parseBipGoPdf, normalizePeageName, matchesPeage, extractTransactions };
