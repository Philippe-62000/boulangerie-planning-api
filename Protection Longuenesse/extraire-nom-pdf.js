const fs = require('fs');
const path = require('path');

// Essayer d'utiliser pdf-parse si disponible
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  // Essayer depuis le dossier backend avec différents chemins possibles
  // Le script .bat peut être lancé depuis n'importe quel répertoire
  const scriptDir = __dirname;
  const currentDir = process.cwd();
  
  // Liste des chemins possibles pour trouver backend/node_modules/pdf-parse
  const cheminsPossibles = [
    // Depuis le répertoire du script (si le script est à la racine du projet)
    path.resolve(scriptDir, 'backend', 'node_modules', 'pdf-parse'),
    // Depuis le répertoire courant (où le .bat a été lancé)
    path.resolve(currentDir, 'backend', 'node_modules', 'pdf-parse'),
    // Depuis le répertoire parent du script (si le script est dans un sous-dossier)
    path.resolve(scriptDir, '..', 'backend', 'node_modules', 'pdf-parse'),
    // Depuis le répertoire parent du répertoire courant
    path.resolve(currentDir, '..', 'backend', 'node_modules', 'pdf-parse'),
    // Depuis le répertoire parent du parent (pour être sûr)
    path.resolve(scriptDir, '..', '..', 'backend', 'node_modules', 'pdf-parse'),
    path.resolve(currentDir, '..', '..', 'backend', 'node_modules', 'pdf-parse'),
  ];
  
  let trouve = false;
  for (const chemin of cheminsPossibles) {
    try {
      const packageJsonPath = path.join(chemin, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        pdfParse = require(chemin);
        trouve = true;
        break;
      }
    } catch (e) {
      // Continuer avec le chemin suivant
    }
  }
  
  if (!trouve) {
    process.exit(1);
  }
}

// Rejeter les mots qui ressemblent à une adresse (ex: 24ROUTEDESBRUYERES) et non un nom
function estAdresseOuNonNom(mot) {
  if (!mot || mot.length < 2) return true;
  // Contient des chiffres (24, 12, etc.) -> adresse
  if (/\d/.test(mot)) return true;
  // Mot trop long et concaténé (ex: ROUTEDESBRUYERES) -> adresse
  if (mot.length > 12 && mot === mot.toUpperCase()) return true;
  // Mots-clés d'adresse (sans espaces dans le PDF)
  const motsAdresse = ['RUE', 'ROUTE', 'AVENUE', 'PLACE', 'ALLEE', 'CHEMIN', 'IMPASSE', 'BOULEVARD', 'BD', 'SQUARE', 'COURS', 'QUAI', 'PASSAGE'];
  const motUpper = mot.toUpperCase();
  for (const m of motsAdresse) {
    if (motUpper.includes(m)) return true;
  }
  return false;
}

// Valider qu'un résultat "NOM Prénom" ne contient pas d'adresse
function validerNom(nomComplet) {
  if (!nomComplet) return null;
  const parties = nomComplet.split(/\s+/);
  for (const p of parties) {
    if (estAdresseOuNonNom(p)) return null;
  }
  return nomComplet;
}

// Fonction pour extraire le nom depuis le texte d'une page PDF
function extraireNom(texte) {
  if (!texte || texte.trim().length === 0) {
    return null;
  }
  
  // Nettoyer le texte
  const lignes = texte.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !/^\d+$/.test(l)); // Exclure les lignes avec uniquement des chiffres
  
  // Chercher un nom dans les premières lignes (généralement en haut de la fiche de paie)
  // Format typique: "Madame Justine CASTIER" ou "Monsieur Jean DUPONT" ou "Justine CASTIER"
  
  // Chercher des patterns de noms dans les 50 premières lignes (augmenté pour plus de chance)
  const texteRecherche = lignes.slice(0, 50);
  
  // Pattern 1: "Madame Prénom NOM" ou "Monsieur Prénom NOM" (dans une ligne) - PRIORITAIRE
  for (const ligne of texteRecherche) {
    // Pattern strict: "Madame Justine CASTIER" - chercher "Madame" suivi de prénom puis NOM en majuscules
    const match1 = ligne.match(/^(?:Monsieur|Madame|M\.|Mme|Mlle)\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ\s\-']{2,})$/i);
    if (match1 && match1[1] && match1[2]) {
      const prenom = match1[1].trim();
      const nom = match1[2].trim();
      // Vérifier que ce n'est pas "DE SALAIRE" ou autre texte non-nom
      if (nom.length > 2 && nom !== 'SALAIRE' && prenom.length > 2) {
        const res = validerNom(`${nom} ${prenom}`);
        if (res) return res;
      }
    }
    
    // Pattern plus flexible: chercher "Madame" puis prénom puis NOM
    const match2 = ligne.match(/(?:Monsieur|Madame|M\.|Mme|Mlle)\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ]{2,})/i);
    if (match2 && match2[1] && match2[2]) {
      const prenom = match2[1].trim();
      const nom = match2[2].trim();
      // Vérifier que ce n'est pas "DE SALAIRE" ou autre texte non-nom
      if (nom.length > 2 && nom !== 'SALAIRE' && !nom.includes('SALAIRE') && prenom.length > 2 && !prenom.includes('DE')) {
        const res = validerNom(`${nom} ${prenom}`);
        if (res) return res;
      }
    }
  }
  
  // Pattern 2: Ligne avec 2-3 mots, format "Prénom NOM" (le dernier en majuscules) - FILTRER "DE SALAIRE"
  for (const ligne of texteRecherche) {
    const mots = ligne.split(/\s+/).filter(m => m.length > 1);
    if (mots.length >= 2 && mots.length <= 4) {
      const dernierMot = mots[mots.length - 1];
      const avantDernierMot = mots[mots.length - 2];
      
      // Si le dernier mot est en majuscules (NOM) et l'avant-dernier commence par une majuscule (Prénom)
      if (dernierMot === dernierMot.toUpperCase() && dernierMot.length > 2 &&
          avantDernierMot && avantDernierMot[0] === avantDernierMot[0].toUpperCase()) {
        // Filtrer les mots non-noms
        if (dernierMot !== 'SALAIRE' && !dernierMot.includes('SALAIRE') && 
            avantDernierMot !== 'DE' && !avantDernierMot.includes('DE')) {
          const res = validerNom(`${dernierMot} ${avantDernierMot}`);
          if (res) return res;
        }
      }
    }
  }
  
  // Pattern 3: Chercher "Nom:" ou "Prénom:" avec valeurs (si présent dans le PDF)
  const texteJoint = texteRecherche.join(' ');
  let match = texteJoint.match(/(?:Nom[:\s]+)([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ\s\-']{2,})(?:\s+Prénom[:\s]+)?([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})?/i);
  if (match && match[1]) {
    const nom = match[1].trim();
    const prenom = match[2] ? match[2].trim() : '';
    if (nom !== 'SALAIRE' && !nom.includes('SALAIRE')) {
      if (prenom && prenom.length > 2) {
        const res = validerNom(`${nom} ${prenom}`);
        if (res) return res;
      }
      const res = validerNom(nom);
      if (res) return res;
    }
  }
  
  // Pattern 4: Deux mots consécutifs, l'un en majuscules (NOM), l'autre mixte (Prénom)
  for (let i = 0; i < texteRecherche.length - 1; i++) {
    const ligne1 = texteRecherche[i];
    const ligne2 = texteRecherche[i + 1];
    const mots1 = ligne1.split(/\s+/).filter(m => m.length > 2);
    const mots2 = ligne2.split(/\s+/).filter(m => m.length > 2);
    
    // Si une ligne est en majuscules (NOM) et la suivante commence par une majuscule (Prénom)
    if (mots1.length === 1 && mots1[0] === mots1[0].toUpperCase() && mots1[0].length > 2) {
      if (mots2.length >= 1 && mots2[0][0] === mots2[0][0].toUpperCase()) {
        const nom = mots1[0];
        const prenom = mots2[0];
        if (nom !== 'SALAIRE' && !nom.includes('SALAIRE') && prenom !== 'DE') {
          const res = validerNom(`${nom} ${prenom}`);
          if (res) return res;
        }
      }
    }
  }
  
  // Pattern 5: Ligne simple avec format "Prénom NOM" ou "NOM Prénom" - FILTRER "DE SALAIRE"
  for (const ligne of texteRecherche) {
    const mots = ligne.split(/\s+/).filter(m => m.length > 2);
    if (mots.length === 2) {
      const [mot1, mot2] = mots;
      // Si mot2 est en majuscules, format "Prénom NOM" -> retourner "NOM Prénom"
      if (mot2 === mot2.toUpperCase()) {
        if (mot2 !== 'SALAIRE' && !mot2.includes('SALAIRE') && mot1 !== 'DE') {
          const res = validerNom(`${mot2} ${mot1}`);
          if (res) return res;
        }
      }
      // Si mot1 est en majuscules, format "NOM Prénom" -> déjà bon
      if (mot1 === mot1.toUpperCase()) {
        if (mot1 !== 'SALAIRE' && !mot1.includes('SALAIRE') && mot2 !== 'DE') {
          const res = validerNom(`${mot1} ${mot2}`);
          if (res) return res;
        }
      }
    }
  }
  
  return null;
}

// Parser mots_de_passe.bat pour extraire la liste des noms (pwd_NOM=...)
function chargerNomsDepuisMotsDePasse(cheminFichier) {
  if (!cheminFichier || !fs.existsSync(cheminFichier)) return [];
  const contenu = fs.readFileSync(cheminFichier, 'utf8');
  const noms = [];
  const regex = /set\s+"pwd_([A-Za-zÀ-ÿ\-]+)=/g;
  let m;
  while ((m = regex.exec(contenu)) !== null) {
    const nom = m[1].trim();
    if (nom && nom !== 'TEST') noms.push(nom); // Exclure TEST
  }
  return noms;
}

// Chercher quel nom de la liste apparaît dans le texte du PDF
function trouverNomParListe(texte, listeNoms) {
  if (!texte || !listeNoms || listeNoms.length === 0) return null;
  for (const nom of listeNoms) {
    const nomEsc = nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 1. Mot entier classique (ex: "MOLAND" dans "Madame Marina MOLAND")
    const regex1 = new RegExp('\\b' + nomEsc + '\\b', 'i');
    if (regex1.test(texte)) return nom;
    // 2. Format concaténé sans espaces (ex: "MadameMarinaMOLAND")
    const regex2 = new RegExp('(?:Madame|Monsieur)[A-Za-zÀ-ÿ]*' + nomEsc, 'i');
    if (regex2.test(texte)) return nom;
  }
  return null;
}

// Fonction principale
async function extraireNomDuPDF(fichierPDF, cheminMotsDePasse, debug) {
  try {
    const dataBuffer = fs.readFileSync(fichierPDF);
    const pdfData = await pdfParse(dataBuffer);
    const texte = pdfData.text || '';
    
    if (debug) {
      console.error('DEBUG: Texte extrait: ' + (texte ? texte.length + ' caracteres' : 'VIDE'));
    }
    
    // 1. Si mots_de_passe.bat fourni : UNIQUEMENT chercher les noms connus (pas de fallback)
    if (cheminMotsDePasse) {
      const listeNoms = chargerNomsDepuisMotsDePasse(cheminMotsDePasse);
      if (debug) console.error('DEBUG: Noms charges: ' + listeNoms.join(', '));
      if (listeNoms.length > 0) {
        const nomTrouve = trouverNomParListe(texte, listeNoms);
        if (nomTrouve) {
          if (debug) console.error('DEBUG: Nom trouve: ' + nomTrouve);
          console.log(nomTrouve);
          return nomTrouve;
        }
        if (debug && texte.length > 0) console.error('DEBUG: Aucun nom de la liste trouve dans le PDF');
        return null; // Pas de fallback : éviter faux positifs (ex: "Acquis")
      }
    }
    
    // 2. Sans mots_de_passe : extraction par patterns
    const nom = extraireNom(texte);
    if (nom) {
      console.log(nom);
      return nom;
    }
    
    return null;
  } catch (error) {
    if (debug) console.error('DEBUG: Erreur pdf-parse:', error.message);
    return null;
  }
}

// Script principal
if (require.main === module) {
  const fichierPDF = process.argv[2];
  let cheminMotsDePasse = process.argv[3];
  if (!cheminMotsDePasse) cheminMotsDePasse = path.join(__dirname, 'mots_de_passe.bat');
  else if (!path.isAbsolute(cheminMotsDePasse) && !fs.existsSync(cheminMotsDePasse)) {
    cheminMotsDePasse = path.join(__dirname, cheminMotsDePasse);
  }
  
  if (!fichierPDF) {
    process.exit(1);
  }
  
  if (!fs.existsSync(fichierPDF)) {
    process.exit(1);
  }
  
  const debug = process.argv[4] === 'debug';
  extraireNomDuPDF(fichierPDF, cheminMotsDePasse, debug)
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { extraireNomDuPDF, extraireNom };
