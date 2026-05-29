import {
  computeTheoreticalStockSacks,
  countProductionDaysBetweenAnchors
} from './flourStockStatus';

/** Conversion sacs ↔ kg (poids d'un sac configurable par site). */

export function parseDailySacksValue(v) {
  if (v == null || v === '') return 0;
  const s = String(v).trim();
  const frac = /^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/.exec(s);
  if (frac) {
    const num = Number(String(frac[1]).replace(',', '.'));
    const den = Number(String(frac[2]).replace(',', '.'));
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0) return num / den;
  }
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function parseKgPerSack(value, fallback = 25) {
  const n = Number(String(value ?? '').trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function sacksToKg(sacks, kgPerSack) {
  const s = Math.max(0, Number(sacks) || 0);
  const kg = Number(kgPerSack) > 0 ? Number(kgPerSack) : 25;
  return s * kg;
}

export function kgToSacks(kg, kgPerSack) {
  const k = Math.max(0, Number(kg) || 0);
  const kgPer = Number(kgPerSack) > 0 ? Number(kgPerSack) : 25;
  return k / kgPer;
}

export function formatKg(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return '0';
  const s = n.toFixed(2);
  return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

/** Affiche la conso/j en kg à partir de la valeur stockée en sacs/j. */
export function formatDailyConsumptionKg(dailySacks, kgPerSack) {
  const n = parseDailySacksValue(dailySacks);
  if (!Number.isFinite(n) || n < 0) return '0';

  const eps = 1e-9;
  const kgPer = parseKgPerSack(kgPerSack);
  for (let d = 2; d <= 7; d++) {
    const sackFrac = 1 / d;
    if (Math.abs(n - sackFrac) < eps) {
      return `${formatKg(sackFrac * kgPer)} kg`;
    }
  }

  return `${formatKg(sacksToKg(n, kgPer))} kg`;
}

export function dailyConsumptionKgInputValue(dailySacks, kgPerSack) {
  return formatKg(sacksToKg(parseDailySacksValue(dailySacks), kgPerSack));
}

/** Couleur besoin attente livraison : vert si stock projeté à la livraison > 0, sinon rouge. */
export function projectedDeliveryTone(projectedStockAtDelivery) {
  if (projectedStockAtDelivery == null) return '';
  return Number(projectedStockAtDelivery) > 0 ? 'surplus' : 'deficit';
}

/** Besoin en sacs pour tenir jusqu'à la livraison (repli si l'API ne renvoie pas le champ). */
export function computeNeedUntilDeliverySacks(
  proposal,
  daysUntilDelivery,
  deliveryDateIso,
  siteOpenSunday
) {
  const fromApi = proposal?.needUntilDeliverySacks;
  if (fromApi != null && fromApi !== '') {
    const n = Number(fromApi);
    if (Number.isFinite(n)) return n;
  }
  const prodDaysFromApi = Number(proposal?.productionDaysUntilDelivery);
  const daily = parseDailySacksValue(proposal?.dailyConsumptionSacks);
  const stockNow = Math.max(0, Number(proposal?.currentStockSacks) || 0);
  const openSunday = proposal?.openSunday === true || siteOpenSunday === true;
  if (daily <= 0) return null;

  let prodDays = Number.isFinite(prodDaysFromApi) ? prodDaysFromApi : null;
  if (prodDays == null && deliveryDateIso) {
    prodDays = countProductionDaysBetweenAnchors(new Date(), `${deliveryDateIso}T12:00:00`, openSunday);
  }
  if (prodDays == null) {
    const days = Number(daysUntilDelivery);
    if (!Number.isFinite(days) || days < 0) return null;
    if (days === 0) return 0;
    prodDays = openSunday ? days : Math.round(days * (6 / 7) * 100) / 100;
  }
  if (prodDays <= 0) return 0;
  const deficit = Math.max(0, prodDays * daily - stockNow);
  return Math.round(deficit * 100) / 100;
}

/**
 * Complète la proposition API avec toutes les farines du statut (y compris 0 sac à commander).
 * Utile si l’API filtre encore les lignes à suggestedOrderSacks === 0.
 */
export function mergeOrderProposalsWithAllFlours(orderData, statusItems) {
  if (!orderData) return null;
  const items = Array.isArray(statusItems) ? statusItems : [];
  if (!items.length) return orderData;

  const byId = new Map(
    (Array.isArray(orderData.proposals) ? orderData.proposals : []).map((p) => [
      String(p.flourConfigId),
      p
    ])
  );
  const openSunday = orderData.openSunday === true;
  const deliveryIso = orderData.deliveryDate;

  const proposals = items.map((row) => {
    const existing = byId.get(String(row.flourConfigId));
    if (existing) return existing;

    const currentSacks = row.stockPhysicalSacks ?? row.stockSacksTotal ?? 0;
    const daily = row.daily ?? 0;
    let projectedAtDelivery = null;
    let needUntilDeliverySacks = null;
    if (deliveryIso && daily > 0) {
      const prodDays = countProductionDaysBetweenAnchors(
        new Date(),
        `${deliveryIso}T12:00:00`,
        openSunday
      );
      projectedAtDelivery =
        Math.round(computeTheoreticalStockSacks(currentSacks, daily, prodDays) * 100) / 100;
      needUntilDeliverySacks =
        prodDays > 0 ? Math.round(Math.max(0, prodDays * daily - currentSacks) * 100) / 100 : 0;
    }

    return {
      flourConfigId: row.flourConfigId,
      name: row.name,
      currentStockSacks: currentSacks,
      projectedStockAtDelivery: projectedAtDelivery,
      needUntilDeliverySacks,
      dailyConsumptionSacks: daily,
      weeks: orderData.weeks ?? null,
      days: orderData.days ?? null,
      suggestedOrderSacks: 0,
      openSunday
    };
  });

  return { ...orderData, proposals };
}
