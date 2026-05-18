/** Calcul stock théorique côté client (repli si /stocks/flours/status indisponible). */

const MS_PER_DAY = 86400000;

export function daysElapsedSince(date, refDate = new Date()) {
  if (!date) return 0;
  const t0 = new Date(date).getTime();
  if (!Number.isFinite(t0)) return 0;
  return Math.max(0, (refDate.getTime() - t0) / MS_PER_DAY);
}

export function stockToSacks({ unit, sacks, pallets, sacksPerPallet }) {
  const s = Math.max(0, Number(sacks) || 0);
  if (unit === 'pallets_and_sacks') {
    const p = Math.max(0, Number(pallets) || 0);
    const spp = Number(sacksPerPallet) > 0 ? Number(sacksPerPallet) : 50;
    return p * spp + s;
  }
  return s;
}

export function computeTheoreticalStockSacks(physicalStockSacks, dailyConsumption, daysElapsed) {
  const physical = Math.max(0, Number(physicalStockSacks) || 0);
  const daily = Math.max(0, Number(dailyConsumption) || 0);
  const days = Math.max(0, Number(daysElapsed) || 0);
  return Math.max(0, physical - days * daily);
}

function statusFromDaysRemaining(daysRemaining) {
  if (typeof daysRemaining !== 'number' || !Number.isFinite(daysRemaining)) return 'na';
  if (daysRemaining > 10) return 'green';
  if (daysRemaining >= 7) return 'orange';
  return 'red';
}

export function buildFlourStocksStatusClient({
  configs,
  inventory,
  sacksPerPallet = 50,
  countIntervalDays = 5
}) {
  const invById = new Map((inventory?.items || []).map((it) => [String(it.flourConfigId), it]));
  const lastFullCountAt = inventory?.lastFullCountAt || inventory?.lastEntryAt || null;
  const daysSinceFullCount = daysElapsedSince(lastFullCountAt);
  const daysSinceFullCountInt = Math.floor(daysSinceFullCount);
  const interval = Number(countIntervalDays) > 0 ? Math.floor(Number(countIntervalDays)) : 5;
  const physicalCountDue = !lastFullCountAt || daysSinceFullCountInt >= interval;
  const daysUntilCountDue = physicalCountDue ? 0 : Math.max(0, interval - daysSinceFullCountInt);

  const items = (configs || [])
    .filter((c) => c && c.isActive !== false)
    .map((cfg) => {
      const inv = invById.get(String(cfg._id)) || { sacks: 0, pallets: 0 };
      const stockPhysicalSacks = stockToSacks({
        unit: cfg.unit,
        sacks: inv.sacks,
        pallets: inv.pallets,
        sacksPerPallet
      });
      const daily = Math.max(0, Number(cfg.dailyConsumptionSacks || 0));
      const stockTheoreticalSacks = computeTheoreticalStockSacks(
        stockPhysicalSacks,
        daily,
        daysSinceFullCount
      );
      const daysRemaining = daily > 0 ? stockTheoreticalSacks / daily : null;
      return {
        flourConfigId: cfg._id,
        name: cfg.name,
        stockPhysicalSacks,
        stockTheoreticalSacks,
        stockSacksTotal: stockTheoreticalSacks,
        daily,
        daysRemaining,
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
      physicalCountIntervalDays: interval,
      daysSinceFullCount: Math.round(daysSinceFullCount * 10) / 10,
      physicalCountDue,
      daysUntilCountDue
    }
  };
}
