/**
 * Parse les BL Transgourmet (PDF) → JSON catalogue Arras.
 * Usage: node backend/scripts/parse-tgt-pdfs.js
 */
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const PDF_DIR = process.env.TGT_PDF_DIR || 'C:\\Users\\pdoye\\Downloads';
const FILES = ['6.pdf', '5.pdf', '4.pdf', '3.pdf', '2.pdf', '1.pdf'];

/** Format pdf-parse : Frais(000151) BEURRE DOUX80.000Plaquette0.000Plaquette */
const ITEM_RE =
  /(Ambiant|Frais|Surgelé)\((\d{6})\)\s*([\s\S]*?)(\d+\.\d{3})([A-Za-zÀ-ÿ]+)(\d+\.\d{3})([A-Za-zÀ-ÿ]+)/g;

const NON_FOOD_RE =
  /Ambiant non\s*Alimentaire\s*\((\d{6})\)\s*([\s\S]*?)(\d+\.\d{3})([A-Za-zÀ-ÿ]+)(\d+\.\d{3})/gi;

function parseOrderDate(text) {
  const m = text.match(/COMMANDE N°\d+ DU (\d{2}\/\d{2}\/\d{4})/);
  return m ? m[1] : null;
}

function parseOrderNumber(text) {
  const m = text.match(/COMMANDE N°(\d+)/);
  return m ? m[1] : null;
}

function normalizeName(name) {
  return name
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim();
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
    products.push({
      supplierCode: code,
      name,
      temperature: temp,
      unit,
      orderedQty: o,
      deliveredQty: d,
      receivedQty: o
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
      receivedQty: o
    });
  }
  return products;
}

async function main() {
  const byCode = new Map();
  const orders = [];

  for (const file of FILES) {
    const filePath = path.join(PDF_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn('Missing', filePath);
      continue;
    }
    const buf = fs.readFileSync(filePath);
    const data = await pdf(buf);
    const orderDate = parseOrderDate(data.text);
    const orderNumber = parseOrderNumber(data.text);
    const products = parseProductsFromText(data.text);
    orders.push({ file, orderNumber, orderDate, lineCount: products.length });

    for (const p of products) {
      const key = p.supplierCode;
      const existing = byCode.get(key);
      if (!existing) {
        byCode.set(key, { ...p, lastOrderQty: p.orderedQty, lastOrderDate: orderDate, lastOrderNumber: orderNumber });
      } else {
        const aliases = existing.names || [existing.name];
        if (!aliases.includes(p.name)) existing.names = [...aliases, p.name];
        const dNew = orderDate ? orderDate.split('/').reverse().join('') : '';
        const dOld = existing.lastOrderDate ? existing.lastOrderDate.split('/').reverse().join('') : '';
        if (dNew >= dOld) {
          existing.lastOrderQty = p.orderedQty;
          existing.lastOrderDate = orderDate;
          existing.lastOrderNumber = orderNumber;
          existing.name = p.name;
          existing.unit = p.unit;
          existing.temperature = p.temperature;
        }
      }
    }
  }

  const catalog = [...byCode.values()].map((p, idx) => ({
    name: p.name,
    supplierCode: p.supplierCode,
    unit: p.unit,
    temperature: p.temperature,
    lastOrderQty: p.lastOrderQty,
    lastOrderDate: p.lastOrderDate,
    order: idx,
    locationName: mapTemperatureToLocation(p.temperature)
  }));

  const outPath = path.join(__dirname, '../data/tgt-arras-catalog-seed.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), orders, productCount: catalog.length, products: catalog }, null, 2),
    'utf8'
  );
  console.log('Written', outPath, 'products:', catalog.length);
  console.log('Orders parsed:', orders);
}

function mapTemperatureToLocation(temp) {
  if (!temp) return '';
  if (temp.startsWith('Frais')) return 'Étagère prépa';
  if (temp.startsWith('Surgelé')) return 'Étagère réserve';
  if (temp.includes('non')) return 'Étagère réserve';
  return 'Étagère boulanger';
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
