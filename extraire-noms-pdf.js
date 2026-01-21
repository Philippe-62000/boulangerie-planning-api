const fs = require('fs');
const path = require('path');

// Essayer d'utiliser pdf-parse si disponible (backend)
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.error('❌ Erreur: pdf-parse n\'est pas disponible.');
  console.error('   Veuillez installer pdf-parse: npm install pdf-parse');
  process.exit(1);
}

// Fonction pour extraire le nom depuis le texte d'une page PDF
function extraireNom(texte) {
  // Nettoyer le texte
  const lignes = texte.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Chercher un nom dans les premières lignes (généralement en haut de la fiche de paie)
  // Format typique: "Nom: DUPONT Prénom: Jean" ou "DUPONT Jean" ou "Jean DUPONT"
  // Ou simplement "DUPONT Jean" en début de document
  
  // Chercher des patterns de noms (2-3 mots, avec au moins une majuscule)
  const patterns = [
    /(?:Nom[:\s]+)?([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ\s\-']{2,})\s+(?:Prénom[:\s]+)?([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})/i,
    /([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ\s\-']{2,})\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})/,
    /([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][a-zéèêëàâäôöùûüç\s\-']{2,})\s+([A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ][A-ZÉÈÊËÀÂÄÔÖÙÛÜÇ\s\-']{2,})/,
  ];
  
  // Chercher dans les 20 premières lignes
  const texteRecherche = lignes.slice(0, 20).join(' ');
  
  for (const pattern of patterns) {
    const match = texteRecherche.match(pattern);
    if (match) {
      // Retourner "Prénom NOM" ou "NOM Prénom" (normaliser)
      const partie1 = match[1].trim();
      const partie2 = match[2].trim();
      
      // Si la première partie est en majuscules, c'est probablement le NOM
      if (partie1 === partie1.toUpperCase() && partie1.length > 2) {
        return `${partie2} ${partie1}`;
      }
      // Sinon, c'est probablement "Prénom NOM"
      return `${partie1} ${partie2}`;
    }
  }
  
  // Fallback: chercher une ligne avec 2-3 mots commençant par une majuscule
  for (const ligne of lignes.slice(0, 15)) {
    const mots = ligne.split(/\s+/).filter(m => m.length > 2);
    if (mots.length >= 2 && mots.length <= 3) {
      // Vérifier si ça ressemble à un nom (au moins une majuscule)
      if (mots.some(m => m[0] === m[0].toUpperCase())) {
        return mots.join(' ');
      }
    }
  }
  
  return null;
}

// Fonction principale
async function extraireNomsDuPDF(fichierPDF) {
  try {
    console.log(`📄 Lecture du fichier: ${fichierPDF}`);
    
    const dataBuffer = fs.readFileSync(fichierPDF);
    const pdfData = await pdfParse(dataBuffer);
    
    const nombrePages = pdfData.numpages;
    console.log(`📊 Nombre de pages: ${nombrePages}`);
    
    // Pour extraire chaque page individuellement, on doit utiliser une autre méthode
    // pdf-parse ne permet pas d'extraire page par page directement
    // Il faut diviser le PDF d'abord, puis extraire chaque page
    
    console.log('⚠️  Note: pdf-parse extrait tout le texte du PDF.');
    console.log('   Pour extraire les noms page par page, il faut d\'abord diviser le PDF.');
    console.log('   Cette fonctionnalité nécessite une bibliothèque supplémentaire.');
    console.log('');
    console.log('💡 Solution recommandée:');
    console.log('   1. Diviser le PDF en pages individuelles avec PDFtk');
    console.log('   2. Extraire le texte de chaque page');
    console.log('   3. Chercher le nom dans chaque page');
    
    // Pour l'instant, on retourne le texte complet
    // Dans une version améliorée, on pourrait utiliser pdf-lib ou une autre bibliothèque
    return {
      success: false,
      message: 'Extraction page par page non implémentée avec pdf-parse uniquement',
      nombrePages: nombrePages
    };
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Script principal
if (require.main === module) {
  const fichierPDF = process.argv[2];
  
  if (!fichierPDF) {
    console.error('❌ Usage: node extraire-noms-pdf.js <fichier.pdf>');
    process.exit(1);
  }
  
  if (!fs.existsSync(fichierPDF)) {
    console.error(`❌ Le fichier "${fichierPDF}" n'existe pas.`);
    process.exit(1);
  }
  
  extraireNomsDuPDF(fichierPDF)
    .then(result => {
      if (result.success) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('❌ Échec de l\'extraction');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { extraireNomsDuPDF, extraireNom };
