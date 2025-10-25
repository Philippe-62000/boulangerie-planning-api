const mongoose = require('mongoose');
const Document = require('../models/Document');
const config = require('../config');

/**
 * Script de nettoyage automatique des documents expirés
 * 
 * Ce script :
 * 1. Identifie les documents personnels expirés
 * 2. Les marque comme inactifs
 * 3. Optionnellement supprime les fichiers du NAS
 * 4. Génère un rapport de nettoyage
 */

const cleanupExpiredDocuments = async () => {
  try {
    console.log('🧹 Démarrage du nettoyage des documents expirés...');
    console.log('⏰ Date actuelle:', new Date().toISOString());
    
    // Connexion à MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connexion à MongoDB établie');
    
    // Nettoyer les documents expirés
    const cleanedCount = await Document.cleanExpiredDocuments();
    
    if (cleanedCount > 0) {
      console.log(`✅ ${cleanedCount} documents expirés ont été nettoyés`);
      
      // Optionnel : supprimer les fichiers physiques du NAS
      // await deleteExpiredFiles();
      
    } else {
      console.log('✅ Aucun document expiré trouvé');
    }
    
    // Générer un rapport
    await generateCleanupReport();
    
    console.log('🎉 Nettoyage terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

const generateCleanupReport = async () => {
  try {
    console.log('📊 Génération du rapport de nettoyage...');
    
    // Statistiques générales
    const totalDocuments = await Document.countDocuments();
    const activeDocuments = await Document.countDocuments({ isActive: true });
    const expiredDocuments = await Document.countDocuments({ 
      type: 'personal',
      expiryDate: { $lt: new Date() },
      isActive: false 
    });
    
    const generalDocuments = await Document.countDocuments({ 
      type: 'general', 
      isActive: true 
    });
    const personalDocuments = await Document.countDocuments({ 
      type: 'personal', 
      isActive: true 
    });
    
    console.log('\n📈 RAPPORT DE NETTOYAGE');
    console.log('========================');
    console.log(`📄 Total documents: ${totalDocuments}`);
    console.log(`✅ Documents actifs: ${activeDocuments}`);
    console.log(`🗑️ Documents expirés nettoyés: ${expiredDocuments}`);
    console.log(`📋 Documents généraux: ${generalDocuments}`);
    console.log(`👤 Documents personnels actifs: ${personalDocuments}`);
    
    // Documents qui vont expirer bientôt (dans les 7 prochains jours)
    const soonToExpire = await Document.find({
      type: 'personal',
      isActive: true,
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).select('title expiryDate employeeId').populate('employeeId', 'name');
    
    if (soonToExpire.length > 0) {
      console.log('\n⚠️ DOCUMENTS QUI VONT EXPIRER (7 prochains jours)');
      console.log('================================================');
      soonToExpire.forEach(doc => {
        const daysLeft = Math.ceil((doc.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`• ${doc.title} (${doc.employeeId?.name || 'Employé inconnu'}) - ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`);
      });
    }
    
    console.log('\n✅ Rapport généré avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du rapport:', error);
  }
};

const deleteExpiredFiles = async () => {
  try {
    console.log('🗑️ Suppression des fichiers expirés du NAS...');
    
    const fs = require('fs');
    const path = require('path');
    
    // Configuration NAS
    const NAS_BASE_PATH = process.env.NAS_BASE_PATH || '/path/to/nas/documents';
    
    // Récupérer les documents expirés
    const expiredDocs = await Document.find({
      type: 'personal',
      isActive: false,
      expiryDate: { $lt: new Date() }
    });
    
    let deletedFiles = 0;
    
    for (const doc of expiredDocs) {
      try {
        const filePath = path.join(NAS_BASE_PATH, doc.filePath);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFiles++;
          console.log(`🗑️ Fichier supprimé: ${doc.fileName}`);
        }
      } catch (fileError) {
        console.error(`❌ Erreur lors de la suppression de ${doc.fileName}:`, fileError.message);
      }
    }
    
    console.log(`✅ ${deletedFiles} fichiers supprimés du NAS`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des fichiers:', error);
  }
};

// Fonction pour planifier le nettoyage automatique
const scheduleCleanup = () => {
  const cron = require('node-cron');
  
  // Exécuter tous les jours à 2h du matin
  cron.schedule('0 2 * * *', () => {
    console.log('⏰ Exécution programmée du nettoyage des documents...');
    cleanupExpiredDocuments();
  });
  
  console.log('⏰ Nettoyage automatique programmé (tous les jours à 2h)');
};

// Exécution directe si le script est appelé directement
if (require.main === module) {
  cleanupExpiredDocuments()
    .then(() => {
      console.log('🎉 Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  cleanupExpiredDocuments,
  generateCleanupReport,
  deleteExpiredFiles,
  scheduleCleanup
};
