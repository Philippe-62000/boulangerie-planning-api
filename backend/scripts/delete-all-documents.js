const mongoose = require('mongoose');
const Document = require('../models/Document');

// Configuration de connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/boulangerie-planning';

async function deleteAllDocuments() {
  try {
    console.log('🧹 Suppression de TOUS les documents...');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB établie');
    
    // Compter tous les documents
    const totalDocuments = await Document.countDocuments();
    console.log(`📄 ${totalDocuments} documents trouvés au total`);
    
    if (totalDocuments === 0) {
      console.log('✅ Aucun document à supprimer');
      return;
    }
    
    // Afficher les documents qui seront supprimés
    const allDocuments = await Document.find({});
    console.log('\n📋 Documents qui seront supprimés :');
    allDocuments.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (${doc.type}) - ${doc.filePath}`);
    });
    
    // Supprimer TOUS les documents
    const deleteResult = await Document.deleteMany({});
    
    console.log(`\n🗑️ ${deleteResult.deletedCount} documents supprimés de la base de données`);
    console.log('✅ Nettoyage complet terminé !');
    console.log('✅ Vous pouvez maintenant uploader de nouveaux documents sur le NAS');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    // Fermer la connexion MongoDB
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le script
deleteAllDocuments()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
