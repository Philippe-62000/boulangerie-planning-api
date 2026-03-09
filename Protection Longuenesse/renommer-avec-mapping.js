/**
 * Renommage par mapping manuel - quand pdf-parse échoue
 * 
 * Créez mapping-YYYYMM.txt avec une ligne par PDF :
 *   numero=NOM
 * Ex: 4=DUCHATEAU
 *      5=LEGRAND
 * 
 * Le numéro est extrait du nom de fichier : Paies_02_26_Orcinus (1)_4.pdf -> 4
 */
const fs = require('fs');
const path = require('path');

const fichierPDF = process.argv[2];
const anneeMois = process.argv[3];  // ex: 202602

if (!fichierPDF || !anneeMois) {
  process.exit(1);
}

// Extraire le numéro du fichier : xxx_4.pdf ou xxx (1)_4.pdf -> 4
const match = fichierPDF.match(/_(\d+)\.pdf$/i);
if (!match) {
  process.exit(1);
}
const numero = match[1];

const mappingPath = path.join(__dirname, `mapping-${anneeMois}.txt`);
if (!fs.existsSync(mappingPath)) {
  process.exit(1);
}

const contenu = fs.readFileSync(mappingPath, 'utf8');
const lignes = contenu.split(/\r?\n/);
for (const ligne of lignes) {
  const m = ligne.trim().match(/^(\d+)\s*=\s*(\S+)$/);
  if (m && m[1] === numero) {
    console.log(m[2].trim());
    process.exit(0);
  }
}
process.exit(1);
