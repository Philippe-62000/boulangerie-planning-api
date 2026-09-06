/**
 * Résout le mot de passe paie depuis le nom de fichier + mots_de_passe.bat
 *
 * Entrées acceptées (partie après AAAAMM ) :
 *   POUILLAUDE Laura          → pwd_POUILLAUDE_LAURA (homonymes)
 *   POUILLAUDE_LAURA          → pwd_POUILLAUDE_LAURA
 *   BERGEMAN                  → pwd_BERGEMAN
 *
 * Usage: node trouver-mot-de-passe.js "POUILLAUDE Laura" mots_de_passe.bat
 * Sortie stdout: le mot de passe (ou exit 1)
 */
const fs = require('fs');
const path = require('path');

function normalizeKeyPart(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/_+/g, '_');
}

function loadPasswords(batPath) {
  const map = new Map();
  if (!fs.existsSync(batPath)) return map;
  const content = fs.readFileSync(batPath, 'utf8');
  const re = /set\s+"pwd_([^=]+)=([^"]*)"/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    map.set(normalizeKeyPart(m[1]).replace(/_+/g, '_'), m[2]);
  }
  return map;
}

/** @returns {string[]} clés candidates, plus spécifiques d'abord */
function candidateKeys(namePart) {
  let s = String(namePart || '').trim();
  s = s.replace(/_Normal(_bis|_2)?$/i, '').replace(/_Protege(_bis|_2)?$/i, '').trim();
  if (!s) return [];

  const keys = [];

  // Format "NOM_PRENOM" déjà composé
  if (s.includes('_') && !s.includes(' ')) {
    keys.push(normalizeKeyPart(s).replace(/_+/g, '_'));
  }

  // Format "NOM Prenom" (Arras actuel) ou "NOM Prenom Autre"
  const spaceParts = s.split(/\s+/).filter(Boolean);
  if (spaceParts.length >= 2) {
    const last = normalizeKeyPart(spaceParts[0]);
    const first = normalizeKeyPart(spaceParts.slice(1).join(' '));
    if (last && first) keys.push(`${last}_${first}`);
    if (last) keys.push(last);
  } else if (spaceParts.length === 1) {
    const only = normalizeKeyPart(spaceParts[0]);
    if (only) keys.push(only);
  }

  // Dédupliquer en gardant l'ordre
  return [...new Set(keys)];
}

function main() {
  const namePart = process.argv[2];
  let batPath = process.argv[3] || path.join(__dirname, 'mots_de_passe.bat');
  if (!path.isAbsolute(batPath)) batPath = path.join(process.cwd(), batPath);
  if (!fs.existsSync(batPath)) batPath = path.join(__dirname, 'mots_de_passe.bat');

  const passwords = loadPasswords(batPath);
  const candidates = candidateKeys(namePart);

  for (const key of candidates) {
    if (passwords.has(key)) {
      const pwd = passwords.get(key);
      if (pwd && pwd !== 'null') {
        process.stdout.write(pwd);
        process.exit(0);
      }
    }
  }

  process.exit(1);
}

if (require.main === module) main();

module.exports = { candidateKeys, loadPasswords, normalizeKeyPart };
