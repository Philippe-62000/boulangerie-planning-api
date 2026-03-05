const OnlineOrderLink = require('../models/OnlineOrderLink');
const GoogleOAuthToken = require('../models/GoogleOAuthToken');
const { google } = require('googleapis');
const googleOAuthController = require('./googleOAuthController');

const MONTH_NAMES = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

// Extraire l'ID du spreadsheet depuis une URL Google Sheets
function extractSpreadsheetId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Extraire le gid (sheetId) depuis une URL Google Sheets
function extractGidFromUrl(url) {
  const match = url.match(/[?&]gid=(\d+)/);
  return match ? match[1] : null;
}

// Lister les liens pour une ville
async function getLinks(req, res) {
  try {
    const city = (req.query.city || 'longuenesse').toLowerCase();
    const links = await OnlineOrderLink.find({ city }).sort({ order: 1, className: 1 });
    res.json({ success: true, data: links });
  } catch (error) {
    console.error('Erreur getLinks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Récupérer les monthGids en mappant les onglets nommés par mois (Mars, Avril, etc.)
async function fetchMonthGidsFromTabs(spreadsheetId, city) {
  try {
    const auth = await getAuthenticatedClient(city);
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = spreadsheet.data.sheets || [];
    const monthGids = {};
    const monthNamesLower = MONTH_NAMES.map(m => m.toLowerCase());
    for (const s of sheetsList) {
      const title = (s.properties?.title || '').trim();
      const titleLower = title.toLowerCase();
      const sheetId = String(s.properties?.sheetId || '');
      if (!sheetId) continue;
      const exactMatch = MONTH_NAMES.find(m => m.toLowerCase() === titleLower);
      const partialMatch = MONTH_NAMES.find(m => titleLower.includes(m.toLowerCase()));
      const matched = exactMatch || partialMatch;
      if (matched) {
        monthGids[matched] = sheetId;
      }
    }
    return monthGids;
  } catch (err) {
    console.error('fetchMonthGidsFromTabs:', err.message);
    return {};
  }
}

// Ajouter un lien
async function addLink(req, res) {
  try {
    const { spreadsheetUrl, className, city = 'longuenesse' } = req.body;
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl || req.body.spreadsheetId);
    if (!spreadsheetId) {
      return res.status(400).json({ success: false, error: 'URL ou ID de spreadsheet invalide' });
    }
    if (!className || !className.trim()) {
      return res.status(400).json({ success: false, error: 'Nom de la classe requis' });
    }
    const cityLower = city.toLowerCase();
    const count = await OnlineOrderLink.countDocuments({ city: cityLower });
    let monthGids = {};
    try {
      monthGids = await fetchMonthGidsFromTabs(spreadsheetId, cityLower);
    } catch (_) {
      // Pas de token Google ou erreur - on crée le lien sans monthGids
    }
    const gidFromUrl = extractGidFromUrl(spreadsheetUrl || '');
    if (Object.keys(monthGids).length === 0 && gidFromUrl) {
      const monthName = MONTH_NAMES[new Date().getMonth()];
      monthGids = { [monthName]: gidFromUrl };
    }
    const link = await OnlineOrderLink.create({
      city: cityLower,
      spreadsheetId,
      className: className.trim(),
      spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      monthGids,
      order: count
    });
    res.json({ success: true, data: link });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Cette classe existe déjà pour cette ville' });
    }
    console.error('Erreur addLink:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Synchroniser les onglets (monthGids) d'un lien existant
async function syncLinkTabs(req, res) {
  try {
    const { id } = req.params;
    const city = (req.query.city || 'longuenesse').toLowerCase();
    const link = await OnlineOrderLink.findById(id);
    if (!link) {
      return res.status(404).json({ success: false, error: 'Lien non trouvé' });
    }
    const monthGids = await fetchMonthGidsFromTabs(link.spreadsheetId, city);
    link.monthGids = monthGids;
    await link.save();
    res.json({ success: true, data: link });
  } catch (error) {
    console.error('Erreur syncLinkTabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Supprimer un lien
async function deleteLink(req, res) {
  try {
    const { id } = req.params;
    await OnlineOrderLink.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteLink:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Mettre à jour l'ordre des liens
async function updateLinksOrder(req, res) {
  try {
    const { links } = req.body; // [{ id, order }]
    for (const item of links || []) {
      await OnlineOrderLink.findByIdAndUpdate(item.id, { order: item.order });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateLinksOrder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Obtenir un client OAuth authentifié pour une ville
async function getAuthenticatedClient(city) {
  const token = await GoogleOAuthToken.findOne({ city: (city || 'longuenesse').toLowerCase() });
  if (!token?.refreshToken) {
    throw new Error('Compte Google non connecté. Cliquez sur "Connecter Google" pour autoriser l\'accès aux feuilles partagées.');
  }
  const oauth2Client = googleOAuthController.getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: token.refreshToken,
    access_token: token.accessToken,
    expiry_date: token.expiryDate?.getTime()
  });
  await oauth2Client.getAccessToken();
  return oauth2Client;
}

// Récupérer les données d'un Google Sheet via l'API OAuth
async function fetchSheetData(spreadsheetId, rangeOrGid, city) {
  const auth = await getAuthenticatedClient(city);
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetsList = spreadsheet.data.sheets || [];
  let targetSheet = null;
  if (typeof rangeOrGid === 'string' && /^\d+$/.test(rangeOrGid)) {
    targetSheet = sheetsList.find(s => String(s.properties.sheetId) === rangeOrGid);
  } else if (typeof rangeOrGid === 'string') {
    const search = rangeOrGid.toLowerCase().trim();
    targetSheet = sheetsList.find(s =>
      s.properties.title && s.properties.title.toLowerCase().trim() === search
    );
    if (!targetSheet) {
      targetSheet = sheetsList.find(s =>
        s.properties.title && s.properties.title.toLowerCase().includes(search)
      );
    }
  }
  if (!targetSheet) {
    targetSheet = sheetsList[0];
  }
  const sheetTitle = targetSheet.properties.title;
  const range = `${sheetTitle}!A:Z`;
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return { values: response.data.values || [], sheetTitle };
}

// Vérifier si une cellule ressemble à une date (DD/MM/YYYY ou similaire)
function looksLikeDate(str) {
  if (!str || typeof str !== 'string') return false;
  const s = String(str).trim();
  if (!s) return false;
  return /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s) || /^\d{4}-\d{1,2}-\d{1,2}$/.test(s);
}

// Parser les lignes du sheet en commandes
// Structure 1 (dates en colonnes): Ligne 1 = [Classe, 05/03/2026, 12/03/2026, ...], Ligne 2+ = [Nom, commande1, commande2, ...]
// Structure 2 (classique): ÉLÈVE | DATE/HEURE | MENU MIDI | ...
function parseOrdersFromSheet(values, defaultClassName) {
  const orders = [];
  if (!values || values.length < 2) return orders;
  const row0 = values[0] || [];
  const className = (row0[0] || defaultClassName).toString().trim();

  // Détecter le format "dates en colonnes" : colonnes B, C, D... de la ligne 1 contiennent des dates
  const dateColumns = [];
  for (let j = 1; j < row0.length; j++) {
    const cell = row0[j];
    if (looksLikeDate(cell)) {
      dateColumns.push({ col: j, dateStr: String(cell).trim() });
    }
  }
  const isDatesAsColumns = dateColumns.length >= 1 && !looksLikeDate(row0[0]);

  if (isDatesAsColumns) {
    for (let i = 1; i < values.length; i++) {
      const row = values[i] || [];
      const name = (row[0] ?? '').toString().trim();
      if (!name) continue;
      for (const { col, dateStr } of dateColumns) {
        const order = (row[col] ?? '').toString().trim();
        if (order) {
          orders.push({ day: dateStr, name, order, className, rawDate: dateStr });
        }
      }
    }
    return orders;
  }

  // Format classique : en-têtes élève/date/commande
  const row1 = values[0] || [];
  const row2 = values[1] || [];
  const row1HasHeaders = row1.some(h => /élève|eleve|date|heure|menu|nom|commande/i.test(String(h)));
  const row2HasHeaders = row2.some(h => /élève|eleve|date|heure|menu|nom|commande/i.test(String(h)));
  const headerRow = row2HasHeaders ? row2 : (row1HasHeaders ? row1 : row2);
  const dataStart = row2HasHeaders ? 2 : (row1HasHeaders ? 1 : 2);
  const dataRows = values.slice(dataStart);

  const nameIdx = headerRow.findIndex(h => /élève|eleve|nom|prénom|prenom/i.test(String(h)));
  const dateIdx = headerRow.findIndex(h => /date|heure|date\/heure/i.test(String(h)));
  const orderIdx = headerRow.findIndex(h => /menu|commande|order|midi/i.test(String(h)));

  const fallbackName = nameIdx >= 0 ? nameIdx : 0;
  const fallbackDate = dateIdx >= 0 ? dateIdx : 1;
  const fallbackOrder = orderIdx >= 0 ? orderIdx : 2;

  for (const row of dataRows) {
    const name = (row[fallbackName] ?? row[0] ?? '').toString().trim();
    const dateStr = (row[fallbackDate] ?? row[1] ?? '').toString().trim();
    const order = (row[fallbackOrder] ?? row[2] ?? '').toString().trim();
    if (name || dateStr || order) {
      orders.push({ day: dateStr, name, order, className, rawDate: dateStr });
    }
  }
  return orders;
}

// Parser une date au format DD/MM/YYYY, DD/MM/YYYY HHhMM, YYYY-MM-DD, ou nombre série Excel
function parseDateFromCell(str) {
  if (str === undefined || str === null) return null;
  const s = String(str).trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return { day: parseInt(iso[3], 10), month: parseInt(iso[2], 10), year: parseInt(iso[1], 10) };
  }
  const eu = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (eu) {
    const day = parseInt(eu[1], 10);
    const month = parseInt(eu[2], 10);
    let year = parseInt(eu[3], 10);
    if (year < 100) year += 2000;
    return { day, month, year };
  }
  const num = parseFloat(s);
  if (!isNaN(num) && num > 40000) {
    const d = new Date((num - 25569) * 86400 * 1000);
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }
  return null;
}

// Filtrer les commandes pour une date donnée (jour + mois + année)
function filterOrdersForDay(orders, targetDay, targetMonth, targetYear) {
  return orders.filter(o => {
    const parsed = parseDateFromCell(o.rawDate || o.day);
    if (parsed) {
      return parsed.day === targetDay && parsed.month === targetMonth && parsed.year === targetYear;
    }
    const d = String(o.day || '').trim();
    if (!d) return false;
    const dayNum = parseInt(d, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      return dayNum === targetDay;
    }
    const dateMatch = d.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
      const [, day, month] = dateMatch;
      return parseInt(day, 10) === targetDay && parseInt(month, 10) === targetMonth;
    }
    return d === String(targetDay);
  });
}

// Récupérer les commandes du jour
async function getOrdersForDay(req, res) {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const city = (req.query.city || 'longuenesse').toLowerCase();
    const targetDate = date ? new Date(date) : new Date();
    const targetDay = targetDate.getDate();
    const targetMonth = targetDate.getMonth() + 1;
    const targetYear = targetDate.getFullYear();
    const monthName = MONTH_NAMES[targetMonth - 1];
    const links = await OnlineOrderLink.find({ city }).sort({ order: 1 });
    const allOrders = [];
    for (const link of links) {
      try {
        const { values } = await fetchSheetData(link.spreadsheetId, link.monthGids?.[monthName] || monthName, city);
        const className = values[0]?.[0] || link.className;
        const orders = parseOrdersFromSheet(values, className);
        const dayOrders = filterOrdersForDay(orders, targetDay, targetMonth, targetYear);
        allOrders.push(...dayOrders.map(o => ({ ...o, className: className || link.className })));
      } catch (err) {
        console.error(`Erreur fetch sheet ${link.className}:`, err.message);
      }
    }
    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        day: targetDay,
        month: targetMonth,
        orders: allOrders
      }
    });
  } catch (error) {
    console.error('Erreur getOrdersForDay:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Récapitulatif par mois
async function getMonthlySummary(req, res) {
  try {
    const { month, year } = req.query; // month 1-12, year
    const city = (req.query.city || 'longuenesse').toLowerCase();
    const targetMonth = parseInt(month, 10) || new Date().getMonth() + 1;
    const targetYear = parseInt(year, 10) || new Date().getFullYear();
    const monthName = MONTH_NAMES[targetMonth - 1];
    const links = await OnlineOrderLink.find({ city }).sort({ order: 1 });
    const byClass = {};
    let total = 0;
    for (const link of links) {
      try {
        const { values } = await fetchSheetData(link.spreadsheetId, link.monthGids?.[monthName] || monthName, city);
        const className = values[0]?.[0] || link.className;
        const orders = parseOrdersFromSheet(values, className);
        const count = orders.filter(o => o.day || o.name || o.order).length;
        byClass[className || link.className] = count;
        total += count;
      } catch (err) {
        console.error(`Erreur fetch sheet ${link.className}:`, err.message);
        byClass[link.className] = 0;
      }
    }
    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        monthName,
        byClass,
        total
      }
    });
  } catch (error) {
    console.error('Erreur getMonthlySummary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Lister les onglets d'un spreadsheet (pour configurer les gids)
async function getSheetTabs(req, res) {
  try {
    const { spreadsheetId } = req.params;
    const city = (req.query.city || 'longuenesse').toLowerCase();
    const auth = await getAuthenticatedClient(city);
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const tabs = (spreadsheet.data.sheets || []).map(s => ({
      title: s.properties.title,
      sheetId: s.properties.sheetId
    }));
    res.json({ success: true, data: tabs });
  } catch (error) {
    console.error('Erreur getSheetTabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getLinks,
  addLink,
  deleteLink,
  updateLinksOrder,
  syncLinkTabs,
  getOrdersForDay,
  getMonthlySummary,
  getSheetTabs
};
