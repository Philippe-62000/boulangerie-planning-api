const pdf = require('pdf-parse');

const ITEM_RE =
  /(Ambiant|Frais|Surgelé)\((\d{6})\)\s*([\s\S]*?)(\d+\.\d{3})([A-Za-zÀ-ÿ]+)(\d+\.\d{3})([A-Za-zÀ-ÿ]+)/g;

const NON_FOOD_RE =
  /Ambiant non\s*Alimentaire\s*\((\d{6})\)\s*([\s\S]*?)(\d+\.\d{3})([A-Za-zÀ-ÿ]+)(\d+\.\d{3})/gi;

function normalizeName(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

function mapTemperatureToLocation(temp) {
  if (!temp) return '';
  if (temp.startsWith('Frais')) return 'Étagère prépa';
  if (temp.startsWith('Surgelé')) return 'Étagère réserve';
  if (temp === 'Hygiène') return 'Étagère réserve';
  return 'Étagère boulanger';
}

/** BL Mill'Ange : « FOND SUCRÉ TARTE D228.000Colis » = diamètre 228 + 0 colis commandés. */
function parseFondSucreTarteD000051(flat) {
  const re =
    /Surgelé\(000051\)\s*FOND SUCRÉ TARTE D(?:(\d{2,3})\.(\d{3})|(\d{2,3})\s+(\d+\.\d{3}))Colis(\d+\.\d{3})Colis/i;
  const m = re.exec(flat);
  if (!m) return null;
  const orderedQty =
    m[2] != null ? parseFloat(`0.${m[2]}`) : parseFloat(m[4]);
  const deliveredQty = parseFloat(m[5]);
  return {
    supplierCode: '000051',
    name: 'FOND SUCRÉ TARTE D',
    temperature: 'Surgelé',
    unit: 'Colis',
    orderedQty,
    deliveredQty,
    receivedQty: orderedQty,
    locationName: mapTemperatureToLocation('Surgelé')
  };
}

function applyMillangeProductFixes(products, flat) {
  const fixed = parseFondSucreTarteD000051(flat);
  if (!fixed) return products;
  const out = products.filter((p) => p.supplierCode !== '000051');
  out.push(fixed);
  return out;
}

function parseProductsFromText(text) {
  const section = text.split('DETAILS DE LIVRAISON')[1] || text;
  const flat = section.replace(/\r\n/g, ' ').replace(/\s+/g, ' ');
  const products = [];

  let m;
  const re = new RegExp(ITEM_RE.source, 'g');
  while ((m = re.exec(flat)) !== null) {
    const [, temp, code, rawName, orderedQty, unit, deliveredQty] = m;
    const name = normalizeName(rawName);
    if (!name || name.length < 2) continue;
    const o = parseFloat(orderedQty);
    const d = parseFloat(deliveredQty);
    // BL TGT : « Non livré » = code interne ; la livraison réelle = quantité COMMANDE
    products.push({
      supplierCode: code,
      name,
      temperature: temp,
      unit,
      orderedQty: o,
      deliveredQty: d,
      receivedQty: o,
      locationName: mapTemperatureToLocation(temp)
    });
  }

  const reNf = new RegExp(NON_FOOD_RE.source, 'gi');
  while ((m = reNf.exec(flat)) !== null) {
    const [, code, rawName, orderedQty, unit, deliveredQty] = m;
    const name = normalizeName(rawName);
    if (!name) continue;
    const o = parseFloat(orderedQty);
    const d = parseFloat(deliveredQty);
    products.push({
      supplierCode: code,
      name,
      temperature: 'Hygiène',
      unit,
      orderedQty: o,
      deliveredQty: d,
      receivedQty: o,
      locationName: mapTemperatureToLocation('Hygiène')
    });
  }
  return applyMillangeProductFixes(products, flat);
}

function parseOrderMeta(text) {
  const orderDate = (text.match(/COMMANDE N°\d+ DU (\d{2}\/\d{2}\/\d{4})/) || [])[1] || null;
  const orderNumber = (text.match(/COMMANDE N°(\d+)/) || [])[1] || null;
  const receptionMatch = text.match(/Réceptionné par :.+le (\d{2}\/\d{2}\/\d{4})/i);
  return { orderNumber, orderDate, receptionDate: receptionMatch ? receptionMatch[1] : null };
}

async function parsePdfBuffer(buffer) {
  const data = await pdf(buffer);
  const meta = parseOrderMeta(data.text);
  const products = parseProductsFromText(data.text);
  return { meta, products, rawLength: data.text?.length || 0 };
}

module.exports = {
  parsePdfBuffer,
  parseProductsFromText,
  mapTemperatureToLocation
};
