const Client = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');

// Charger la configuration OVH
const ovhConfig = require('./ovh-config');

// Configuration SFTP
const config = {
  host: ovhConfig.host,
  port: ovhConfig.port,
  username: ovhConfig.username,
  password: ovhConfig.password,
  // Si vous utilisez une clé privée, décommentez la ligne suivante :
  // privateKey: ovhConfig.privateKey
};

const sftp = new Client();

async function uploadToOVH() {
  try {
    console.log('🔌 Connexion à OVH...');
    await sftp.connect(config);
    console.log('✅ Connecté à OVH !');

    // Upload du frontend
    console.log('📁 Upload du frontend...');
    const localFrontendPath = path.join(__dirname, 'deploy', 'www');
    const remoteFrontendPath = ovhConfig.remotePaths.frontend;
    
    await sftp.uploadDir(localFrontendPath, remoteFrontendPath);
    console.log('✅ Frontend uploadé !');

    // Upload du backend
    console.log('📁 Upload du backend...');
    const localBackendPath = path.join(__dirname, 'deploy', 'api');
    const remoteBackendPath = ovhConfig.remotePaths.backend;
    
    await sftp.uploadDir(localBackendPath, remoteBackendPath);
    console.log('✅ Backend uploadé !');

    console.log('🎉 Upload terminé avec succès !');
    
  } catch (err) {
    console.error('❌ Erreur lors de l\'upload:', err.message);
  } finally {
    await sftp.end();
    console.log('🔌 Connexion fermée.');
  }
}

// Vérifier que le dossier deploy existe
if (!fs.existsSync(path.join(__dirname, 'deploy'))) {
  console.error('❌ Le dossier "deploy" n\'existe pas. Exécutez d\'abord build-for-ovh.bat');
  process.exit(1);
}

console.log('🚀 Démarrage de l\'upload vers OVH...');
uploadToOVH();
