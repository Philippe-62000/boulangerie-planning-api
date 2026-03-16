const ResponsableTripType = require('../models/ResponsableTripType');
const ResponsableKmExpense = require('../models/ResponsableKmExpense');
const ResponsableDisplacementLog = require('../models/ResponsableDisplacementLog');
const DiversPreset = require('../models/DiversPreset');
const Parameter = require('../models/Parameters');
const { parseBipGoPdf } = require('../services/bipGoPdfParser');
const sftpService = require('../services/sftpService');

const roundEuro = (n) => Math.round((Number(n) || 0) * 100) / 100;

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
    }).filter(t => {
      if (t.isToll) return false;
      if (t.deletedFromMonth && t.deletedFromYear) {
        if (y > t.deletedFromYear) return false;
        if (y === t.deletedFromYear && m >= t.deletedFromMonth) return false;
      }
      return true;
    });

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
          grid[key][e.day] = e.count ?? 1;
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
        tollAmountTTC: roundEuro(expense?.tollAmountTTC ?? 0),
        tollAmountHT: roundEuro(expense?.tollAmountHT ?? 0),
        pdfImportedDates: expense?.pdfImportedDates ?? [],
        tollPdfPath: expense?.tollPdfPath || '',
        diversComments: expense?.diversComments ?? '',
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
    const { site, month, year, grid, tollAmountTTC, tollAmountHT, pdfImportedDates, diversComments } = req.body;
    if (!site || !month || !year) {
      return res.status(400).json({ error: 'Site, mois et année requis' });
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const entries = [];
    if (grid && typeof grid === 'object') {
      for (const [tripTypeId, days] of Object.entries(grid)) {
        if (days && typeof days === 'object') {
          for (const [dayStr, val] of Object.entries(days)) {
            const day = parseInt(dayStr, 10);
            const c = parseFloat(val) || 0;
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
      tollAmountTTC: roundEuro(tollAmountTTC),
      tollAmountHT: roundEuro(tollAmountHT),
      pdfImportedDates: Array.isArray(pdfImportedDates) ? pdfImportedDates.map(d => parseInt(d, 10)).filter(d => d >= 1 && d <= 31) : [],
      diversComments: String(diversComments || '').trim()
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

/** Extrait un libellé lisible d'une entrée/sortie de péage (ex: "25003087A48VOREPPE BARRIERE" → "VOREPPE BARRIERE") */
function extractPeageDisplayName(entry, exit) {
  const clean = (s) => {
    if (!s || typeof s !== 'string') return '';
    return s.replace(/^\d{8}[A-Z0-9]*\s*/, '').replace(/\d+[,.]\d[\d,.\s%]*$/g, '').trim().substring(0, 60);
  };
  const e = clean(entry);
  const s = clean(exit);
  if (e && s) return `${e} → ${s}`;
  return e || s || (entry || '').substring(0, 60);
}

/** Applique l'import après réconciliation utilisateur */
exports.confirmImportPdf = async (req, res) => {
  try {
    let { site, month, year, tollEntries, tollAmountTTC, refusedUnmatched, unmatchedToImport } = req.body;
    if (typeof tollEntries === 'string') tollEntries = JSON.parse(tollEntries || '[]');
    if (typeof refusedUnmatched === 'string') refusedUnmatched = JSON.parse(refusedUnmatched || '[]');
    if (typeof unmatchedToImport === 'string') unmatchedToImport = JSON.parse(unmatchedToImport || '[]');
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

    // Créer une ligne par entrée/sortie non reconnue (non refusée) pour saisie manuelle des km
    const createdRows = [];
    if (Array.isArray(unmatchedToImport) && unmatchedToImport.length > 0) {
      const byKey = {};
      for (const u of unmatchedToImport) {
        const key = `${(u.entry || '').trim()}|${(u.exit || '').trim()}`;
        if (!byKey[key]) byKey[key] = { entry: u.entry, exit: u.exit, days: [] };
        const day = parseInt(u.day, 10);
        if (day >= 1 && day <= 31 && !byKey[key].days.includes(day)) byKey[key].days.push(day);
      }

      const maxOrder = await ResponsableTripType.findOne({ site }).sort({ order: -1 }).select('order').lean();
      let nextOrder = (maxOrder?.order ?? 12) + 1;

      for (const { entry, exit, days } of Object.values(byKey)) {
        const displayName = extractPeageDisplayName(entry, exit);
        if (!displayName) continue;

        const name = `peage-import-${nextOrder}-${Date.now().toString(36)}`;
        await ResponsableTripType.create({
          site,
          name,
          displayName,
          km: 0,
          order: nextOrder++,
          isKmPerDay: true,
          importDays: days.sort((a, b) => a - b),
          importMonth: m,
          importYear: y
        });
        createdRows.push(displayName);
      }
    }

    const amountTTC = roundEuro(tollAmountTTC);
    const amountHT = roundEuro(amountTTC / 1.2);

    const expense = await ResponsableKmExpense.findOne({ site, month: m, year: y });
    const existingEntries = expense
      ? expense.entries.filter(e => {
          const id = e.tripTypeId.toString();
          return id !== allerType._id.toString() && id !== retourType._id.toString();
        })
      : [];

    let tollPdfPath = '';
    if (req.file && req.file.buffer && process.env.SFTP_PASSWORD) {
      try {
        const basePath = process.env.NAS_BASE_PATH || process.env.SFTP_BASE_PATH || '/n8n/uploads/documents';
        const fileName = `facture-${y}-${String(m).padStart(2, '0')}.pdf`;
        const remotePath = `${basePath}/responsable-km/${site}/${fileName}`;
        await sftpService.putBuffer(req.file.buffer, remotePath);
        tollPdfPath = remotePath;
        console.log('✅ Facture péage stockée sur NAS:', remotePath);
      } catch (err) {
        console.error('⚠️ Erreur stockage facture NAS:', err.message);
      }
    }

    const update = {
      site,
      month: m,
      year: y,
      entries: [...existingEntries, ...entries],
      tollAmountTTC: amountTTC,
      tollAmountHT: amountHT,
      pdfImportedDates: [...new Set(entries.map(e => e.day))],
      ...(tollPdfPath && { tollPdfPath })
    };

    await ResponsableKmExpense.findOneAndUpdate(
      { site, month: m, year: y },
      update,
      { new: true, upsert: true }
    );

    const deducted = Array.isArray(refusedUnmatched)
      ? refusedUnmatched.reduce((s, u) => s + (parseFloat(u.amountTTC) || 0), 0)
      : 0;

    let message = `Import appliqué. ${entries.length} trajet(s) Aller/Retour.`;
    if (createdRows.length > 0) {
      message += ` ${createdRows.length} ligne(s) créée(s) pour saisie km : ${createdRows.join(', ')}.`;
    }
    if (deducted > 0) message += ` Voyages déduits: ${deducted.toFixed(2)} €`;

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Erreur confirmImportPdf:', error);
    res.status(500).json({ error: error.message });
  }
};

/** Télécharge la facture PDF péage stockée sur le NAS */
exports.downloadTollPdf = async (req, res) => {
  try {
    const { site, month, year } = req.params;
    if (!site || !['longuenesse', 'arras'].includes(site)) {
      return res.status(400).json({ error: 'Site invalide' });
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const expense = await ResponsableKmExpense.findOne({ site, month: m, year: y });
    if (!expense || !expense.tollPdfPath) {
      return res.status(404).json({ error: 'Facture péage non trouvée' });
    }
    const buffer = await sftpService.downloadFile(expense.tollPdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-peage-${site}-${y}-${String(m).padStart(2, '0')}.pdf"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erreur downloadTollPdf:', error);
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
    if (displayName !== undefined) {
      const trimmed = String(displayName || '').trim();
      if (!trimmed) return res.status(400).json({ error: 'Le nom du déplacement ne peut pas être vide' });
      update.displayName = trimmed;
    }
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

exports.deleteTripType = async (req, res) => {
  try {
    const { tripTypeId } = req.params;
    const month = req.query.month ?? req.body?.month;
    const year = req.query.year ?? req.body?.year;
    if (!tripTypeId) {
      return res.status(400).json({ error: 'tripTypeId requis' });
    }

    const existing = await ResponsableTripType.findById(tripTypeId);
    if (!existing) return res.status(404).json({ error: 'Type de trajet non trouvé' });

    const isPeageImport = (existing.name && existing.name.startsWith('peage-import-')) ||
      (existing.isKmPerDay && (existing.importDays?.length > 0 || existing.importMonth));
    if (!isPeageImport) {
      return res.status(400).json({ error: 'Seules les lignes créées par import péage peuvent être supprimées' });
    }

    const now = new Date();
    const m = (parseInt(month, 10) || now.getMonth() + 1);
    const y = parseInt(year, 10) || now.getFullYear();
    if (m < 1 || m > 12 || y < 2020 || y > 2030) {
      return res.status(400).json({ error: `Mois/année invalides: month=${month}, year=${year}` });
    }

    await ResponsableTripType.findByIdAndUpdate(tripTypeId, {
      deletedFromMonth: m,
      deletedFromYear: y,
      updatedAt: new Date()
    });

    const expensesToUpdate = await ResponsableKmExpense.find({
      site: existing.site,
      $or: [
        { year: { $gt: y } },
        { year: y, month: { $gte: m } }
      ]
    });

    for (const exp of expensesToUpdate) {
      const filtered = exp.entries.filter(e => e.tripTypeId.toString() !== existing._id.toString());
      await ResponsableKmExpense.updateOne({ _id: exp._id }, { $set: { entries: filtered } });
    }

    res.json({ success: true, data: { message: 'Ligne supprimée à partir de ce mois (données passées conservées)' } });
  } catch (error) {
    console.error('Erreur deleteTripType:', error);
    res.status(500).json({ error: error.message });
  }
};

// --- Divers Presets ---
exports.getDiversPresets = async (req, res) => {
  try {
    const { site } = req.query;
    if (!site || !['longuenesse', 'arras'].includes(site)) {
      return res.status(400).json({ error: 'Site requis' });
    }
    const presets = await DiversPreset.find({ site }).sort({ order: 1, name: 1 });
    res.json({ success: true, data: presets });
  } catch (error) {
    console.error('Erreur getDiversPresets:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.saveDiversPreset = async (req, res) => {
  try {
    const { site, name, km, _id } = req.body;
    if (!site || !name) {
      return res.status(400).json({ error: 'Site et nom requis' });
    }
    const update = { site, name: String(name).trim(), updatedAt: new Date() };
    if (km !== undefined) update.km = parseFloat(km) >= 0 ? parseFloat(km) : null;
    const preset = await DiversPreset.findOneAndUpdate(
      _id ? { _id, site } : { site, name: update.name },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: preset });
  } catch (error) {
    console.error('Erreur saveDiversPreset:', error);
    res.status(500).json({ error: error.message });
  }
};

// --- Displacement Log (mobile) ---
exports.logDisplacement = async (req, res) => {
  try {
    const { site, month, year, day, fromTripTypeId, toTripTypeId, diversDetail, diversKm, comment } = req.body;
    if (!site || !toTripTypeId) {
      return res.status(400).json({ error: 'Site et destination (Pour) requis' });
    }
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const d = day || now.getDate();
    const log = await ResponsableDisplacementLog.create({
      site,
      month: m,
      year: y,
      day: d,
      fromTripTypeId: fromTripTypeId || null,
      toTripTypeId,
      diversDetail: String(diversDetail || '').trim(),
      diversKm: diversKm !== undefined && diversKm !== '' ? parseFloat(diversKm) : null,
      comment: String(comment || '').trim()
    });
    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Erreur logDisplacement:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingDisplacements = async (req, res) => {
  try {
    const { site, month, year } = req.query;
    if (!site || !month || !year) {
      return res.status(400).json({ error: 'Site, mois et année requis' });
    }
    const logs = await ResponsableDisplacementLog.find({
      site,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      integrated: false
    }).sort({ day: 1, createdAt: 1 }).populate('fromTripTypeId toTripTypeId', 'displayName name km');
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Erreur getPendingDisplacements:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.integrateDisplacements = async (req, res) => {
  try {
    const { site, month, year } = req.body;
    if (!site || !month || !year) {
      return res.status(400).json({ error: 'Site, mois et année requis' });
    }
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const logs = await ResponsableDisplacementLog.find({
      site,
      month: m,
      year: y,
      integrated: false
    });
    const diversType = await ResponsableTripType.findOne({ site, name: 'divers' });
    let expense = await ResponsableKmExpense.findOne({ site, month: m, year: y });
    const daysInMonth = new Date(y, m, 0).getDate();
    const grid = {};
    const types = await ResponsableTripType.find({ site }).sort({ order: 1 });
    types.forEach(t => {
      grid[t._id.toString()] = {};
      for (let d = 1; d <= daysInMonth; d++) grid[t._id.toString()][d] = 0;
    });
    if (expense) {
      expense.entries.forEach(e => {
        const key = e.tripTypeId.toString();
        if (grid[key] !== undefined) grid[key][e.day] = e.count ?? 1;
      });
    }
    for (const log of logs) {
      const toObj = log.toTripTypeId;
      const toId = (toObj && toObj._id ? toObj._id : log.toTripTypeId).toString();
      if (!grid[toId]) continue;
      const isDivers = (toObj && toObj.name === 'divers') || (diversType && toId === diversType._id.toString());
      const addVal = isDivers ? (log.diversKm || 0) : 1;
      if (addVal > 0) {
        grid[toId][log.day] = (grid[toId][log.day] || 0) + addVal;
      }
      log.integrated = true;
      await log.save();
    }
    const entries = [];
    for (const [tripTypeId, days] of Object.entries(grid)) {
      for (const [dayStr, val] of Object.entries(days)) {
        const day = parseInt(dayStr, 10);
        const c = parseFloat(val) || 0;
        if (day >= 1 && day <= 31 && c > 0) {
          entries.push({ tripTypeId, day, count: c });
        }
      }
    }
    const update = {
      site,
      month: m,
      year: y,
      entries,
      tollAmountTTC: roundEuro(expense?.tollAmountTTC ?? 0),
      tollAmountHT: roundEuro(expense?.tollAmountHT ?? 0),
      pdfImportedDates: expense?.pdfImportedDates ?? [],
      diversComments: expense?.diversComments ?? ''
    };
    await ResponsableKmExpense.findOneAndUpdate(
      { site, month: m, year: y },
      update,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: { integrated: logs.length, message: `${logs.length} déplacement(s) intégré(s)` } });
  } catch (error) {
    console.error('Erreur integrateDisplacements:', error);
    res.status(500).json({ error: error.message });
  }
};
