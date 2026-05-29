/** Mini-viennoiseries petit déjeuner : 1, 2 ou 3 par formule × nombre de formules. */

function clampMiniCountPerFormula(n) {
  const v = Math.floor(Number(n));
  if (v === 2) return 2;
  if (v === 3) return 3;
  return 1;
}

function normalizeOptionList(options) {
  return (Array.isArray(options) ? options : [])
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);
}

/**
 * @returns {{ ok: boolean, error?: string, totalRequired?: number, perFormula?: number, normalized?: Array<{name:string,quantity:number}> }}
 */
function validateBreakfastMiniViennoiserie({ tierSnap, quantity, miniViennoiserieDetail }) {
  const options = normalizeOptionList(tierSnap?.miniViennoiserieOptions);
  if (options.length === 0) {
    return { ok: true, totalRequired: 0, perFormula: 0, normalized: [] };
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
        error: `Mini-viennoiserie inconnue : « ${rawName} ». Choisissez parmi la liste proposée.`
      };
    }
    sum += q;
    const existing = normalized.find((x) => x.name === match);
    if (existing) existing.quantity += q;
    else normalized.push({ name: match, quantity: q });
  }

  if (sum !== totalRequired) {
    return {
      ok: false,
      error:
        `Répartition des mini-viennoiseries : ${sum} saisi pour ${totalRequired} attendu ` +
        `(${perFormula} par formule × ${qty} formule${qty > 1 ? 's' : ''}).`
    };
  }

  return { ok: true, totalRequired, perFormula, normalized };
}

module.exports = {
  clampMiniCountPerFormula,
  validateBreakfastMiniViennoiserie
};
