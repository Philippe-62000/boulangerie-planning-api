/**
 * Seed catalogue Mill'Ange Arras + import des BL PDF (historique Cmd -1…).
 * Usage: node backend/scripts/import-millange-pdfs.js
 * PDFs par défaut : download1.pdf … download4.pdf dans %USERPROFILE%\Downloads
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config');
const {
  seedMillangeCatalogForSite,
  importDeliveryPdfForSite
} = require('../controllers/supplierOrderController');
const { SUPPLIER_MILLANGE } = require('../utils/supplierChannel');

const SITE_KEY = 'plan';
const PDF_DIR = process.env.MILLANGE_PDF_DIR || path.join(process.env.USERPROFILE || '', 'Downloads');
const PDF_FILES = (process.env.MILLANGE_PDF_FILES || 'download1.pdf,download2.pdf,download3.pdf,download4.pdf')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

async function main() {
  await mongoose.connect(config.MONGODB_URI);
  console.log('Connecté à MongoDB');

  const seed = await seedMillangeCatalogForSite(SITE_KEY);
  console.log(`Catalogue Mill'Ange : ${seed.imported} produit(s) (${seed.productCount} dans le seed)`);

  for (const file of PDF_FILES) {
    const full = path.join(PDF_DIR, file);
    if (!fs.existsSync(full)) {
      console.warn(`PDF absent, ignoré : ${full}`);
      continue;
    }
    const buffer = fs.readFileSync(full);
    const { meta } = await importDeliveryPdfForSite(
      SITE_KEY,
      SUPPLIER_MILLANGE,
      buffer,
      path.basename(full)
    );
    console.log(
      `Import ${file} : BL ${meta.orderNumber || '?'} du ${meta.orderDate || '?'} — ${meta.parsedLines} ligne(s), ${meta.matchedLines} matchées`
    );
  }

  await mongoose.disconnect();
  console.log('Terminé.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
