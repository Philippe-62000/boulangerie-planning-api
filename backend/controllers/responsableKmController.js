const ResponsableTripType = require('../models/ResponsableTripType');
const ResponsableKmExpense = require('../models/ResponsableKmExpense');
const Parameter = require('../models/Parameters');
const { parseBipGoPdf } = require('../services/bipGoPdfParser');

const DEFAULT_TRIP_TYPES_LONGUENESSE = [
  { name: 'boulangerie-l', displayName: 'Boulangerie L', km: 96, order: 1 },
  { name: 'boulangerie-promocash', displayName: 'Boulangerie L via Promocash', km: 104.3, order: 2 },
  { name: 'tgt-cash', displayName: 'TGT Cash', km: 11.4, order: 3 },
  { name: 'ca-saint-omer', displayName: 'CA Saint Omer', km: 6, order: 4 },
  { name: 'lidl-l', displayName: 'Lidl L', km: 1.8, order: 5 },
  { name: 'auchan-l', displayName: 'Auchan L', km: 5.2, order: 6 },
  { name: 'laverie-saint-omer', displayName: 'Laverie Saint Omer', km: 7.2, order: 7 },
  { name: 'ville-longuenesse', displayName: 'Ville de Longuenesse', km: 2.6, order: 8 },
  { name: 'entrepot-lidl', displayName: 'Entrepot Lidl Tournée', km: 26, order: 9 },
  { name: 'metro-calais', displayName: 'Métro Calais/Boulogne', km: 90, order: 10 },
  { name: 'divers', displayName: 'Divers', km: 0, order: 11 },
  { name: 'peage', displayName: 'Péage autoroute', km: 0, isToll: true, order: 12 }
];

async function getTauxKm(site, year) {
  const param = await Parameter.findOne({
    name: `tauxKmResponsable_${site}_${year}`
  });
  return param?.kmValue ?? 0.47;
}

async function ensureTripTypes(site) {
  const existing = await ResponsableTripType.find({ site }).sort({ order: 1 });
  if (existing.length > 0) return existing;

  const types = DEFAULT_TRIP_TYPES_LONGUENESSE.map(t => ({ ...t, site }));
  const created = await ResponsableTripType.insertMany(types);
  return created;
}

exports.getTripTypes = async (req, res) => {
  try {
    const { site } = req.query;
    if (!site || !['longuenesse', 'arras'].includes(site)) {
      return res.status(400).json({ error: 'Site requis (longuenesse ou arras)' });
    }
    let types = await ResponsableTripType.find({ site }).sort({ order: 1 });
    if (types.length === 0) {
      types = await ensureTripTypes(site);
    }
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Erreur getTripTypes:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const { site, month, year } = req.query;
    if (!site || !month || !year) {
      return res.status(400).json({ error: 'Site, mois et année requis' });
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (!['longuenesse', 'arras'].includes(site)) {
      return res.status(400).json({ error: 'Site invalide' });
    }

    const [expense, tripTypes, tauxKm] = await Promise.all([
      ResponsableKmExpense.findOne({ site, month: m, year: y }),
      ResponsableTripType.find({ site }).sort({ order: 1 }),
      getTauxKm(site, y)
    ]);

    if (tripTypes.length === 0) {
      await ensureTripTypes(site);
    }
    const types = await ResponsableTripType.find({ site }).sort({ order: 1 });

    const daysInMonth = new Date(y, m, 0).getDate();
    const grid = {};
    types.forEach(t => {
      grid[t._id.toString()] = {};
      for (let d = 1; d <= daysInMonth; d++) {
        grid[t._id.toString()][d] = 0;
      }
    });

    if (expense) {
      expense.entries.forEach(e => {
        const key = e.tripTypeId.toString();
        if (grid[key] !== undefined) {
          grid[key][e.day] = e.count || 1;
        }
      });
    }

    res.json({
      success: true,
      data: {
        site,
        month: m,
        year: y,
        tripTypes: types,
        grid,
        tollAmountTTC: expense?.tollAmountTTC ?? 0,
        tollAmountHT: expense?.tollAmountHT ?? 0,
        pdfImportedDates: expense?.pdfImportedDates ?? [],
        tauxKm,
        daysInMonth
      }
    });
  } catch (error) {
    console.error('Erreur getExpense:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.saveExpense = async (req, res) => {
  try {
    const { site, month, year, grid, tollAmountTTC, tollAmountHT, pdfImportedDates } = req.body;
    if (!site || !month || !year) {
      return res.status(400).json({ error: 'Site, mois et année requis' });
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const entries = [];
    if (grid && typeof grid === 'object') {
      for (const [tripTypeId, days] of Object.entries(grid)) {
        if (days && typeof days === 'object') {
          for (const [dayStr, count] of Object.entries(days)) {
            const day = parseInt(dayStr, 10);
            const c = parseInt(count, 10) || 0;
            if (day >= 1 && day <= 31 && c > 0) {
              entries.push({ tripTypeId, day, count: c });
            }
          }
        }
      }
    }

    const update = {
      site,
      month: m,
      year: y,
      entries,
      tollAmountTTC: parseFloat(tollAmountTTC) || 0,
      tollAmountHT: parseFloat(tollAmountHT) || 0,
      pdfImportedDates: Array.isArray(pdfImportedDates) ? pdfImportedDates.map(d => parseInt(d, 10)).filter(d => d >= 1 && d <= 31) : []
    };

    const expense = await ResponsableKmExpense.findOneAndUpdate(
      { site, month: m, year: y },
      update,
      { new: true, upsert: true }
    );

    res.json({ success: true, data: expense });
  } catch (error) {
    console.error('Erreur saveExpense:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.importPdf = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Fichier PDF requis' });
    }
    const { site, month, year } = req.body;
    if (!site || !month || !year) {
      return res.status(400).json({ error: 'Site, mois et année requis' });
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const { dates, amountTTC } = await parseBipGoPdf(req.file.buffer, m, y);

    const tollType = await ResponsableTripType.findOne({ site, isToll: true });
    if (!tollType) {
      return res.json({
        success: true,
        data: { dates, amountTTC, message: 'Dates et montant extraits. Type Péage non trouvé.' }
      });
    }

    const expense = await ResponsableKmExpense.findOne({ site, month: m, year: y });
    const existingEntries = expense ? expense.entries.filter(e => e.tripTypeId.toString() !== tollType._id.toString()) : [];
    const tollEntries = dates.map(day => ({ tripTypeId: tollType._id, day, count: 1 }));

    const update = {
      site,
      month: m,
      year: y,
      entries: [...existingEntries, ...tollEntries],
      tollAmountTTC: amountTTC,
      tollAmountHT: Math.round(amountTTC / 1.2 * 100) / 100,
      pdfImportedDates: dates
    };

    await ResponsableKmExpense.findOneAndUpdate(
      { site, month: m, year: y },
      update,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: { dates, amountTTC, message: `${dates.length} dates importées, montant TTC: ${amountTTC} €` }
    });
  } catch (error) {
    console.error('Erreur importPdf:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTauxKm = async (req, res) => {
  try {
    const { site, year } = req.query;
    if (!site || !year) {
      return res.status(400).json({ error: 'Site et année requis' });
    }
    const taux = await getTauxKm(site, parseInt(year, 10));
    res.json({ success: true, data: { tauxKm: taux } });
  } catch (error) {
    console.error('Erreur getTauxKm:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.saveTauxKm = async (req, res) => {
  try {
    const { site, year, tauxKm } = req.body;
    if (!site || !year || tauxKm === undefined) {
      return res.status(400).json({ error: 'Site, année et tauxKm requis' });
    }
    const name = `tauxKmResponsable_${site}_${year}`;
    const param = await Parameter.findOneAndUpdate(
      { name },
      { name, kmValue: parseFloat(tauxKm) || 0.47, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: { tauxKm: param.kmValue } });
  } catch (error) {
    console.error('Erreur saveTauxKm:', error);
    res.status(500).json({ error: error.message });
  }
};
