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
    stringValue: '50'
  });
  const n = Number(String(p.stringValue || '').trim());
  return Number.isFinite(n) && n > 0 ? n : 50;
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
    res.json({
      success: true,
      data: inventory || {
        siteKey,
        items: [],
        updatedByName: '',
        updatedByEmail: '',
        urgent: false,
        urgentReason: '',
        lastEntryAt: null
      }
    });
  } catch (error) {
    console.error('❌ getFlourInventory:', error);
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
          pallets
        };
      })
      .filter(Boolean);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune farine valide dans items' });
    }

    // Historique
    const entry = new StockEntry({
      siteKey,
      items: normalizedItems,
      createdByName,
      createdByEmail,
      urgent,
      urgentReason
    });
    await entry.save();

    // Avant / après (pour seuil critique)
    const prevInventory = await StockInventory.findOne({ siteKey });
    const prevByConfigId = new Map(
      (prevInventory?.items || []).map((it) => [String(it.flourConfigId), { sacks: it.sacks, pallets: it.pallets }])
    );

    // Mettre à jour l'inventaire courant (on remplace uniquement les items présents dans la saisie)
    const newItemsMap = new Map((prevInventory?.items || []).map((it) => [String(it.flourConfigId), it]));
    for (const it of normalizedItems) {
      newItemsMap.set(String(it.flourConfigId), {
        flourConfigId: it.flourConfigId,
        sacks: it.sacks,
        pallets: it.pallets,
        updatedAt: new Date()
      });
    }
    const newItems = Array.from(newItemsMap.values());

    const updatedInventory = await StockInventory.findOneAndUpdate(
      { siteKey },
      {
        $set: {
          siteKey,
          items: newItems,
          updatedByName: createdByName,
          updatedByEmail: createdByEmail,
          urgent,
          urgentReason,
          lastEntryAt: new Date()
        }
      },
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

    // Seuil critique: détecter passages au-dessous du seuil (avec anti-spam 48h)
    const crossing = [];
    const now = new Date();
    const spamWindowMs = 48 * 60 * 60 * 1000;

    for (const cfg of configs) {
      const id = String(cfg._id);
      const prev = prevByConfigId.get(id) || { sacks: 0, pallets: 0 };
      const next = newItemsMap.get(id) || { sacks: 0, pallets: 0 };

      const prevSacks = stockToSacks({
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

      const threshold = Math.max(0, Number(cfg.criticalThresholdSacks || 0));
      if (threshold <= 0) continue;

      const crossed = prevSacks > threshold && nextSacks <= threshold;
      const lastAlertAt = cfg.lastCriticalAlertAt ? new Date(cfg.lastCriticalAlertAt) : null;
      const isSpamBlocked = lastAlertAt ? now.getTime() - lastAlertAt.getTime() < spamWindowMs : false;

      if (crossed && !isSpamBlocked) {
        const daily = Math.max(0, Number(cfg.dailyConsumptionSacks || 0));
        const daysRemaining = daily > 0 ? nextSacks / daily : null;
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

    res.json({ success: true, data: { entryId: entry._id, inventory: updatedInventory } });
  } catch (error) {
    console.error('❌ postFlourEntry:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const postOrderProposal = async (req, res) => {
  try {
    const siteKey = parseSiteKey(req.body?.siteKey);
    const weeks = Number(req.body?.weeks || 0);
    if (!siteKey) {
      return res.status(400).json({ success: false, error: 'siteKey requis (lon|plan)' });
    }
    if (!Number.isFinite(weeks) || weeks <= 0 || weeks > 52) {
      return res.status(400).json({ success: false, error: 'weeks invalide (1..52)' });
    }

    await ensureDefaultFlours(siteKey);

    const sacksPerPallet = await getSacksPerPallet(siteKey);
    const configs = await FlourConfig.find({ siteKey, isActive: true }).sort({ order: 1, name: 1 });
    const inventory = await StockInventory.findOne({ siteKey });
    const invByConfigId = new Map((inventory?.items || []).map((it) => [String(it.flourConfigId), it]));

    const days = weeks * 7;
    const proposals = configs
      .map((cfg) => {
        const inv = invByConfigId.get(String(cfg._id)) || { sacks: 0, pallets: 0 };
        const currentSacks = stockToSacks({
          unit: cfg.unit,
          sacks: inv.sacks,
          pallets: inv.pallets,
          sacksPerPallet
        });
        const daily = Math.max(0, Number(cfg.dailyConsumptionSacks || 0));
        const needed = days * daily - currentSacks;
        return {
          flourConfigId: cfg._id,
          name: cfg.name,
          dailyConsumptionSacks: daily,
          currentStockSacks: currentSacks,
          weeks,
          days,
          suggestedOrderSacks: Math.max(0, Math.ceil(needed))
        };
      })
      .filter((x) => x.suggestedOrderSacks > 0);

    res.json({ success: true, data: { siteKey, weeks, days, proposals } });
  } catch (error) {
    console.error('❌ postOrderProposal:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

module.exports = {
  getFlourConfig,
  putFlourConfigBatch,
  getFlourInventory,
  postFlourEntry,
  postOrderProposal
};

