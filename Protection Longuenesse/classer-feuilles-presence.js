const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const LISTE_PATH = path.join(SCRIPT_DIR, 'salaries-longuenesse.json');

function normalize(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadEmployees() {
  if (!fs.existsSync(LISTE_PATH)) {
    throw new Error(`Liste des salariés introuvable: ${LISTE_PATH}`);
  }
  const data = JSON.parse(fs.readFileSync(LISTE_PATH, 'utf8'));
  const salaries = Array.isArray(data.salaries) ? data.salaries : [];
  return salaries.map((s) => ({
    prenom: String(s.prenom || '').trim(),
    nom: String(s.nom || '').trim(),
    label: [s.prenom, s.nom].filter(Boolean).join(' ').trim()
  })).filter((s) => s.label);
}

function compareFr(a, b) {
  const nom = (a.nom || a.label).localeCompare(b.nom || b.label, 'fr', { sensitivity: 'base' });
  if (nom !== 0) return nom;
  return (a.prenom || '').localeCompare(b.prenom || '', 'fr', { sensitivity: 'base' });
}

function extractHeaderName(text) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  const m = compact.match(/SARL\s+ORCINUS\s+(.+?)\s+Heures contrat/i);
  return m ? m[1].trim() : compact.slice(0, 80);
}

function parseFallbackName(header) {
  const parts = String(header || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: '', nom: header || 'Page sans nom', label: header || 'Page sans nom' };
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0], label: parts[0] };
  const firstAllCaps = parts[0] === parts[0].toUpperCase();
  const secondMixed = parts[1] !== parts[1].toUpperCase();
  if (firstAllCaps && secondMixed) {
    return {
      nom: parts[0],
      prenom: parts.slice(1).join(' '),
      label: `${parts.slice(1).join(' ')} ${parts[0]}`
    };
  }
  return {
    prenom: parts[0],
    nom: parts.slice(1).join(' '),
    label: parts.join(' ')
  };
}

function hasWord(haystack, word) {
  const needle = normalize(word);
  if (!needle) return false;
  return new RegExp(`(^| )${needle}( |$)`).test(` ${haystack} `);
}

function matchEmployee(header, employees) {
  const hay = normalize(header);
  const hits = employees.filter((emp) => {
    const nom = normalize(emp.nom);
    const prenom = normalize(emp.prenom);
    if (nom && prenom) return hasWord(hay, nom) && hasWord(hay, prenom);
    if (prenom) return hasWord(hay, prenom);
    return false;
  });
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {
    const both = hits.filter((emp) => emp.nom && emp.prenom);
    if (both.length === 1) return both[0];
  }
  return null;
}

async function loadPdfJs() {
  const candidates = [
    path.resolve(SCRIPT_DIR, '..', 'backend', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs'),
    path.resolve(SCRIPT_DIR, '..', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return import('file:///' + c.replace(/\\/g, '/'));
    }
  }
  throw new Error('pdfjs-dist introuvable (installez les dépendances du backend).');
}

function loadPdfLib() {
  const local = path.join(SCRIPT_DIR, 'node_modules', 'pdf-lib');
  if (fs.existsSync(local)) return require(local);
  try {
    return require('pdf-lib');
  } catch (_) {
    throw new Error('pdf-lib introuvable. Lancez classer-feuilles-presence.bat (il l’installe) ou: npm install');
  }
}

async function extractPages(pdfPath) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, stopAtErrors: false }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
    pages.push({ index: i - 1, pageNumber: i, text });
  }
  return pages;
}

function identifyPages(rawPages, employees) {
  return rawPages.map((page) => {
    const header = extractHeaderName(page.text);
    const matched = matchEmployee(header, employees);
    const fallback = parseFallbackName(header);
    const ident = matched
      ? { ...matched, actuel: true }
      : { ...fallback, actuel: false };
    return {
      ...page,
      header,
      ...ident
    };
  });
}

function outputPathFor(inputPath) {
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext).replace(/[-_]?AZ$/i, '');
  return path.join(dir, `${base}-AZ${ext}`);
}

function findPdfs(args) {
  const explicit = args.filter((a) => !a.startsWith('--'));
  if (explicit.length > 0) {
    return explicit.map((p) => path.resolve(p)).filter((p) => {
      if (!fs.existsSync(p)) {
        console.error(`Introuvable: ${p}`);
        return false;
      }
      if (fs.statSync(p).isDirectory()) {
        return false;
      }
      return p.toLowerCase().endsWith('.pdf');
    });
  }

  const dirs = [process.cwd(), SCRIPT_DIR, path.join(process.env.USERPROFILE || '', 'Downloads')];
  const found = [];
  for (const dir of dirs) {
    if (!dir || !fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!/\.pdf$/i.test(name)) continue;
      if (!/feuille[- ]presence/i.test(name)) continue;
      if (/-AZ\.pdf$/i.test(name)) continue;
      found.push(path.join(dir, name));
    }
  }
  return [...new Set(found)];
}

async function rewritePdf(inputPath, orderedIndices, outputPath) {
  const { PDFDocument } = loadPdfLib();
  const src = await PDFDocument.load(fs.readFileSync(inputPath));
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, orderedIndices);
  copied.forEach((p) => out.addPage(p));
  fs.writeFileSync(outputPath, await out.save());
}

async function processPdf(pdfPath, employees, actifsSeulement) {
  console.log('');
  console.log(`PDF: ${pdfPath}`);
  const rawPages = await extractPages(pdfPath);
  const pages = identifyPages(rawPages, employees);
  const selected = actifsSeulement ? pages.filter((p) => p.actuel) : pages.slice();
  selected.sort(compareFr);

  console.log(`Pages lues: ${pages.length}`);
  selected.forEach((p, i) => {
    const tag = p.actuel ? '' : '  (hors liste actuelle)';
    console.log(`  ${String(i + 1).padStart(2, ' ')}. ${p.prenom} ${p.nom}`.trim() + `  ← page ${p.pageNumber}${tag}`);
  });

  const usedLabels = new Set(pages.filter((p) => p.actuel).map((p) => normalize(`${p.prenom} ${p.nom}`)));
  const missing = employees.filter((e) => !usedLabels.has(normalize(`${e.prenom} ${e.nom}`)));
  const extras = pages.filter((p) => !p.actuel);

  if (missing.length) {
    console.log('Salariés actuels absents du PDF:');
    missing.forEach((e) => console.log(`  - ${e.label}`));
  }
  if (extras.length) {
    console.log('Pages hors liste actuelle:');
    extras.forEach((p) => console.log(`  - page ${p.pageNumber}: ${p.header}`));
  }

  if (selected.length === 0) {
    console.error('Aucune page à écrire.');
    return false;
  }

  const outPath = outputPathFor(pdfPath);
  await rewritePdf(pdfPath, selected.map((p) => p.index), outPath);
  console.log(`Écrit: ${outPath}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const actifsSeulement = args.includes('--actifs-seulement');
  const employees = loadEmployees();
  const pdfs = findPdfs(args);

  if (pdfs.length === 0) {
    console.error('Aucun PDF « feuille-presence » trouvé.');
    console.error('Glissez le PDF sur classer-feuilles-presence.bat, ou passez son chemin en argument.');
    process.exit(1);
  }

  console.log(`Liste actuelle: ${employees.length} salariés (${path.basename(LISTE_PATH)})`);
  let ok = true;
  for (const pdf of pdfs) {
    try {
      const done = await processPdf(pdf, employees, actifsSeulement);
      if (!done) ok = false;
    } catch (err) {
      console.error(`Erreur sur ${pdf}: ${err.message}`);
      ok = false;
    }
  }
  process.exit(ok ? 0 : 1);
}

main();
