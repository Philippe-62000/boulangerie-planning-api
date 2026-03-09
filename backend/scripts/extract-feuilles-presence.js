/**
 * Extrait la liste des fichiers feuille-presence_page_X.pdf triés par ordre alphabétique des noms
 * Usage: node extract-feuilles-presence.js [chemin-pdf] [chemin-sortie.txt]
 */
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

function parseName(nameStr) {
  const parts = (nameStr || '').trim().split(/\s+/);
  const familyName = parts[0] || '';
  const firstName = parts.slice(1).join(' ') || '';
  return { familyName, firstName };
}

async function extractNamesFromPdf(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  const text = data.text || '';
  const numPages = data.numpages || 0;

  const pages = [];

  // Stratégie 1 : marqueurs "-- X of Y --"
  const pageRegex = /--\s*(\d+)\s+of\s+\d+\s*--/g;
  let match;
  let pageStart = 0;

  while ((match = pageRegex.exec(text)) !== null) {
    const pageNum = parseInt(match[1], 10);
    const pageText = text.substring(pageStart, match.index);
    pageStart = match.index + match[0].length;
    const nameMatch = pageText.match(/SARL\s+ORCINUS\s+([A-Za-zÀ-ÿ\s\-]+?)(?:\s+Heures|\s*$)/i);
    const name = nameMatch ? nameMatch[1].trim() : `Page${pageNum}`;
    const { familyName, firstName } = parseName(name);
    pages.push({ pageNum, name, familyName, firstName });
  }

  // Stratégie 2 : format "Feuille de présence" + "SARL ORCINUS" sans espace avant le nom (ORCINUSCINDY DuchateauHeures)
  if (pages.length === 0 && /Feuille\s+de\s+présence/i.test(text)) {
    const blocks = text.split(/(?=Feuille\s+de\s+présence)/i);
    let pageNum = 0;
    blocks.forEach((block) => {
      const nameMatch = block.match(/SARL\s+ORCINUS([A-Za-zÀ-ÿ]+)\s+([A-Za-zÀ-ÿ\-]+?)(?=Heures)/i);
      if (nameMatch) {
        const word1 = nameMatch[1].trim();
        const word2 = nameMatch[2].trim();
        if (word1.length > 1 && word2.length > 1) {
          pageNum++;
          const name = `${word1} ${word2}`;
          const { familyName, firstName } = parseName(name);
          pages.push({ pageNum, name, familyName, firstName });
        }
      }
    });
  }

  // Stratégie 3 : découpage par "SARL" + société (ORCINUS, Protection, etc.) puis Nom Prénom
  if (pages.length === 0) {
    const sarlBlocks = text.split(/(?=SARL\s+)/i);
    let pageNum = 0;
    sarlBlocks.forEach((block) => {
      const nameMatch = block.match(/SARL\s+(?:[A-Za-zÀ-ÿ\-]+\s+)*?([A-Za-zÀ-ÿ\-]+\s+[A-Za-zÀ-ÿ\-]+)(?=\s+Heures|\s*\n|$)/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (name.length > 2 && !/^(Heures|Présence|Mois|Année|Février|Janvier|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)/i.test(name)) {
          pageNum++;
          const { familyName, firstName } = parseName(name);
          pages.push({ pageNum, name, familyName, firstName });
        }
      }
    });
  }

  // Stratégie 4 : découpage par "Feuille de présence" avec espace avant nom
  if (pages.length === 0 && /Feuille\s+de\s+présence/i.test(text)) {
    const blocks = text.split(/(?=Feuille\s+de\s+présence)/i);
    let pageNum = 0;
    blocks.forEach((block) => {
      const nameMatch = block.match(/(?:SARL|Société)\s+(?:[A-Za-zÀ-ÿ\-]+\s+)*?([A-Za-zÀ-ÿ\-]+\s+[A-Za-zÀ-ÿ\-]+)(?=\s+Heures|\s*\n|$)/i);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (name.length > 2) {
          pageNum++;
          const { familyName, firstName } = parseName(name);
          pages.push({ pageNum, name, familyName, firstName });
        }
      }
    });
  }

  // Stratégie 5 : recherche globale Nom Prénom après ORCINUS ou nom de société
  if (pages.length === 0 && numPages > 0) {
    const nameMatch = text.match(/(?:ORCINUS|Protection|SARL)\s+(?:[A-Za-zÀ-ÿ\-]+\s+)*?([A-Za-zÀ-ÿ\-]+\s+[A-Za-zÀ-ÿ\-]+)(?=\s+Heures|\s*$)/i);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const { familyName, firstName } = parseName(name);
      pages.push({ pageNum: 1, name, familyName, firstName });
    }
  }

  // Stratégie 6 : fallback - pages 1 à N sans tri (texte non extrait ou format inconnu)
  if (pages.length === 0 && numPages > 0) {
    for (let i = 1; i <= numPages; i++) {
      pages.push({ pageNum: i, name: `Page${i}`, familyName: '', firstName: '' });
    }
  }

  return pages;
}

function sortByFamilyName(pages) {
  return pages.sort((a, b) => {
    const cmp = (a.familyName || '').localeCompare(b.familyName || '', 'fr');
    if (cmp !== 0) return cmp;
    return (a.firstName || '').localeCompare(b.firstName || '', 'fr');
  });
}

async function main() {
  const args = process.argv.slice(2);
  const debugMode = args.includes('--debug') || process.env.DEBUG === '1';
  const cleanArgs = args.filter(a => a !== '--debug');
  let pdfPath = cleanArgs[0];
  let outputPath = cleanArgs[1] || 'ordre.txt';

  if (!pdfPath) {
    const cwd = process.cwd();
    const files = fs.readdirSync(cwd).filter(f => f.endsWith('.pdf') && f.includes('feuille-presence'));
    if (files.length === 0) {
      console.error('Usage: node extract-feuilles-presence.js <chemin-pdf> [sortie.txt]');
      console.error('Ou placez le script dans un dossier contenant un PDF feuille-presence*.pdf');
      process.exit(1);
    }
    pdfPath = path.join(cwd, files[0]);
    console.log('PDF trouvé:', pdfPath);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error('Fichier non trouvé:', pdfPath);
    process.exit(1);
  }

  let pages = await extractNamesFromPdf(pdfPath);
  const usedFallback = pages.length > 0 && pages[0].name && pages[0].name.startsWith('Page');

  if (debugMode || usedFallback) {
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(buffer);
    const debugPath = path.join(path.dirname(outputPath), '_debug_pdf.txt');
    fs.writeFileSync(debugPath, `Pages: ${data.numpages}\n\n--- Extrait début (3000 chars) ---\n${(data.text || '').substring(0, 3000)}`, 'utf8');
    console.log('Texte PDF extrait dans', debugPath);
    if (usedFallback) {
      console.log('⚠ Noms non extraits - tri alphabétique impossible. Envoyez _debug_pdf.txt pour adapter le script.');
    }
  }

  const sorted = sortByFamilyName(pages);
  const lines = sorted.map(p => `feuille-presence_page_${String(p.pageNum).padStart(2, '0')}.pdf`);
  const output = lines.join('\n');

  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`Liste sauvegardée dans ${outputPath} (${lines.length} lignes)`);
}

main().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
