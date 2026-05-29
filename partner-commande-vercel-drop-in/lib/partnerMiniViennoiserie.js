/** Copie utilisable côté Vercel (site entreprise) — alignée sur backend/utils/partnerMiniViennoiserie.js */

export function clampMiniCountPerFormula(n) {
  const v = Math.floor(Number(n));
  if (v === 2) return 2;
  if (v === 3) return 3;
  return 1;
}

export function computeMiniViennoiserieTotal(tierSnap, quantity) {
  const options = (tierSnap?.miniViennoiserieOptions || []).filter((s) => String(s).trim());
  if (options.length === 0) return 0;
  const perFormula = clampMiniCountPerFormula(tierSnap?.miniViennoiserieCountPerFormula ?? 1);
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  return perFormula * qty;
}

export function validateBreakfastMiniViennoiserie({ tierSnap, quantity, miniViennoiserieDetail }) {
  const options = (Array.isArray(tierSnap?.miniViennoiserieOptions) ? tierSnap.miniViennoiserieOptions : [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (options.length === 0) {
    return { ok: true, totalRequired: 0, perFormula: 0, normalized: [], remaining: 0 };
  }

  const perFormula = clampMiniCountPerFormula(tierSnap?.miniViennoiserieCountPerFormula ?? 1);
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const totalRequired = perFormula * qty;

  const detail = Array.isArray(miniViennoiserieDetail) ? miniViennoiserieDetail : [];
  const normalized = [];
  let sum = 0;

  for (const row of detail) {
    const rawName = String(row?.name ?? '').trim();
    const q = Math.floor(Number(row?.quantity) || 0);
    if (q <= 0) continue;
    const match = options.find((o) => o.toLowerCase() === rawName.toLowerCase());
    if (!match) {
      return {
        ok: false,
        error: `Mini-viennoiserie inconnue : « ${rawName} ».`,
        totalRequired,
        remaining: Math.max(0, totalRequired - sum)
      };
    }
    sum += q;
    const existing = normalized.find((x) => x.name === match);
    if (existing) existing.quantity += q;
    else normalized.push({ name: match, quantity: q });
  }

  const remaining = totalRequired - sum;
  if (sum !== totalRequired) {
    return {
      ok: false,
      error:
        `Il reste ${remaining} mini-viennoiserie${remaining > 1 ? 's' : ''} à répartir ` +
        `(${sum} / ${totalRequired} — ${perFormula} par formule × ${qty} formule${qty > 1 ? 's' : ''}).`,
      totalRequired,
      remaining,
      normalized
    };
  }

  return { ok: true, totalRequired, perFormula, normalized, remaining: 0 };
}
