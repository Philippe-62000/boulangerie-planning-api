const mongoose = require('mongoose');
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// Configuration de connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/boulangerie-planning';

async function cleanupOldDocuments() {
  try {
    console.log('🧹 Nettoyage des anciens documents...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB établie');
    
    // Trouver tous les documents avec des filePath qui ne commencent pas par 'general/' ou 'personal/'
    const oldDocuments = await Document.find({
      filePath: { $not: { $regex: /^(general|personal)\// } }
    });
    
    console.log(`📄 ${oldDocuments.length} anciens documents trouvés`);
    
    if (oldDocuments.length === 0) {
      console.log('✅ Aucun ancien document à supprimer');
      return;
    }
    
    // Afficher les documents qui seront supprimés
    console.log('\n📋 Documents qui seront supprimés :');
    oldDocuments.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (${doc.type}) - ${doc.filePath}`);
    });
    
    // Supprimer les documents de la base de données
    const deleteResult = await Document.deleteMany({
      filePath: { $not: { $regex: /^(general|personal)\// } }
    });
    
    console.log(`\n🗑️ ${deleteResult.deletedCount} documents supprimés de la base de données`);
    
    // Nettoyer les fichiers locaux sur Render
    const uploadsDir = path.join(__dirname, '../uploads/documents');
    
    if (fs.existsSync(uploadsDir)) {
      console.log('\n📁 Nettoyage des fichiers locaux...');
      
      // Lister tous les fichiers dans le dossier uploads/documents
      const files = fs.readdirSync(uploadsDir, { withFileTypes: true });
      
      let deletedFiles = 0;
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(uploadsDir, file.name);
          try {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Fichier supprimé: ${file.name}`);
            deletedFiles++;
          } catch (error) {
            console.error(`❌ Erreur lors de la suppression de ${file.name}:`, error.message);
          }
        }
      }
      
      console.log(`✅ ${deletedFiles} fichiers locaux supprimés`);
    } else {
      console.log('📁 Dossier uploads/documents non trouvé');
    }
    
    console.log('\n🎉 Nettoyage terminé !');
    console.log('✅ Tous les anciens documents ont été supprimés');
    console.log('✅ Le système utilise maintenant uniquement le NAS');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    // Fermer la connexion MongoDB
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le script
if (require.main === module) {
  cleanupOldDocuments()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = cleanupOldDocuments;
