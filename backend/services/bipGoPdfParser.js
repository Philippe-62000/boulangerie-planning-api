/**
 * Parse Bip&Go PDF facture autoroute pour extraire les dates et le montant TTC
 */
const pdfParse = require('pdf-parse');

/**
 * Extrait les dates (jours du mois) et le montant TTC depuis un buffer PDF Bip&Go
 * @param {Buffer} buffer - Contenu du fichier PDF
 * @param {number} expectedMonth - Mois attendu (1-12)
 * @param {number} expectedYear - Année attendue
 * @returns {{ dates: number[], amountTTC: number, rawText: string }}
 */
async function parseBipGoPdf(buffer, expectedMonth, expectedYear) {
  const data = await pdfParse(buffer);
  const text = data.text || '';

  const dates = [];
  const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/g;
  let match;

  while ((match = dateRegex.exec(text)) !== null) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month === expectedMonth && year === expectedYear && day >= 1 && day <= 31) {
      if (!dates.includes(day)) {
        dates.push(day);
      }
    }
  }

  dates.sort((a, b) => a - b);

  let amountTTC = 0;
  const amountRegex = /NET\s*A\s*PAYER\s*([\d\s,]+)\s*€/i;
  const amountMatch = text.match(amountRegex);
  if (amountMatch) {
    amountTTC = parseFloat(amountMatch[1].replace(/\s/g, '').replace(',', '.')) || 0;
  }
  if (amountTTC === 0) {
    const altRegex = /([\d\s,]+)\s*€\s*$/m;
    const lines = text.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(/([\d\s,]+)\s*€/);
      if (m) {
        amountTTC = parseFloat(m[1].replace(/\s/g, '').replace(',', '.')) || 0;
        if (amountTTC > 0 && amountTTC < 1000) break;
      }
    }
  }

  return { dates, amountTTC, rawText: text.substring(0, 500) };
}

module.exports = { parseBipGoPdf };
