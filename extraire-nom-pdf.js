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
        return `${nom} ${prenom}`;
      }
    }
    
    // Pattern plus flexible: chercher "Madame" puis prénom puis NOM
    const match2 = ligne.match(/(?:Monsieur|Madame|M\.|Mme|Mlle)\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ]{2,})/i);
    if (match2 && match2[1] && match2[2]) {
      const prenom = match2[1].trim();
      const nom = match2[2].trim();
      // Vérifier que ce n'est pas "DE SALAIRE" ou autre texte non-nom
      if (nom.length > 2 && nom !== 'SALAIRE' && !nom.includes('SALAIRE') && prenom.length > 2 && !prenom.includes('DE')) {
        return `${nom} ${prenom}`;
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
          // Retourner "NOM Prénom" (dernier mot = NOM, avant-dernier = Prénom)
          return `${dernierMot} ${avantDernierMot}`;
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
        return `${nom} ${prenom}`;
      }
      return nom;
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
          return `${nom} ${prenom}`;
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
          return `${mot2} ${mot1}`;
        }
      }
      // Si mot1 est en majuscules, format "NOM Prénom" -> déjà bon
      if (mot1 === mot1.toUpperCase()) {
        if (mot1 !== 'SALAIRE' && !mot1.includes('SALAIRE') && mot2 !== 'DE') {
          return `${mot1} ${mot2}`;
        }
      }
    }
  }
  
  return null;
}

// Fonction principale
async function extraireNomDuPDF(fichierPDF) {
  try {
    const dataBuffer = fs.readFileSync(fichierPDF);
    const pdfData = await pdfParse(dataBuffer);
    
    const nom = extraireNom(pdfData.text);
    
    if (nom) {
      // Afficher uniquement le nom (pas de messages)
      console.log(nom);
      return nom;
    } else {
      return null;
    }
    
  } catch (error) {
    // Erreur silencieuse pour ne pas polluer la sortie
    return null;
  }
}

// Script principal
if (require.main === module) {
  const fichierPDF = process.argv[2];
  
  if (!fichierPDF) {
    process.exit(1);
  }
  
  if (!fs.existsSync(fichierPDF)) {
    process.exit(1);
  }
  
  extraireNomDuPDF(fichierPDF)
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { extraireNomDuPDF, extraireNom };
