/**
 * Parse un PDF Crisalid « SYNTHESE DE REPARTITION INVENDUS/VENTES »
 * et extrait les lignes des familles boissons / emballages.
 */

const TARGET_CATEGORY_RE =
  /^(BOISSONS\s*33CL|BOISSONS\s*50CL|EAUX|BOISSONS\s*PREMIUM|EAUX\s*AROMATIS|EMBALLAGES)/i;

/** Kookabarra n’est pas commandé chez ce fournisseur (Crisalid / Coca). */
function isIgnoredBeverageName(name) {
  return /kookabarra/i.test(String(name || ''));
}

function normalizeCategoryName(raw) {
  const n = String(raw || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (/BOISSONS\s*33CL/.test(n)) return 'Boissons 33cl';
  if (/BOISSONS\s*50CL/.test(n)) return 'Boissons 50cl';
  if (/BOISSONS\s*PREMIUM/.test(n)) return 'Boissons Premium';
  if (/EAUX\s*AROMATIS/.test(n)) return 'Eaux aromatisées 50cl';
  if (/^EAUX$/.test(n)) return 'Eaux';
  if (/EMBALLAGES/.test(n)) return 'Emballages';
  return n;
}

/** Sépare qty+montant collés (ex. 2754.44 → 27 ventes / 54.44 €). */
function splitQtyAmount(glued) {
  const m = String(glued)
    .replace(',', '.')
    .match(/^(\d+)[.](\d{2})$/);
  if (!m) return null;
  const digits = m[1];
  const cents = m[2];
  if (/^0+$/.test(digits)) return { qty: 0, amount: 0 };
  const candidates = [];
  for (let i = 1; i < digits.length; i++) {
    const qty = parseInt(digits.slice(0, i), 10);
    const amountInt = parseInt(digits.slice(i), 10);
    const amount = amountInt + parseInt(cents, 10) / 100;
    if (!qty) continue;
    const unit = amount / qty;
    if (unit >= 0.05 && unit <= 40) {
      candidates.push({ qty, amount, unit, score: Math.abs(unit - 2) });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.score - b.score);
  return { qty: candidates[0].qty, amount: candidates[0].amount };
}

function parseProductLine(line) {
  const m = String(line).match(
    /^(.*?)(\d+[.,]\d{2})\s*€\s*(\d+)\s+(\d+[.,]\d{2})\s*€\s*(\d+[.,]\d{2})\s*€/
  );
  if (!m) return null;
  const ventes = splitQtyAmount(m[2]);
  if (!ventes) return null;
  const name = m[1].replace(/\s+/g, ' ').trim();
  if (!name || name.length < 2) return null;
  const offerts = parseInt(m[3], 10) || 0;
  const invendus = splitQtyAmount(m[4]);
  return {
    name,
    ventesQty: ventes.qty,
    ventesAmount: ventes.amount,
    offertsQty: offerts,
    invendusQty: invendus ? invendus.qty : 0,
    consumedQty: ventes.qty + offerts
  };
}

/**
 * @param {string} text texte brut pdf-parse
 * @returns {{ categories: Array<{ name: string, code: string, products: Array }> }}
 */
function parseCrisalidInvendusText(text) {
  const normalized = String(text || '').replace(/\r/g, '');
  const headerRe =
    /OffertsInvendus%\(\s*(\d+)\s*\)\s*([A-Z0-9][A-Z0-9 '\-]*?)Ventes/g;
  const headers = [];
  let hm;
  while ((hm = headerRe.exec(normalized))) {
    headers.push({
      code: hm[1],
      name: hm[2].trim(),
      index: hm.index,
      end: hm.index + hm[0].length
    });
  }
  for (const h of headers) {
    const next = headers.find((x) => x.index > h.index);
    h.blockEnd = next ? next.index : normalized.length;
  }

  const byKey = new Map();

  for (const h of headers) {
    if (!TARGET_CATEGORY_RE.test(h.name)) continue;
    const label = normalizeCategoryName(h.name);
    const key = `${h.code}|${label}`;

    const block = normalized.slice(h.end, h.blockEnd);
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const products = [];

    for (const line of lines) {
      if (/^TOTAL/i.test(line)) break;
      if (/^Edité/i.test(line) || /^Page\s+\d+/i.test(line)) continue;
      if (/^Offerts/i.test(line) || /^%/.test(line) || /^Invendus/i.test(line)) continue;
      if (/^\d+$/.test(line)) continue;

      const product = parseProductLine(line);
      if (!product) continue;
      if (isIgnoredBeverageName(product.name)) continue;
      products.push(product);
    }

    if (!products.length) continue;

    if (!byKey.has(key)) {
      byKey.set(key, {
        code: h.code,
        name: label,
        products: [],
        productNames: new Set()
      });
    }
    const cat = byKey.get(key);
    for (const product of products) {
      if (cat.productNames.has(product.name)) continue;
      cat.productNames.add(product.name);
      cat.products.push(product);
    }
  }

  const categories = [...byKey.values()].map(({ code, name, products }) => ({
    code,
    name,
    products
  }));

  return { categories };
}

module.exports = {
  parseCrisalidInvendusText,
  splitQtyAmount,
  parseProductLine,
  normalizeCategoryName,
  isIgnoredBeverageName
};
