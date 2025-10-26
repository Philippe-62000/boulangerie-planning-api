#!/usr/bin/env node

/**
 * Script de configuration NAS pour les documents
 * Usage: node scripts/setup-nas.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NAS_BASE_PATH = process.env.NAS_BASE_PATH || '/mnt/nas/documents';
const NAS_USERNAME = process.env.NAS_USERNAME || 'admin';
const NAS_PASSWORD = process.env.NAS_PASSWORD || 'password';
const NAS_SERVER = process.env.NAS_SERVER || '//nas-server/documents';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Créer la structure de dossiers
function createDirectoryStructure() {
  log('📁 Création de la structure de dossiers...', 'cyan');
  
  const directories = [
    'general',
    'general/notices',
    'general/procedures',
    'general/training',
    'general/regulations',
    'personal',
    'personal/payslips',
    'personal/contracts',
    'personal/certificates',
    'personal/other',
    'temp'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(NAS_BASE_PATH, dir);
    
    try {
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        log(`✅ Créé: ${dir}`, 'green');
      } else {
        log(`📁 Existe déjà: ${dir}`, 'yellow');
      }
    } catch (error) {
      log(`❌ Erreur création ${dir}: ${error.message}`, 'red');
    }
  });
}

// Créer le fichier de configuration
function createConfigFile() {
  log('⚙️  Création du fichier de configuration...', 'cyan');
  
  const config = {
    nas: {
      basePath: NAS_BASE_PATH,
      server: NAS_SERVER,
      username: NAS_USERNAME,
      password: NAS_PASSWORD
    },
    documents: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'txt'],
      personalExpiryDays: 30
    },
    paths: {
      general: '/general',
      personal: '/personal',
      temp: '/temp'
    }
  };
  
  const configPath = path.join(process.cwd(), 'config', 'nas-config.json');
  const configDir = path.dirname(configPath);
  
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    log(`✅ Configuration sauvegardée: ${configPath}`, 'green');
  } catch (error) {
    log(`❌ Erreur sauvegarde config: ${error.message}`, 'red');
  }
}

// Créer le script de montage
function createMountScript() {
  log('🔧 Création du script de montage NAS...', 'cyan');
  
  const mountScript = `#!/bin/bash

# Script de montage NAS pour les documents
# Usage: ./scripts/mount-nas.sh

set -e

NAS_SERVER="${NAS_SERVER}"
NAS_BASE_PATH="${NAS_BASE_PATH}"
NAS_USERNAME="${NAS_USERNAME}"
NAS_PASSWORD="${NAS_PASSWORD}"

echo "🔧 Montage du NAS..."

# Créer le point de montage s'il n'existe pas
sudo mkdir -p "${NAS_BASE_PATH}"

# Monter le partage Samba
sudo mount -t cifs "${NAS_SERVER}" "${NAS_BASE_PATH}" \\
  -o username="${NAS_USERNAME}",password="${NAS_PASSWORD}",uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777

# Vérifier le montage
if mountpoint -q "${NAS_BASE_PATH}"; then
    echo "✅ NAS monté avec succès sur ${NAS_BASE_PATH}"
    
    # Configurer les permissions
    sudo chown -R 1000:1000 "${NAS_BASE_PATH}"
    sudo chmod -R 755 "${NAS_BASE_PATH}"
    
    echo "✅ Permissions configurées"
else
    echo "❌ Erreur lors du montage du NAS"
    exit 1
fi

echo "🎉 Configuration NAS terminée!"
`;

  const scriptPath = path.join(process.cwd(), 'scripts', 'mount-nas.sh');
  
  try {
    fs.writeFileSync(scriptPath, mountScript);
    fs.chmodSync(scriptPath, '755');
    log(`✅ Script de montage créé: ${scriptPath}`, 'green');
  } catch (error) {
    log(`❌ Erreur création script: ${error.message}`, 'red');
  }
}

// Créer le fichier .env
function createEnvFile() {
  log('🔐 Création du fichier .env...', 'cyan');
  
  const envContent = `# Configuration NAS
NAS_BASE_PATH=${NAS_BASE_PATH}
NAS_SERVER=${NAS_SERVER}
NAS_USERNAME=${NAS_USERNAME}
NAS_PASSWORD=${NAS_PASSWORD}

# Configuration Documents
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png,txt
PERSONAL_DOCS_EXPIRY_DAYS=30

# API Configuration
API_URL=https://boulangerie-planning-api-4-pbfy.onrender.com/api
ADMIN_TOKEN=your-admin-token-here
`;

  const envPath = path.join(process.cwd(), '.env.nas');
  
  try {
    fs.writeFileSync(envPath, envContent);
    log(`✅ Fichier .env créé: ${envPath}`, 'green');
  } catch (error) {
    log(`❌ Erreur création .env: ${error.message}`, 'red');
  }
}

// Créer le script de test
function createTestScript() {
  log('🧪 Création du script de test...', 'cyan');
  
  const testScript = `#!/usr/bin/env node

/**
 * Script de test de la configuration NAS
 */

const fs = require('fs');
const path = require('path');

const NAS_BASE_PATH = process.env.NAS_BASE_PATH || '${NAS_BASE_PATH}';

console.log('🧪 Test de la configuration NAS...');

// Test 1: Vérifier l'existence du dossier
if (fs.existsSync(NAS_BASE_PATH)) {
    console.log('✅ Dossier NAS accessible');
} else {
    console.log('❌ Dossier NAS non accessible');
    process.exit(1);
}

// Test 2: Vérifier les permissions d'écriture
try {
    const testFile = path.join(NAS_BASE_PATH, 'test-write.txt');
    fs.writeFileSync(testFile, 'Test d\\'écriture');
    fs.unlinkSync(testFile);
    console.log('✅ Permissions d\\'écriture OK');
} catch (error) {
    console.log('❌ Pas de permissions d\\'écriture:', error.message);
}

// Test 3: Vérifier la structure des dossiers
const requiredDirs = [
    'general',
    'personal',
    'temp'
];

requiredDirs.forEach(dir => {
    const dirPath = path.join(NAS_BASE_PATH, dir);
    if (fs.existsSync(dirPath)) {
        console.log(\`✅ Dossier \${dir} existe\`);
    } else {
        console.log(\`❌ Dossier \${dir} manquant\`);
    }
});

console.log('🎉 Tests terminés!');
`;

  const scriptPath = path.join(process.cwd(), 'scripts', 'test-nas.js');
  
  try {
    fs.writeFileSync(scriptPath, testScript);
    fs.chmodSync(scriptPath, '755');
    log(`✅ Script de test créé: ${scriptPath}`, 'green');
  } catch (error) {
    log(`❌ Erreur création script test: ${error.message}`, 'red');
  }
}

// Fonction principale
function setupNAS() {
  log('🚀 Configuration du NAS pour les documents', 'bright');
  log(`📁 Chemin NAS: ${NAS_BASE_PATH}`, 'blue');
  log(`🖥️  Serveur: ${NAS_SERVER}`, 'blue');
  
  try {
    createDirectoryStructure();
    createConfigFile();
    createMountScript();
    createEnvFile();
    createTestScript();
    
    log('\n🎉 Configuration NAS terminée!', 'green');
    log('\n📋 Prochaines étapes:', 'yellow');
    log('1. Configurer les variables d\'environnement dans .env.nas', 'blue');
    log('2. Exécuter: chmod +x scripts/mount-nas.sh', 'blue');
    log('3. Exécuter: ./scripts/mount-nas.sh', 'blue');
    log('4. Tester: node scripts/test-nas.js', 'blue');
    
  } catch (error) {
    log(`❌ Erreur lors de la configuration: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Point d'entrée
if (require.main === module) {
  setupNAS();
}

module.exports = { setupNAS, createDirectoryStructure, createConfigFile };

