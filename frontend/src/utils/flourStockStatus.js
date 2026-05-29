/** Calcul stock théorique côté client (repli si /stocks/flours/status indisponible). */

const MS_PER_DAY = 86400000;

function startOfCalendarDay(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

export function calendarDaysBetween(startDate, refDate = new Date()) {
  if (!startDate) return 0;
  const a = startOfCalendarDay(startDate);
  const b = startOfCalendarDay(refDate);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / MS_PER_DAY));
}

/** 0 le jour de l'inventaire, 1 à partir du lendemain. */
export function consumptionDeductionDaysSinceCount(countDate, refDate = new Date()) {
  return Math.max(0, calendarDaysBetween(countDate, refDate) - 1);
}

export function isProductionDay(date, openSunday) {
  return openSunday === true || date.getDay() !== 0;
}

export function countProductionDaysBetweenAnchors(startDate, endDate, openSunday, refDate = new Date()) {
  const anchor = startDate ? startOfCalendarDay(startDate) : startOfCalendarDay(refDate);
  const end = startOfCalendarDay(endDate);
  if (end <= anchor) return 0;
  let count = 0;
  for (let t = anchor.getTime() + MS_PER_DAY; t <= end.getTime(); t += MS_PER_DAY) {
    if (isProductionDay(new Date(t), openSunday)) count += 1;
  }
  return count;
}

/** Ancrage déduction : saisie partielle récente (item.updatedAt) ou dernier inventaire complet. */
export function flourCountAnchorForDeduction(invItem, lastFullCountAt, lastEntryAt) {
  const globalAnchor = lastFullCountAt || lastEntryAt || null;
  const itemUpdated = invItem?.updatedAt ? new Date(invItem.updatedAt) : null;
  if (!itemUpdated) return globalAnchor;
  if (!globalAnchor) return itemUpdated;
  return itemUpdated.getTime() > new Date(globalAnchor).getTime() ? itemUpdated : new Date(globalAnchor);
}

export function roundQty2(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Math.round(Number(n) * 100) / 100;
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

export function computeTheoreticalStockSacks(physicalStockSacks, dailyConsumption, deductionDays) {
  const physical = Math.max(0, Number(physicalStockSacks) || 0);
  const daily = Math.max(0, Number(dailyConsumption) || 0);
  const days = Math.max(0, Number(deductionDays) || 0);
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
  countIntervalDays = 5,
  openSunday = false
}) {
  const invById = new Map((inventory?.items || []).map((it) => [String(it.flourConfigId), it]));
  const lastFullCountAt = inventory?.lastFullCountAt || inventory?.lastEntryAt || null;
  const calendarDaysSinceCount = calendarDaysBetween(lastFullCountAt);
  const deductionDays = consumptionDeductionDaysSinceCount(lastFullCountAt);
  const interval = Number(countIntervalDays) > 0 ? Math.floor(Number(countIntervalDays)) : 5;
  const physicalCountDue = !lastFullCountAt || calendarDaysSinceCount >= interval;
  const daysUntilCountDue = physicalCountDue ? 0 : Math.max(0, interval - calendarDaysSinceCount);

  const items = (configs || [])
    .filter((c) => c && c.isActive !== false)
    .map((cfg) => {
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
      const countAnchor = flourCountAnchorForDeduction(inv, lastFullCountAt, inventory?.lastEntryAt);
      const itemDeductionDays = countProductionDaysBetweenAnchors(countAnchor, new Date(), openSunday);
      const stockTheoreticalSacks = roundQty2(
        computeTheoreticalStockSacks(stockPhysicalSacks, daily, itemDeductionDays)
      );
      const daysRemaining = daily > 0 ? stockTheoreticalSacks / daily : null;
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
      physicalCountIntervalDays: interval,
      daysSinceFullCount: calendarDaysSinceCount,
      consumptionDeductionDays: deductionDays,
      physicalCountDue,
      daysUntilCountDue,
      openSunday: openSunday === true
    }
  };
}
