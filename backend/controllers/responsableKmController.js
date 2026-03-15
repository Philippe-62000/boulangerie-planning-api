const ResponsableTripType = require('../models/ResponsableTripType');
const ResponsableKmExpense = require('../models/ResponsableKmExpense');
const Parameter = require('../models/Parameters');
const { parseBipGoPdf } = require('../services/bipGoPdfParser');

const DEFAULT_TRIP_TYPES_LONGUENESSE = [
  { name: 'aller-boulangerie', displayName: 'Aller boulangerie', km: 50, order: 0, isBoulangerie: true },
  { name: 'retour-boulangerie', displayName: 'Retour boulangerie', km: 50, order: 1, isBoulangerie: true },
  { name: 'boulangerie-l', displayName: 'Boulangerie L', km: 96, order: 2 },
  { name: 'boulangerie-promocash', displayName: 'Boulangerie L via Promocash', km: 104.3, order: 3 },
  { name: 'tgt-cash', displayName: 'TGT Cash', km: 11.4, order: 4 },
  { name: 'ca-saint-omer', displayName: 'CA Saint Omer', km: 6, order: 5 },
  { name: 'lidl-l', displayName: 'Lidl L', km: 1.8, order: 6 },
  { name: 'auchan-l', displayName: 'Auchan L', km: 5.2, order: 7 },
  { name: 'laverie-saint-omer', displayName: 'Laverie Saint Omer', km: 7.2, order: 8 },
  { name: 'ville-longuenesse', displayName: 'Ville de Longuenesse', km: 2.6, order: 9 },
  { name: 'entrepot-lidl', displayName: 'Entrepot Lidl Tournée', km: 26, order: 10 },
  { name: 'metro-calais', displayName: 'Métro Calais/Boulogne', km: 90, order: 11 },
  { name: 'divers', displayName: 'Divers', km: 0, order: 12 }
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

async function migratePeageToAllerRetour(site) {
  const peageType = await ResponsableTripType.findOne({ site, isToll: true });
  const allerType = await ResponsableTripType.findOne({ site, name: 'aller-boulangerie' });
  const retourType = await ResponsableTripType.findOne({ site, name: 'retour-boulangerie' });
  if (!peageType || allerType || retourType) return;
  const kmBoulangerie = (await getPeageParams(site)).kmBoulangerie;
  const [aller, retour] = await ResponsableTripType.insertMany([
    { name: 'aller-boulangerie', displayName: 'Aller boulangerie', km: kmBoulangerie, site, order: 0, isBoulangerie: true },
    { name: 'retour-boulangerie', displayName: 'Retour boulangerie', km: kmBoulangerie, site, order: 1, isBoulangerie: true }
  ]);
  await ResponsableTripType.updateMany(
    { site, _id: { $nin: [aller._id, retour._id] } },
    [{ $set: { order: { $add: ['$order', 2] } } }]
  );
  const expenses = await ResponsableKmExpense.find({ site });
  for (const exp of expenses) {
    const newEntries = [];
    for (const e of exp.entries) {
      if (e.tripTypeId.toString() !== peageType._id.toString()) {
        newEntries.push(e);
        continue;
      }
      const count = e.count || 1;
      const roundTrips = Math.floor(count / 2);
      const oneWay = count % 2;
      const allerCount = roundTrips + (oneWay > 0 ? 1 : 0);
      const retourCount = roundTrips;
      if (allerCount > 0) newEntries.push({ tripTypeId: aller._id, day: e.day, count: allerCount });
      if (retourCount > 0) newEntries.push({ tripTypeId: retour._id, day: e.day, count: retourCount });
    }
    await ResponsableKmExpense.updateOne({ _id: exp._id }, { $set: { entries: newEntries } });
  }
  await ResponsableTripType.deleteOne({ _id: peageType._id });
}

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

    let types = await ResponsableTripType.find({ site }).sort({ order: 1 });
    if (types.length === 0) {
      await ensureTripTypes(site);
      types = await ResponsableTripType.find({ site }).sort({ order: 1 });
    }
    await migratePeageToAllerRetour(site);
    types = await ResponsableTripType.find({ site }).sort({ order: 1 });

    const [expense, tauxKm, peageParams] = await Promise.all([
      ResponsableKmExpense.findOne({ site, month: m, year: y }),
      getTauxKm(site, y),
      getPeageParams(site)
    ]);

    types = types.map(t => {
      const obj = t.toObject();
      if (t.isBoulangerie) obj.km = peageParams.kmBoulangerie;
      return obj;
    }).filter(t => !t.isToll);

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

async function getPeageParams(site) {
  const [entree, sortie, kmBoul] = await Promise.all([
    Parameter.findOne({ name: `peageEntree_${site}` }),
    Parameter.findOne({ name: `peageSortie_${site}` }),
    Parameter.findOne({ name: `kmBoulangerie_${site}` })
  ]);
  return {
    entreePeage: entree?.stringValue || '',
    sortiePeage: sortie?.stringValue || '',
    kmBoulangerie: kmBoul?.kmValue ?? 50
  };
}

exports.getPeageParams = async (req, res) => {
  try {
    const { site } = req.query;
    if (!site || !['longuenesse', 'arras'].includes(site)) {
      return res.status(400).json({ error: 'Site requis (longuenesse ou arras)' });
    }
    const params = await getPeageParams(site);
    res.json({ success: true, data: params });
  } catch (error) {
    console.error('Erreur getPeageParams:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.savePeageParams = async (req, res) => {
  try {
    const { site, entreePeage, sortiePeage, kmBoulangerie } = req.body;
    if (!site || !['longuenesse', 'arras'].includes(site)) {
      return res.status(400).json({ error: 'Site requis (longuenesse ou arras)' });
    }
    await Promise.all([
      Parameter.findOneAndUpdate(
        { name: `peageEntree_${site}` },
        { name: `peageEntree_${site}`, stringValue: String(entreePeage || '').trim(), updatedAt: new Date() },
        { new: true, upsert: true }
      ),
      Parameter.findOneAndUpdate(
        { name: `peageSortie_${site}` },
        { name: `peageSortie_${site}`, stringValue: String(sortiePeage || '').trim(), updatedAt: new Date() },
        { new: true, upsert: true }
      ),
      Parameter.findOneAndUpdate(
        { name: `kmBoulangerie_${site}` },
        { name: `kmBoulangerie_${site}`, kmValue: parseFloat(kmBoulangerie) || 50, updatedAt: new Date() },
        { new: true, upsert: true }
      )
    ]);
    const km = parseFloat(kmBoulangerie) || 50;
    await ResponsableTripType.updateMany(
      { site, isBoulangerie: true },
      { $set: { km, updatedAt: new Date() } }
    );
    res.json({ success: true, data: { entreePeage: String(entreePeage || '').trim(), sortiePeage: String(sortiePeage || '').trim(), kmBoulangerie: km } });
  } catch (error) {
    console.error('Erreur savePeageParams:', error);
    res.status(500).json({ error: error.message });
  }
};

/** Parse le PDF et retourne les données pour réconciliation (sans importer) */
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

    const peageParams = await getPeageParams(site);
    const result = await parseBipGoPdf(
      req.file.buffer,
      m,
      y,
      peageParams.entreePeage,
      peageParams.sortiePeage
    );

    const allerType = await ResponsableTripType.findOne({ site, name: 'aller-boulangerie' });
    const retourType = await ResponsableTripType.findOne({ site, name: 'retour-boulangerie' });
    if (!allerType || !retourType) {
      return res.json({
        success: true,
        data: {
          ...result,
          message: 'Données extraites. Types Aller/Retour boulangerie non trouvés. Configurez les paramètres.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        allerCount: result.allerCount,
        allerRetourCount: result.allerRetourCount,
        recognizedDays: result.recognizedDays || result.dates?.map(d => ({ day: d, count: 1 })) || [],
        unmatched: result.unmatched,
        totalTTC: result.totalTTC,
        dates: result.dates,
        amountTTC: result.amountTTC,
        allerTypeId: allerType._id.toString(),
        retourTypeId: retourType._id.toString(),
        legacyMode: result.legacyMode,
        message: `${result.allerCount} aller, ${result.allerRetourCount} aller-retour reconnus. ${result.unmatched.length} non reconnus.`
      }
    });
  } catch (error) {
    console.error('Erreur importPdf:', error);
    res.status(500).json({ error: error.message });
  }
};

/** Applique l'import après réconciliation utilisateur */
exports.confirmImportPdf = async (req, res) => {
  try {
    const { site, month, year, tollEntries, tollAmountTTC, refusedUnmatched } = req.body;
    if (!site || !month || !year) {
      return res.status(400).json({ error: 'Site, mois et année requis' });
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const allerType = await ResponsableTripType.findOne({ site, name: 'aller-boulangerie' });
    const retourType = await ResponsableTripType.findOne({ site, name: 'retour-boulangerie' });
    if (!allerType || !retourType) {
      return res.status(400).json({ error: 'Types Aller/Retour boulangerie non trouvés' });
    }

    const entries = [];
    if (Array.isArray(tollEntries)) {
      for (const e of tollEntries) {
        const day = parseInt(e.day, 10);
        const count = parseInt(e.count, 10) || 1;
        const roundTrips = Math.floor(count / 2);
        const oneWay = count % 2;
        const allerCount = roundTrips + (oneWay > 0 ? 1 : 0);
        const retourCount = roundTrips;
        if (allerCount > 0) entries.push({ tripTypeId: allerType._id, day, count: allerCount });
        if (retourCount > 0) entries.push({ tripTypeId: retourType._id, day, count: retourCount });
      }
    }

    const amountTTC = parseFloat(tollAmountTTC) || 0;
    const amountHT = Math.round(amountTTC / 1.2 * 100) / 100;

    const expense = await ResponsableKmExpense.findOne({ site, month: m, year: y });
    const existingEntries = expense
      ? expense.entries.filter(e => {
          const id = e.tripTypeId.toString();
          return id !== allerType._id.toString() && id !== retourType._id.toString();
        })
      : [];

    const update = {
      site,
      month: m,
      year: y,
      entries: [...existingEntries, ...entries],
      tollAmountTTC: amountTTC,
      tollAmountHT: amountHT,
      pdfImportedDates: [...new Set(entries.map(e => e.day))]
    };

    await ResponsableKmExpense.findOneAndUpdate(
      { site, month: m, year: y },
      update,
      { new: true, upsert: true }
    );

    const deducted = Array.isArray(refusedUnmatched)
      ? refusedUnmatched.reduce((s, u) => s + (parseFloat(u.amountTTC) || 0), 0)
      : 0;

    res.json({
      success: true,
      data: {
        message: `Import appliqué. ${entries.length} trajet(s) Aller/Retour.${deducted > 0 ? ` Voyages déduits: ${deducted.toFixed(2)} €` : ''}`
      }
    });
  } catch (error) {
    console.error('Erreur confirmImportPdf:', error);
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

exports.updateTripType = async (req, res) => {
  try {
    const { tripTypeId } = req.params;
    const { displayName, km } = req.body;
    if (!tripTypeId) {
      return res.status(400).json({ error: 'tripTypeId requis' });
    }
    const existing = await ResponsableTripType.findById(tripTypeId);
    if (!existing) return res.status(404).json({ error: 'Type de trajet non trouvé' });

    const update = { updatedAt: new Date() };
    if (displayName !== undefined) update.displayName = String(displayName).trim();
    if (km !== undefined) {
      const v = parseFloat(km);
      if (isNaN(v) || v < 0) return res.status(400).json({ error: 'Km invalide' });
      update.km = v;
      if (existing.isBoulangerie) {
        await Parameter.findOneAndUpdate(
          { name: `kmBoulangerie_${existing.site}` },
          { name: `kmBoulangerie_${existing.site}`, kmValue: v, updatedAt: new Date() },
          { new: true, upsert: true }
        );
        await ResponsableTripType.updateMany(
          { site: existing.site, isBoulangerie: true },
          { $set: { km: v, updatedAt: new Date() } }
        );
      }
    }
    const tripType = await ResponsableTripType.findByIdAndUpdate(tripTypeId, { $set: update }, { new: true });
    res.json({ success: true, data: tripType });
  } catch (error) {
    console.error('Erreur updateTripType:', error);
    res.status(500).json({ error: error.message });
  }
};
