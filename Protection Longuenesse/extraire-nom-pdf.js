const fs = require('fs');
const path = require('path');

function trouverPdfParse() {
  try {
    return require('pdf-parse');
  } catch (_) {
    /* continue */
  }
  const scriptDir = __dirname;
  const currentDir = process.cwd();
  const cheminsPossibles = [
    path.resolve(scriptDir, '..', 'backend', 'node_modules', 'pdf-parse'),
    path.resolve(currentDir, '..', 'backend', 'node_modules', 'pdf-parse'),
    path.resolve(scriptDir, 'backend', 'node_modules', 'pdf-parse'),
    path.resolve(currentDir, 'backend', 'node_modules', 'pdf-parse'),
    path.resolve(scriptDir, '..', '..', 'backend', 'node_modules', 'pdf-parse'),
  ];
  for (const chemin of cheminsPossibles) {
    try {
      if (fs.existsSync(path.join(chemin, 'package.json'))) {
        return require(chemin);
      }
    } catch (_) {
      /* continue */
    }
  }
  return null;
}

const pdfParse = trouverPdfParse();

function normalizeAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function estAdresseOuNonNom(mot) {
  if (!mot || mot.length < 2) return true;
  if (/\d/.test(mot)) return true;
  if (mot.length > 12 && mot === mot.toUpperCase()) return true;
  const motsAdresse = ['RUE', 'ROUTE', 'AVENUE', 'PLACE', 'ALLEE', 'CHEMIN', 'IMPASSE', 'BOULEVARD', 'BD', 'SQUARE', 'COURS', 'QUAI', 'PASSAGE'];
  const motUpper = mot.toUpperCase();
  for (const m of motsAdresse) {
    if (motUpper.includes(m)) return true;
  }
  return false;
}

function validerNom(nomComplet) {
  if (!nomComplet) return null;
  const parties = nomComplet.split(/\s+/);
  for (const p of parties) {
    if (estAdresseOuNonNom(p)) return null;
  }
  return nomComplet;
}

function extraireNom(texte) {
  if (!texte || texte.trim().length === 0) return null;

  const lignes = texte.split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\d+$/.test(l));

  const texteRecherche = lignes.slice(0, 50);

  for (const ligne of texteRecherche) {
    const match1 = ligne.match(/^(?:Monsieur|Madame|M\.|Mme|Mlle)\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ\s\-']{2,})$/i);
    if (match1 && match1[1] && match1[2]) {
      const prenom = match1[1].trim();
      const nom = match1[2].trim();
      if (nom.length > 2 && nom !== 'SALAIRE' && prenom.length > 2) {
        const res = validerNom(`${nom} ${prenom}`);
        if (res) return res;
      }
    }

    const match2 = ligne.match(/(?:Monsieur|Madame|M\.|Mme|Mlle)\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ]{2,})/i);
    if (match2 && match2[1] && match2[2]) {
      const prenom = match2[1].trim();
      const nom = match2[2].trim();
      if (nom.length > 2 && nom !== 'SALAIRE' && !nom.includes('SALAIRE') && prenom.length > 2 && !prenom.includes('DE')) {
        const res = validerNom(`${nom} ${prenom}`);
        if (res) return res;
      }
    }
  }

  for (const ligne of texteRecherche) {
    const mots = ligne.split(/\s+/).filter((m) => m.length > 1);
    if (mots.length >= 2 && mots.length <= 4) {
      const dernierMot = mots[mots.length - 1];
      const avantDernierMot = mots[mots.length - 2];
      if (dernierMot === dernierMot.toUpperCase() && dernierMot.length > 2 &&
          avantDernierMot && avantDernierMot[0] === avantDernierMot[0].toUpperCase()) {
        if (dernierMot !== 'SALAIRE' && !dernierMot.includes('SALAIRE') &&
            avantDernierMot !== 'DE' && !avantDernierMot.includes('DE')) {
          const res = validerNom(`${dernierMot} ${avantDernierMot}`);
          if (res) return res;
        }
      }
    }
  }

  return null;
}

function chargerNomsDepuisMotsDePasse(cheminFichier) {
  if (!cheminFichier || !fs.existsSync(cheminFichier)) return [];
  const contenu = fs.readFileSync(cheminFichier, 'utf8');
  const noms = [];
  const regex = /set\s+"pwd_([A-Za-zÀ-ÿ\-_]+)=/g;
  let m;
  while ((m = regex.exec(contenu)) !== null) {
    const nom = m[1].trim();
    if (nom && nom !== 'TEST') noms.push(nom);
  }
  // Homonymes NOM_PRENOM puis noms longs d'abord
  noms.sort((a, b) => {
    const ac = a.includes('_') ? 1 : 0;
    const bc = b.includes('_') ? 1 : 0;
    if (bc !== ac) return bc - ac;
    return b.length - a.length;
  });
  return noms;
}

// Prénoms connus Longuenesse → NOM (utile quand le PDF colle tout sans espaces)
const PRENOM_VERS_NOM = {
  CINDY: 'DUCHATEAU',
  CLARA: 'LEGRAND',
  GEOFFREY: 'GOSSE',
  GEOFFROY: 'GOSSE',
  JAMIE: 'GREBERT',
  JUSTINE: 'CASTIER',
  LUDIVINE: 'DERMENGHEM',
  MAELYS: 'BOGAERT',
  MAEVA: 'HENON',
  MARINA: 'MOLAND',
  MELODIE: 'MANTEL',
  NOAH: 'LECHERF',
  ROMANE: 'FORET',
  VICTOR: 'MERCIER',
  // "Phi" / Philippe côté boulangerie
  PHILIPPE: 'PHI',
  // Lots comptables (peuvent etre absents de Filmara)
  // prenoms a completer si besoin
};

function trouverNomParListe(texte, listeNoms) {
  if (!texte || !listeNoms || listeNoms.length === 0) return null;
  const texteNorm = normalizeAccents(texte).replace(/[^A-Z0-9]/g, '');
  const listeSet = new Set(listeNoms.map((n) => normalizeAccents(n)));

  // 1) Homonymes pwd_NOM_PRENOM puis noms de famille (clés déjà triées)
  for (const key of listeNoms) {
    const keyNorm = normalizeAccents(key);
    const parts = keyNorm.split('_').filter(Boolean);

    if (parts.length >= 2) {
      const lastName = parts[0];
      const firstName = parts.slice(1).join('');
      if (
        lastName.length >= 2 &&
        firstName.length >= 2 &&
        texteNorm.includes(lastName) &&
        texteNorm.includes(firstName)
      ) {
        return key;
      }
      continue;
    }

    // Ignorer pwd_NOM s'il existe des pwd_NOM_PRENOM (homonymes)
    if (listeNoms.some((n) => normalizeAccents(n).startsWith(`${keyNorm}_`))) {
      continue;
    }

    if (keyNorm.length < 3) {
      if (/(?:MADAME|MONSIEUR|MLLE|MATRICULE)[A-Z0-9]*PHI/.test(texteNorm)) return key;
      if (/(?:^|[^A-Z])PHI(?:$|[^A-Z])/.test(texteNorm)) return key;
      continue;
    }
    if (texteNorm.includes(keyNorm)) return key;
  }

  // 2) Prénom connu → nom (si le nom de famille est illisible / en image)
  for (const [prenom, nom] of Object.entries(PRENOM_VERS_NOM)) {
    if (!listeSet.has(normalizeAccents(nom))) continue;
    if (texteNorm.includes(prenom)) return nom;
  }

  return null;
}

async function extraireTextePdfParse(dataBuffer, debug) {
  if (!pdfParse) {
    if (debug) console.error('DEBUG: pdf-parse introuvable');
    return '';
  }
  try {
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text || '';
  } catch (error) {
    if (debug) console.error('DEBUG: Erreur pdf-parse:', error.message);
    return '';
  }
}

async function extraireTextePdfJs(dataBuffer, debug) {
  const cheminsPdfJs = [
    path.resolve(__dirname, '..', 'backend', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs'),
    path.resolve(__dirname, '..', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs'),
  ];
  let pdfjsLib = null;
  for (const c of cheminsPdfJs) {
    try {
      if (fs.existsSync(c)) {
        pdfjsLib = require(c);
        break;
      }
    } catch (_) {
      /* continue */
    }
  }
  if (!pdfjsLib) {
    try {
      pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
    } catch (_) {
      if (debug) console.error('DEBUG: pdfjs-dist indisponible');
      return '';
    }
  }
  try {
    const data = new Uint8Array(dataBuffer);
    const doc = await pdfjsLib.getDocument({ data, stopAtErrors: false }).promise;
    let text = '';
    const maxPages = Math.min(doc.numPages || 1, 3);
    for (let i = 1; i <= maxPages; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += `${(content.items || []).map((it) => (it && typeof it.str === 'string' ? it.str : '')).join(' ')}\n`;
    }
    return text;
  } catch (error) {
    if (debug) console.error('DEBUG: Erreur pdfjs:', error.message);
    return '';
  }
}

async function extraireNomDuPDF(fichierPDF, cheminMotsDePasse, debug) {
  try {
    const dataBuffer = fs.readFileSync(fichierPDF);
    let texte = await extraireTextePdfParse(dataBuffer, debug);
    if (!texte || texte.trim().length < 20) {
      if (debug) console.error('DEBUG: Texte pdf-parse insuffisant, fallback pdfjs');
      const texte2 = await extraireTextePdfJs(dataBuffer, debug);
      if (texte2 && texte2.trim().length > (texte || '').trim().length) texte = texte2;
    }

    if (debug) {
      console.error(`DEBUG: Texte extrait: ${texte ? `${texte.length} caracteres` : 'VIDE'}`);
      if (texte) console.error(`DEBUG: Apercu: ${texte.slice(0, 240).replace(/\s+/g, ' ')}`);
    }

    if (cheminMotsDePasse) {
      const listeNoms = chargerNomsDepuisMotsDePasse(cheminMotsDePasse);
      if (debug) console.error(`DEBUG: Noms charges (${listeNoms.length}): ${listeNoms.join(', ')}`);
      if (listeNoms.length > 0) {
        const nomTrouve = trouverNomParListe(texte, listeNoms);
        if (nomTrouve) {
          if (debug) console.error(`DEBUG: Nom trouve: ${nomTrouve}`);
          console.log(nomTrouve);
          return nomTrouve;
        }
        if (debug) {
          const texteNorm = normalizeAccents(texte).replace(/[^A-Z0-9]/g, '');
          const presents = listeNoms.filter((n) => texteNorm.includes(normalizeAccents(n)));
          console.error('DEBUG: Aucun nom de la liste trouve dans le PDF');
          console.error(`DEBUG: Sous-chaines nom detectees: ${presents.join(', ') || '(aucune)'}`);
          console.error('DEBUG: Ouvrez le PDF et completez mapping-AAAAMM.txt (ex: 4=LECHERF)');
        }
        return null;
      }
    }

    const nom = extraireNom(texte);
    if (nom) {
      // Si format "NOM Prenom", ne garder que le NOM (compat renommage)
      const parties = nom.trim().split(/\s+/);
      const candidat = parties.find((p) => p === p.toUpperCase() && p.length > 2) || parties[0];
      console.log(candidat);
      return candidat;
    }

    return null;
  } catch (error) {
    if (debug) console.error('DEBUG: Erreur:', error.message);
    return null;
  }
}

if (require.main === module) {
  const fichierPDF = process.argv[2];
  let cheminMotsDePasse = process.argv[3];
  if (!cheminMotsDePasse) cheminMotsDePasse = path.join(__dirname, 'mots_de_passe.bat');
  else if (!path.isAbsolute(cheminMotsDePasse) && !fs.existsSync(cheminMotsDePasse)) {
    cheminMotsDePasse = path.join(__dirname, cheminMotsDePasse);
  }

  if (!fichierPDF || !fs.existsSync(fichierPDF)) {
    process.exit(1);
  }

  const debug = process.argv.includes('debug');
  extraireNomDuPDF(fichierPDF, cheminMotsDePasse, debug)
    .then((nom) => process.exit(nom ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { extraireNomDuPDF, extraireNom };
