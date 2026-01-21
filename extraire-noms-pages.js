const fs = require('fs');
const path = require('path');

// Essayer d'utiliser pdf-parse si disponible
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  // Essayer depuis le dossier backend
  try {
    const backendPath = path.join(__dirname, 'backend', 'node_modules', 'pdf-parse');
    pdfParse = require(backendPath);
  } catch (error2) {
    console.error('❌ Erreur: pdf-parse n\'est pas disponible.');
    console.error('   Veuillez installer pdf-parse: npm install pdf-parse');
    console.error('   Ou assurez-vous que le backend a été initialisé (npm install dans backend/)');
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
  // Format typique: "Nom: DUPONT" "Prénom: Jean" ou "DUPONT Jean" ou "Jean DUPONT"
  
  // Chercher des patterns de noms dans les 25 premières lignes
  const texteRecherche = lignes.slice(0, 25);
  const texteJoint = texteRecherche.join(' ');
  
  // Pattern 1: "Nom: XXXX Prénom: YYYY" ou "Nom XXXX Prénom YYYY"
  let match = texteJoint.match(/(?:Nom[:\s]+)([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ\s\-']{2,})(?:\s+Prénom[:\s]+)?([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})?/i);
  if (match && match[1]) {
    const nom = match[1].trim();
    const prenom = match[2] ? match[2].trim() : '';
    if (prenom) {
      return `${prenom} ${nom}`;
    }
    return nom;
  }
  
  // Pattern 2: Ligne avec 2-3 mots, le dernier en majuscules (NOM)
  for (const ligne of texteRecherche) {
    const mots = ligne.split(/\s+/).filter(m => m.length > 1);
    if (mots.length >= 2 && mots.length <= 4) {
      const dernierMot = mots[mots.length - 1];
      const avantDernierMot = mots[mots.length - 2];
      
      // Si le dernier mot est en majuscules et l'avant-dernier commence par une majuscule
      if (dernierMot === dernierMot.toUpperCase() && dernierMot.length > 2 &&
          avantDernierMot && avantDernierMot[0] === avantDernierMot[0].toUpperCase()) {
        // C'est probablement "Prénom NOM"
        return mots.slice(-2).join(' ');
      }
    }
  }
  
  // Pattern 3: Deux mots consécutifs, l'un en majuscules (NOM), l'autre mixte (Prénom)
  for (let i = 0; i < texteRecherche.length - 1; i++) {
    const ligne1 = texteRecherche[i];
    const ligne2 = texteRecherche[i + 1];
    const mots1 = ligne1.split(/\s+/).filter(m => m.length > 2);
    const mots2 = ligne2.split(/\s+/).filter(m => m.length > 2);
    
    // Si une ligne est en majuscules (NOM) et la suivante commence par une majuscule (Prénom)
    if (mots1.length === 1 && mots1[0] === mots1[0].toUpperCase() && mots1[0].length > 2) {
      if (mots2.length >= 1 && mots2[0][0] === mots2[0][0].toUpperCase()) {
        return `${mots2[0]} ${mots1[0]}`;
      }
    }
  }
  
  // Pattern 4: Ligne simple avec format "Prénom NOM" ou "NOM Prénom"
  for (const ligne of texteRecherche) {
    const mots = ligne.split(/\s+/).filter(m => m.length > 2);
    if (mots.length === 2) {
      const [mot1, mot2] = mots;
      // Si mot2 est en majuscules, format "Prénom NOM"
      if (mot2 === mot2.toUpperCase()) {
        return `${mot1} ${mot2}`;
      }
      // Si mot1 est en majuscules, format "NOM Prénom"
      if (mot1 === mot1.toUpperCase()) {
        return `${mot2} ${mot1}`;
      }
      // Sinon, prendre tel quel
      return ligne;
    }
  }
  
  return null;
}

// Fonction pour extraire le texte d'une page spécifique (nécessite pdf-lib ou autre)
// Pour l'instant, on ne peut extraire que tout le PDF avec pdf-parse
async function extraireNomsPages(dossierPages) {
  const noms = [];
  const fichiers = fs.readdirSync(dossierPages)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => {
      // Trier par numéro de page
      const numA = parseInt(a.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.match(/\d+/)?.[0] || '999');
      return numA - numB;
    });
  
  console.log(`📄 ${fichiers.length} fichiers PDF trouvés dans ${dossierPages}`);
  
  for (const fichier of fichiers) {
    const cheminComplet = path.join(dossierPages, fichier);
    try {
      const dataBuffer = fs.readFileSync(cheminComplet);
      const pdfData = await pdfParse(dataBuffer);
      const nom = extraireNom(pdfData.text);
      
      if (nom) {
        console.log(`✅ ${fichier}: ${nom}`);
        noms.push(nom);
      } else {
        console.log(`⚠️  ${fichier}: Nom non trouvé`);
        noms.push(null);
      }
    } catch (error) {
      console.error(`❌ Erreur avec ${fichier}: ${error.message}`);
      noms.push(null);
    }
  }
  
  return noms;
}

// Script principal
if (require.main === module) {
  const dossierPages = process.argv[2];
  
  if (!dossierPages) {
    console.error('❌ Usage: node extraire-noms-pages.js <dossier_pages>');
    process.exit(1);
  }
  
  if (!fs.existsSync(dossierPages)) {
    console.error(`❌ Le dossier "${dossierPages}" n'existe pas.`);
    process.exit(1);
  }
  
  extraireNomsPages(dossierPages)
    .then(noms => {
      // Afficher les noms (un par ligne) - format simple pour extraction par batch
      noms.forEach((nom, index) => {
        if (nom) {
          // Afficher uniquement le nom (sans messages)
          console.log(nom);
        } else {
          // Afficher un placeholder pour les noms non trouvés
          console.log(`[PAGE_${index + 1}_NOM_NON_TROUVE]`);
        }
      });
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { extraireNomsPages, extraireNom };
