#!/usr/bin/env node

/**
 * Script pour créer le dossier uploads sur le serveur
 */

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');
const documentsDir = path.join(uploadsDir, 'documents');
const tempDir = path.join(uploadsDir, 'temp');

console.log('📁 Création des dossiers uploads...');

try {
  // Créer le dossier uploads principal
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Dossier uploads créé');
  } else {
    console.log('📁 Dossier uploads existe déjà');
  }

  // Créer le dossier documents
  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
    console.log('✅ Dossier documents créé');
  } else {
    console.log('📁 Dossier documents existe déjà');
  }

  // Créer les sous-dossiers
  const subDirs = [
    path.join(documentsDir, 'general'),
    path.join(documentsDir, 'personal'),
    path.join(uploadsDir, 'temp')
  ];

  subDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Dossier ${path.basename(dir)} créé`);
    } else {
      console.log(`📁 Dossier ${path.basename(dir)} existe déjà`);
    }
  });

  console.log('🎉 Structure des dossiers créée avec succès!');
  console.log('📁 Structure:');
  console.log('  uploads/');
  console.log('  ├── documents/');
  console.log('  │   ├── general/');
  console.log('  │   └── personal/');
  console.log('  └── temp/');

} catch (error) {
  console.error('❌ Erreur lors de la création des dossiers:', error.message);
  process.exit(1);
}

