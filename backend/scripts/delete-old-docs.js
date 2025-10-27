const mongoose = require('mongoose');
const Document = require('../models/Document');

// Configuration de connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/boulangerie-planning';

async function deleteOldDocuments() {
  try {
    console.log('🧹 Suppression des anciens documents...');
    
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
    console.log('✅ Nettoyage terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    // Fermer la connexion MongoDB
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le script
deleteOldDocuments()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
