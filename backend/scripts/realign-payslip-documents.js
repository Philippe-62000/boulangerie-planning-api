/**
 * Une passe en base pour les fiches de paie importées ou enregistrées avec une catégorie autre que « payslip » :
 * remet category=payslip, expiryDate=null, isActive=true.
 *
 * Usage : MONGODB_URI="..." node backend/scripts/realign-payslip-documents.js
 */
const mongoose = require('mongoose');
const Document = require('../models/Document');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/boulangerie-planning';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  const personal = await Document.find({ type: 'personal' });
  let updated = 0;

  for (const doc of personal) {
    if (!doc.isPayslipLike()) continue;
    const needsFix =
      doc.category !== 'payslip' ||
      doc.expiryDate != null ||
      doc.isActive === false;

    if (!needsFix) continue;

    doc.category = 'payslip';
    doc.expiryDate = null;
    doc.isActive = true;
    await doc.save();
    updated++;
    console.log(`  → ${doc.title} (${doc.fileName})`);
  }

  console.log(`\n✅ ${updated} document(s) réaligné(s) sur le modèle fiche de paie`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
