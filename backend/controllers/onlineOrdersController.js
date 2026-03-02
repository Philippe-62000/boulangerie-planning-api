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
    const count = await OnlineOrderLink.countDocuments({ city });
    const link = await OnlineOrderLink.create({
      city: city.toLowerCase(),
      spreadsheetId,
      className: className.trim(),
      spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
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

// Parser les lignes du sheet en commandes (jour, nom, commande)
// Structure: A1 = nom de la classe, ligne 2 = en-têtes, lignes 3+ = données
function parseOrdersFromSheet(values, defaultClassName) {
  const orders = [];
  if (!values || values.length < 2) return orders;
  const className = (values[0]?.[0] || defaultClassName).toString().trim();
  const headerRow = values[1] || values[0] || [];
  const dataStart = values[1]?.some?.(c => /jour|date|nom|commande/i.test(String(c))) ? 2 : 1;
  const dataRows = values.slice(dataStart);
  const dayIdx = headerRow.findIndex(h => /jour|date/i.test(String(h)));
  const nameIdx = headerRow.findIndex(h => /nom|prénom|prenom/i.test(String(h)));
  const orderIdx = headerRow.findIndex(h => /commande|order/i.test(String(h)));
  const fallbackDay = dayIdx >= 0 ? dayIdx : 0;
  const fallbackName = nameIdx >= 0 ? nameIdx : 1;
  const fallbackOrder = orderIdx >= 0 ? orderIdx : 2;
  for (const row of dataRows) {
    const day = (row[fallbackDay] ?? row[0] ?? '').toString().trim();
    const name = (row[fallbackName] ?? row[1] ?? '').toString().trim();
    const order = (row[fallbackOrder] ?? row[2] ?? '').toString().trim();
    if (day || name || order) {
      orders.push({ day, name, order, className });
    }
  }
  return orders;
}

// Filtrer les commandes pour un jour donné (format: 1, 2, 3... ou 01/03, etc.)
function filterOrdersForDay(orders, targetDay, targetMonth) {
  return orders.filter(o => {
    const d = String(o.day).trim();
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
    const monthName = MONTH_NAMES[targetMonth - 1];
    const links = await OnlineOrderLink.find({ city }).sort({ order: 1 });
    const allOrders = [];
    for (const link of links) {
      try {
        const { values } = await fetchSheetData(link.spreadsheetId, link.monthGids?.[monthName] || monthName, city);
        const className = values[0]?.[0] || link.className;
        const orders = parseOrdersFromSheet(values, className);
        const dayOrders = filterOrdersForDay(orders, targetDay, targetMonth);
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
  getOrdersForDay,
  getMonthlySummary,
  getSheetTabs
};
