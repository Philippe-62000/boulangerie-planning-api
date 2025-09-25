const SftpClient = require('ssh2-sftp-client'); 
const path = require('path'); 
const fs = require('fs'); 
 
async function uploadToNAS() { 
  const client = new SftpClient(); 
  try { 
    console.log('🔌 Connexion au NAS...'); 
    await client.connect({ 
      host: 'philange.synology.me', 
      username: 'nHEIGHTn', 
      password: process.env.SFTP_PASSWORD, 
      port: 22, 
      readyTimeout: 20000 
    }); 
    console.log('✅ Connecté au NAS'); 
 
    const remotePath = '/sauvegarde/backup-2025-09-21'; 
    console.log('📁 Création du dossier:', remotePath); 
    try { 
      await client.mkdir(remotePath, true); 
    } catch (err) { 
      console.log('📁 Dossier existe déjà ou créé'); 
    } 
 
    console.log('📤 Upload des fichiers...'); 
    await client.uploadDir('./backup-2025-09-21', remotePath); 
    console.log('✅ Upload terminé'); 
 
    await client.end(); 
    console.log('✅ Sauvegarde NAS terminée !'); 
  } catch (error) { 
    console.error('❌ Erreur SFTP:', error.message); 
    process.exit(1); 
  } 
} 
 
uploadToNAS(); 
