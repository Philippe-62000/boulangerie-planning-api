const mongoose = require('mongoose');
const FlourConfig = require('../models/FlourConfig');
const StockInventory = require('../models/StockInventory');
const StockEntry = require('../models/StockEntry');
const Parameter = require('../models/Parameters');
const emailService = require('../services/emailService');

const SITE_LABEL = {
  lon: 'Longuenesse',
  plan: 'Arras'
};

const DEFAULT_FLOURS = [
  { name: 'AMÉLIORANT', unit: 'sacks' },
  { name: 'FARINE BLANCHE', unit: 'pallets_and_sacks' },
  { name: 'FARINE CAMPAGNE', unit: 'sacks' },
  { name: 'FARINE COMPLET T150', unit: 'sacks' },
  { name: 'FARINE GRAINES CHIA', unit: 'sacks', supplierType: 'next_day' },
  { name: 'FARINE GRAINS ANCIENS', unit: 'sacks' },
  { name: 'FARINE LEVAIN LIQUIDE', unit: 'sacks' },
  { name: 'FARINE MAIS', unit: 'sacks' },
  { name: 'MIX PAIN DE MIE', unit: 'sacks', supplierType: 'next_day' },
  { name: 'MIX BRIOCHE', unit: 'sacks', supplierType: 'next_day' },
  { name: 'FARINE PAVE ANGE', unit: 'sacks' },
  { name: 'FARINE SEIGLE', unit: 'sacks' },
  { name: 'FARINE SEMOULE', unit: 'sacks' },
  { name: 'MELANGE GRAINES', unit: 'sacks' }
];

const parseSiteKey = (v) => (v === 'lon' || v === 'plan' ? v : null);

function parseNumberOrFraction(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value ?? '')
    .trim()
    .replace(',', '.')
    // Certains claviers mobiles utilisent un slash "fraction" (U+2044) ou fullwidth (U+FF0F)
    .replace(/[⁄／]/g, '/');
  if (!s) return fallback;
  const fractionMatch = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fractionMatch) {
    const num = Number(fractionMatch[1]);
    const den = Number(fractionMatch[2]);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) return num / den;
    return fallback;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

async function ensureParameter({ name, displayName, stringValue, booleanValue }) {
  const existing = await Parameter.findOne({ name });
  if (existing) return existing;
  const created = new Parameter({
    name,
    displayName: displayName || name,
    kmValue: -1,
    stringValue: typeof stringValue === 'string' ? stringValue : '',
    booleanValue: typeof booleanValue === 'boolean' ? booleanValue : false
  });
  await created.save();
  return created;
}

async function getSacksPerPallet(siteKey) {
  const p = await ensureParameter({
    name: `whiteFlourSacksPerPallet_${siteKey}`,
    displayName: `Farine blanche - sacs par palette (${SITE_LABEL[siteKey] || siteKey})`,
    stringValue: '40'
  });
  const n = Number(String(p.stringValue || '').trim());
  return Number.isFinite(n) && n > 0 ? n : 40;
}

async function getAlertRecipients() {
  const storeEmailParam = await Parameter.findOne({ name: 'storeEmail' });
  const adminEmailParam = await Parameter.findOne({ name: 'adminEmail' });
  const alertStoreParam = await Parameter.findOne({ name: 'alertStore' });
  const alertAdminParam = await Parameter.findOne({ name: 'alertAdmin' });

  const recipientEmails = [];
  if (alertStoreParam?.booleanValue && storeEmailParam?.stringValue) {
    recipientEmails.push(storeEmailParam.stringValue);
  }
  if (alertAdminParam?.booleanValue && adminEmailParam?.stringValue) {
    recipientEmails.push(adminEmailParam.stringValue);
  }
  return recipientEmails;
}

function stockToSacks({ unit, sacks, pallets, sacksPerPallet }) {
  const s = Number(sacks || 0);
  if (unit === 'pallets_and_sacks') {
    const p = Number(pallets || 0);
    return Math.max(0, p) * sacksPerPallet + Math.max(0, s);
  }
  return Math.max(0, s);
}

const MS_PER_DAY = 86400000;
const DEFAULT_PHYSICAL_COUNT_INTERVAL_DAYS = 5;

function startOfCalendarDay(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

/** Jours calendaires entre deux dates (0 = même jour). */
function calendarDaysBetween(startDate, refDate = new Date()) {
  if (!startDate) return 0;
  const a = startOfCalendarDay(startDate);
  const b = startOfCalendarDay(refDate);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / MS_PER_DAY));
}

/** Jours de conso à déduire : 0 le jour de l'inventaire, 1 à partir du lendemain. */
function consumptionDeductionDaysSinceCount(countDate, refDate = new Date()) {
  return Math.max(0, calendarDaysBetween(countDate, refDate) - 1);
}

function roundQty2(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Math.round(Number(n) * 100) / 100;
}

async function getPhysicalCountIntervalDays(siteKey) {
  const p = await ensureParameter({
    name: `flourPhysicalCountIntervalDays_${siteKey}`,
    displayName: `Farines — inventaire physique tous les N jours (${SITE_LABEL[siteKey] || siteKey})`,
    stringValue: String(DEFAULT_PHYSICAL_COUNT_INTERVAL_DAYS)
  });
  const n = Number(String(p.stringValue || '').trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_PHYSICAL_COUNT_INTERVAL_DAYS;
}

function computeTheoreticalStockSacks(physicalStockSacks, dailyConsumption, daysElapsed) {
  const physical = Math.max(0, Number(physicalStockSacks) || 0);
  const daily = Math.max(0, Number(dailyConsumption) || 0);
  const days = Math.max(0, Number(daysElapsed) || 0);
  return Math.max(0, physical - days * daily);
}

function daysRemainingFromStock(stockSacks, dailyConsumption) {
  const daily = Math.max(0, Number(dailyConsumption) || 0);
  if (daily <= 0) return null;
  return Math.max(0, Number(stockSacks) || 0) / daily;
}

function statusFromDaysRemaining(daysRemaining) {
  if (typeof daysRemaining !== 'number' || !Number.isFinite(daysRemaining)) return 'na';
  if (daysRemaining > 10) return 'green';
  if (daysRemaining >= 7) return 'orange';
  return 'red';
}

/** Stock théorique (déduction conso/j) + rappel inventaire physique. */
async function buildFlourStocksStatus(siteKey) {
  await ensureDefaultFlours(siteKey);
  const [configs, inventory, sacksPerPallet, countIntervalDays] = await Promise.all([
    FlourConfig.find({ siteKey, isActive: true }).sort({ order: 1, name: 1 }),
    StockInventory.findOne({ siteKey }),
    getSacksPerPallet(siteKey),
    getPhysicalCountIntervalDays(siteKey)
  ]);

  const invById = new Map((inventory?.items || []).map((it) => [String(it.flourConfigId), it]));
  const lastFullCountAt = inventory?.lastFullCountAt || inventory?.lastEntryAt || null;
  const calendarDaysSinceCount = calendarDaysBetween(lastFullCountAt);
  const deductionDays = consumptionDeductionDaysSinceCount(lastFullCountAt);
  const physicalCountDue = !lastFullCountAt || calendarDaysSinceCount >= countIntervalDays;
  const daysUntilCountDue = physicalCountDue
    ? 0
    : Math.max(0, countIntervalDays - calendarDaysSinceCount);

  const items = configs.map((cfg) => {
    const inv = invById.get(String(cfg._id)) || { sacks: 0, pallets: 0 };
    const stockPhysicalSacks = roundQty2(
      stockToSacks({
        unit: cfg.unit,
        sacks: inv.sacks,
        pallets: inv.pallets,
        sacksPerPallet
      })
    );
    const daily = Math.max(0, Number(cfg.dailyConsumptionSacks || 0));
    const stockTheoreticalSacks = roundQty2(
      computeTheoreticalStockSacks(stockPhysicalSacks, daily, deductionDays)
    );
    const daysRemaining = daysRemainingFromStock(stockTheoreticalSacks, daily);
    return {
      flourConfigId: cfg._id,
      name: cfg.name,
      stockPhysicalSacks,
      stockTheoreticalSacks,
      stockSacksTotal: stockTheoreticalSacks,
      daily,
      daysRemaining: daysRemaining != null ? roundQty2(daysRemaining) : null,
      status: statusFromDaysRemaining(daysRemaining)
    };
  });

  items.sort((a, b) => {
    const ad =
      typeof a.daysRemaining === 'number' && Number.isFinite(a.daysRemaining) ? a.daysRemaining : null;
    const bd =
      typeof b.daysRemaining === 'number' && Number.isFinite(b.daysRemaining) ? b.daysRemaining : null;
    if (ad === null && bd === null) return a.name.localeCompare(b.name, 'fr');
    if (ad === null) return 1;
    if (bd === null) return -1;
    if (ad !== bd) return ad - bd;
    return a.name.localeCompare(b.name, 'fr');
  });

  return {
    items,
    meta: {
      lastEntryAt: inventory?.lastEntryAt || null,
      lastFullCountAt,
      updatedByName: String(inventory?.updatedByName || '').trim(),
      physicalCountIntervalDays: countIntervalDays,
      daysSinceFullCount: calendarDaysSinceCount,
      consumptionDeductionDays: deductionDays,
      physicalCountDue,
      daysUntilCountDue
    }
  };
}

async function ensureDefaultFlours(siteKey) {
  // Ajoute les entrées manquantes sans écraser la config existante
  const existing = await FlourConfig.find({ siteKey }).select('name');
  const existingNames = new Set(existing.map((d) => d.name));
  const missing = DEFAULT_FLOURS.filter((f) => !existingNames.has(f.name));
  if (missing.length === 0) return;

  const baseOrder = existing.length;
  const docs = missing.map((f, idx) => ({
    siteKey,
    name: f.name,
    unit: f.unit,
    supplierType: f.supplierType || 'standard',
    dailyConsumptionSacks: 0,
    criticalThresholdSacks: 0,
    isActive: true,
    order: baseOrder + idx
  }));
  await FlourConfig.insertMany(docs, { ordered: false });
}

const getFlourConfig = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }

    await ensureDefaultFlours(siteKey);
    // Paramètres métier liés aux stocks (créés automatiquement si absents)
    await ensureParameter({
      name: `whiteFlourSacksPerPallet_${siteKey}`,
      displayName: `Farine blanche - sacs par palette (${SITE_LABEL[siteKey] || siteKey})`,
      stringValue: '50'
    });
    await ensureParameter({
      name: `flourDeliveryDays_${siteKey}`,
      displayName: `Farines - jours de livraison (${SITE_LABEL[siteKey] || siteKey})`,
      stringValue: '[]'
    });
    await getPhysicalCountIntervalDays(siteKey);
    const configs = await FlourConfig.find({ siteKey }).sort({ order: 1, name: 1 });

    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('❌ getFlourConfig:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const putFlourConfigBatch = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const items = req.body?.items;
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'items doit être un tableau' });
    }

    await ensureDefaultFlours(siteKey);

    const ops = items
      .filter((x) => x && (x._id || x.id || x.name))
      .map((x) => {
        const id = x._id || x.id;
        const update = {
          dailyConsumptionSacks: Math.max(0, parseNumberOrFraction(x.dailyConsumptionSacks, 0)),
          criticalThresholdSacks: Math.max(0, parseNumberOrFraction(x.criticalThresholdSacks, 0)),
          isActive: typeof x.isActive === 'boolean' ? x.isActive : true,
          order: Number.isFinite(Number(x.order)) ? Number(x.order) : 0
        };
        if (typeof x.name === 'string' && x.name.trim()) update.name = x.name.trim();
        if (x.unit === 'sacks' || x.unit === 'pallets_and_sacks') update.unit = x.unit;
        if (x.supplierType === 'standard' || x.supplierType === 'next_day') update.supplierType = x.supplierType;

        if (id) {
          return {
            updateOne: {
              filter: { _id: id, siteKey },
              update: { $set: update }
            }
          };
        }

        // upsert by (siteKey,name) if id missing
        return {
          updateOne: {
            filter: { siteKey, name: update.name },
            update: { $set: { ...update, siteKey } },
            upsert: true
          }
        };
      });

    if (ops.length > 0) {
      await FlourConfig.bulkWrite(ops, { ordered: false });
    }

    const configs = await FlourConfig.find({ siteKey }).sort({ order: 1, name: 1 });
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('❌ putFlourConfigBatch:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const getFlourInventory = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }

    await ensureDefaultFlours(siteKey);

    const inventory = await StockInventory.findOne({ siteKey });
    const status = await buildFlourStocksStatus(siteKey);
    res.json({
      success: true,
      data: inventory || {
        siteKey,
        items: [],
        updatedByName: '',
        updatedByEmail: '',
        urgent: false,
        urgentReason: '',
        lastEntryAt: null,
        lastFullCountAt: null
      },
      meta: status.meta
    });
  } catch (error) {
    console.error('❌ getFlourInventory:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const getFlourStocksStatus = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }
    const status = await buildFlourStocksStatus(siteKey);
    res.json({ success: true, data: status.items, meta: status.meta });
  } catch (error) {
    console.error('❌ getFlourStocksStatus:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const postFlourEntry = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }

    const createdByName = String(req.body?.createdByName || '').trim();
    const createdByEmail = String(req.body?.createdByEmail || '').trim();
    const urgent = req.body?.urgent === true || req.body?.urgent === 'true' || req.body?.urgent === 'on';
    const urgentReason = String(req.body?.urgentReason || '').trim();

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const updateMode = req.body?.updateMode === 'full' ? 'full' : 'partial';
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'items requis' });
    }

    await ensureDefaultFlours(siteKey);
    const configs = await FlourConfig.find({ siteKey, isActive: true }).sort({ order: 1, name: 1 });
    const configById = new Map(configs.map((c) => [String(c._id), c]));

    const sacksPerPallet = await getSacksPerPallet(siteKey);

    const normalizedItems = items
      .map((it) => {
        const flourConfigId = String(it?.flourConfigId || it?.id || it?._id || '').trim();
        const cfg = configById.get(flourConfigId);
        if (!cfg) return null;
        const sacks = Math.max(0, Number(it?.sacks || 0));
        const pallets = Math.max(0, Number(it?.pallets || 0));
        return {
          flourConfigId: cfg._id,
          sacks,
          pallets,
          touched: it?.touched === true || it?.touched === 'true'
        };
      })
      .filter(Boolean);

    const hasTouchedFlag = normalizedItems.some((it) => it.touched);
    const itemsForInventory =
      updateMode === 'partial' && hasTouchedFlag
        ? normalizedItems.filter((it) => it.touched)
        : normalizedItems;

    if (itemsForInventory.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune farine valide dans items' });
    }

    // Historique
    const entry = new StockEntry({
      siteKey,
      items: itemsForInventory.map(({ flourConfigId, sacks, pallets }) => ({
        flourConfigId,
        sacks,
        pallets
      })),
      createdByName,
      createdByEmail,
      urgent,
      urgentReason,
      updateMode,
      itemsCount: itemsForInventory.length
    });
    await entry.save();

    // Avant / après (pour seuil critique)
    const prevInventory = await StockInventory.findOne({ siteKey });
    const prevByConfigId = new Map(
      (prevInventory?.items || []).map((it) => [String(it.flourConfigId), { sacks: it.sacks, pallets: it.pallets }])
    );

    let newItems;
    if (updateMode === 'full') {
      const sentById = new Map(itemsForInventory.map((it) => [String(it.flourConfigId), it]));
      newItems = configs.map((cfg) => {
        const sent = sentById.get(String(cfg._id));
        return {
          flourConfigId: cfg._id,
          sacks: sent ? sent.sacks : 0,
          pallets: sent ? sent.pallets : 0,
          updatedAt: new Date()
        };
      });
    } else {
      const newItemsMap = new Map((prevInventory?.items || []).map((it) => [String(it.flourConfigId), it]));
      for (const it of itemsForInventory) {
        newItemsMap.set(String(it.flourConfigId), {
          flourConfigId: it.flourConfigId,
          sacks: it.sacks,
          pallets: it.pallets,
          updatedAt: new Date()
        });
      }
      newItems = Array.from(newItemsMap.values());
    }

    const newItemsMap = new Map(newItems.map((it) => [String(it.flourConfigId), it]));

    const inventorySet = {
      siteKey,
      items: newItems,
      updatedByName: createdByName,
      updatedByEmail: createdByEmail,
      urgent,
      urgentReason,
      lastEntryAt: new Date()
    };
    if (updateMode === 'full') {
      inventorySet.lastFullCountAt = new Date();
    }

    const updatedInventory = await StockInventory.findOneAndUpdate(
      { siteKey },
      { $set: inventorySet },
      { upsert: true, new: true }
    );

    // Emails
    const recipients = await getAlertRecipients();
    const siteLabel = SITE_LABEL[siteKey] || siteKey;

    // Urgence: email immédiat
    if (urgent && recipients.length > 0) {
      const subject = `URGENT – Stocks farines (${siteLabel})`;
      const html = `
        <h2>Urgence stocks farines (${siteLabel})</h2>
        <p><strong>Déclaré par:</strong> ${createdByName || '—'} (${createdByEmail || '—'})</p>
        <p><strong>Raison:</strong> ${urgentReason || '—'}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      `;
      const text = `Urgence stocks farines (${siteLabel})\nDéclaré par: ${createdByName || '—'} (${createdByEmail || '—'})\nRaison: ${urgentReason || '—'}\nDate: ${new Date().toLocaleString('fr-FR')}\n`;
      try {
        await emailService.sendEmail(recipients.join(', '), subject, html, text);
      } catch (e) {
        console.error('❌ Email urgence stocks:', e?.message || e);
      }
    }

    // Seuil critique: stock théorique avant saisie vs stock réel après (anti-spam 48h)
    const crossing = [];
    const now = new Date();
    const spamWindowMs = 48 * 60 * 60 * 1000;
    const countAnchor = prevInventory?.lastFullCountAt || prevInventory?.lastEntryAt || null;
    const daysBeforeEntry = consumptionDeductionDaysSinceCount(countAnchor, now);

    for (const cfg of configs) {
      const id = String(cfg._id);
      const prev = prevByConfigId.get(id) || { sacks: 0, pallets: 0 };
      const next = newItemsMap.get(id) || { sacks: 0, pallets: 0 };

      const prevPhysical = stockToSacks({
        unit: cfg.unit,
        sacks: prev.sacks,
        pallets: prev.pallets,
        sacksPerPallet
      });
      const nextSacks = stockToSacks({
        unit: cfg.unit,
        sacks: next.sacks,
        pallets: next.pallets,
        sacksPerPallet
      });
      const daily = Math.max(0, Number(cfg.dailyConsumptionSacks || 0));
      const prevSacks = computeTheoreticalStockSacks(prevPhysical, daily, daysBeforeEntry);

      const threshold = Math.max(0, Number(cfg.criticalThresholdSacks || 0));
      if (threshold <= 0) continue;

      const crossed = prevSacks > threshold && nextSacks <= threshold;
      const lastAlertAt = cfg.lastCriticalAlertAt ? new Date(cfg.lastCriticalAlertAt) : null;
      const isSpamBlocked = lastAlertAt ? now.getTime() - lastAlertAt.getTime() < spamWindowMs : false;

      if (crossed && !isSpamBlocked) {
        const daysRemaining = daysRemainingFromStock(nextSacks, daily);
        crossing.push({
          id,
          name: cfg.name,
          nextSacks,
          threshold,
          daily,
          daysRemaining
        });
      }
    }

    if (crossing.length > 0 && recipients.length > 0) {
      const subject = `Commande farine – seuil critique atteint (${siteLabel})`;
      const rowsHtml = crossing
        .map((x) => {
          const days =
            typeof x.daysRemaining === 'number' && Number.isFinite(x.daysRemaining)
              ? x.daysRemaining.toFixed(1)
              : 'N/A';
          return `<tr><td>${x.name}</td><td style="text-align:right">${x.nextSacks}</td><td style="text-align:right">${x.threshold}</td><td style="text-align:right">${x.daily}</td><td style="text-align:right">${days}</td></tr>`;
        })
        .join('');

      const html = `
        <h2>Seuil critique atteint – Farines (${siteLabel})</h2>
        <p><strong>Date:</strong> ${now.toLocaleString('fr-FR')}</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
          <thead>
            <tr>
              <th>Farine</th>
              <th>Stock (sacs)</th>
              <th>Seuil (sacs)</th>
              <th>Conso/j (sacs)</th>
              <th>Jours restants</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;

      const textRows = crossing
        .map((x) => {
          const days =
            typeof x.daysRemaining === 'number' && Number.isFinite(x.daysRemaining)
              ? x.daysRemaining.toFixed(1)
              : 'N/A';
          return `- ${x.name}: stock=${x.nextSacks} sacs, seuil=${x.threshold}, conso/j=${x.daily}, jours=${days}`;
        })
        .join('\n');
      const text = `Seuil critique atteint – Farines (${siteLabel})\nDate: ${now.toLocaleString('fr-FR')}\n${textRows}\n`;

      try {
        await emailService.sendEmail(recipients.join(', '), subject, html, text);
        // Marquer les configs alertées
        const ids = crossing.map((x) => x.id);
        await FlourConfig.updateMany(
          { _id: { $in: ids } },
          { $set: { lastCriticalAlertAt: now }, $setOnInsert: {} }
        );
      } catch (e) {
        console.error('❌ Email seuil critique:', e?.message || e);
      }
    }

    res.json({
      success: true,
      data: {
        entryId: entry._id,
        inventory: updatedInventory,
        updateMode,
        itemsUpdated: itemsForInventory.length
      }
    });
  } catch (error) {
    console.error('❌ postFlourEntry:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

async function enrichFlourEntryItems(entry, siteKey) {
  const configs = await FlourConfig.find({ siteKey }).select('_id name unit').lean();
  const configById = new Map(configs.map((c) => [String(c._id), c]));
  const sacksPerPallet = await getSacksPerPallet(siteKey);
  return (entry.items || []).map((it) => {
    const cfg = configById.get(String(it.flourConfigId));
    const unit = cfg?.unit || 'sacks';
    const stockSacksTotal = roundQty2(
      stockToSacks({
        unit,
        sacks: it.sacks,
        pallets: it.pallets,
        sacksPerPallet
      })
    );
    return {
      flourConfigId: it.flourConfigId,
      name: cfg?.name || '—',
      unit,
      sacks: it.sacks,
      pallets: it.pallets,
      stockSacksTotal
    };
  });
}

function formatEntrySummary(doc) {
  return {
    _id: doc._id,
    createdAt: doc.createdAt,
    createdByName: doc.createdByName || '',
    createdByEmail: doc.createdByEmail || '',
    updateMode: doc.updateMode === 'full' ? 'full' : 'partial',
    itemsCount: doc.itemsCount ?? (doc.items?.length || 0),
    urgent: !!doc.urgent,
    urgentReason: doc.urgentReason || ''
  };
}

const getFlourEntries = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }

    const limitRaw = Number(req.query.limit);
    const skipRaw = Number(req.query.skip);
    const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 40;
    const skip = Number.isFinite(skipRaw) ? Math.max(0, Math.floor(skipRaw)) : 0;

    const filter = { siteKey };
    const [total, rows] = await Promise.all([
      StockEntry.countDocuments(filter),
      StockEntry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    ]);

    res.json({
      success: true,
      data: rows.map(formatEntrySummary),
      pagination: { total, limit, skip, hasMore: skip + rows.length < total }
    });
  } catch (error) {
    console.error('❌ getFlourEntries:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const getFlourEntryById = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }
    const entryId = String(req.params.entryId || '').trim();
    if (!entryId || !mongoose.Types.ObjectId.isValid(entryId)) {
      return res.status(400).json({ success: false, error: 'entryId invalide' });
    }

    const entry = await StockEntry.findOne({ _id: entryId, siteKey }).lean();
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Envoi introuvable' });
    }

    const items = await enrichFlourEntryItems(entry, siteKey);
    res.json({
      success: true,
      data: {
        ...formatEntrySummary(entry),
        items
      }
    });
  } catch (error) {
    console.error('❌ getFlourEntryById:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const deleteFlourEntry = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.query.siteKey);
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }
    const entryId = String(req.params.entryId || '').trim();
    if (!entryId || !mongoose.Types.ObjectId.isValid(entryId)) {
      return res.status(400).json({ success: false, error: 'entryId invalide' });
    }

    const deleted = await StockEntry.findOneAndDelete({ _id: entryId, siteKey });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Envoi introuvable' });
    }

    res.json({ success: true, data: { entryId } });
  } catch (error) {
    console.error('❌ deleteFlourEntry:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

function buildOrderProposalRow({
  row,
  cfg,
  currentSacks,
  daily,
  days,
  weeks,
  suggestedOrderSacks,
  whitePalletsOrdered,
  sacksPerPallet
}) {
  const isWhiteFlour = cfg?.unit === 'pallets_and_sacks';
  return {
    flourConfigId: row.flourConfigId,
    name: row.name,
    unit: cfg?.unit || 'sacks',
    isWhiteFlour,
    dailyConsumptionSacks: daily,
    currentStockSacks: currentSacks,
    weeks: weeks != null ? roundQty2(weeks) : null,
    days: roundQty2(days),
    whitePalletsOrdered: isWhiteFlour && whitePalletsOrdered != null ? whitePalletsOrdered : null,
    sacksPerPallet: isWhiteFlour ? sacksPerPallet : null,
    suggestedOrderSacks: Math.max(0, Math.ceil(suggestedOrderSacks))
  };
}

const postOrderProposal = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    // Compat: certains clients anciens n'envoient pas `mode` (ou l'envoient mal).
    // Si `whitePallets` est fourni sans `weeks`, on force le mode palettes.
    const hasWeeks = req.body?.weeks !== undefined && req.body?.weeks !== null && String(req.body?.weeks).trim() !== '';
    const hasWhitePallets =
      req.body?.whitePallets !== undefined && req.body?.whitePallets !== null && String(req.body?.whitePallets).trim() !== '';
    const mode = req.body?.mode === 'palettes' || (!hasWeeks && hasWhitePallets) ? 'palettes' : 'weeks';
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }

    await ensureDefaultFlours(siteKey);

    const [status, configs, sacksPerPallet] = await Promise.all([
      buildFlourStocksStatus(siteKey),
      FlourConfig.find({ siteKey, isActive: true }).sort({ order: 1, name: 1 }),
      getSacksPerPallet(siteKey)
    ]);
    const configById = new Map(configs.map((c) => [String(c._id), c]));

    const stockPhysicalById = new Map(
      status.items.map((it) => [String(it.flourConfigId), it.stockPhysicalSacks])
    );

    if (mode === 'weeks') {
      const weeks = Number(req.body?.weeks || 0);
      if (!Number.isFinite(weeks) || weeks <= 0 || weeks > 52) {
        return res.status(400).json({ success: false, error: 'weeks invalide (1..52)' });
      }

      const days = weeks * 7;
      const proposals = status.items
        .map((row) => {
          const cfg = configById.get(String(row.flourConfigId));
          const currentSacks =
            stockPhysicalById.get(String(row.flourConfigId)) ?? row.stockPhysicalSacks ?? 0;
          const daily = row.daily;
          const needed = days * daily - currentSacks;
          return buildOrderProposalRow({
            row,
            cfg,
            currentSacks,
            daily,
            days,
            weeks,
            suggestedOrderSacks: needed
          });
        })
        .filter((x) => x.suggestedOrderSacks > 0);

      return res.json({
        success: true,
        data: {
          siteKey,
          mode: 'weeks',
          weeks,
          days,
          sacksPerPallet,
          proposals,
          stockMeta: status.meta
        }
      });
    }

    const whitePallets = Number(req.body?.whitePallets || 0);
    if (!Number.isFinite(whitePallets) || whitePallets <= 0 || whitePallets > 200) {
      return res.status(400).json({ success: false, error: 'whitePallets invalide (1..200)' });
    }

    const whiteCfg = configs.find((c) => c.unit === 'pallets_and_sacks');
    if (!whiteCfg) {
      return res.status(400).json({ success: false, error: 'Farine blanche introuvable pour ce site' });
    }

    const whiteRow = status.items.find((it) => String(it.flourConfigId) === String(whiteCfg._id));
    const whiteDaily = whiteRow?.daily ?? Number(whiteCfg.dailyConsumptionSacks || 0);
    if (whiteDaily <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Consommation journalière de la farine blanche non renseignée'
      });
    }

    const whiteOrderSacks = whitePallets * sacksPerPallet;
    const days = whiteOrderSacks / whiteDaily;
    const equivalentWeeks = days / 7;

    const proposals = status.items
      .map((row) => {
        const cfg = configById.get(String(row.flourConfigId));
        const currentSacks =
          stockPhysicalById.get(String(row.flourConfigId)) ?? row.stockPhysicalSacks ?? 0;
        const daily = row.daily;
        const isWhite = cfg?.unit === 'pallets_and_sacks';
        const suggestedOrderSacks = isWhite ? whiteOrderSacks : days * daily - currentSacks;
        return buildOrderProposalRow({
          row,
          cfg,
          currentSacks,
          daily,
          days,
          weeks: equivalentWeeks,
          suggestedOrderSacks,
          whitePalletsOrdered: isWhite ? whitePallets : null,
          sacksPerPallet
        });
      })
      .filter((x) => x.suggestedOrderSacks > 0);

    return res.json({
      success: true,
      data: {
        siteKey,
        mode: 'palettes',
        whitePallets,
        whiteOrderSacks,
        sacksPerPallet,
        days: roundQty2(days),
        equivalentWeeks: roundQty2(equivalentWeeks),
        proposals,
        stockMeta: status.meta
      }
    });
  } catch (error) {
    console.error('❌ postOrderProposal:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

module.exports = {
  getFlourConfig,
  putFlourConfigBatch,
  getFlourInventory,
  getFlourStocksStatus,
  getFlourEntries,
  getFlourEntryById,
  deleteFlourEntry,
  postFlourEntry,
  postOrderProposal
};

