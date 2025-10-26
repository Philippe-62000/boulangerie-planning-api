#!/usr/bin/env node

/**
 * Script d'upload par lot pour les fiches de paie
 * Usage: node scripts/batch-upload-payslips.js /chemin/vers/fiches-de-paie/
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://boulangerie-planning-api-4-pbfy.onrender.com/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

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

// Extraire le nom de l'employé du nom du fichier
function extractEmployeeName(filename) {
  // Supprimer l'extension
  const nameWithoutExt = path.parse(filename).name;
  
  // Patterns de reconnaissance
  const patterns = [
    // Format: Nom_Prenom_MoisAnnee
    /^([A-Za-zÀ-ÿ]+)_([A-Za-zÀ-ÿ]+)_/,
    // Format: Prenom_Nom_MoisAnnee
    /^([A-Za-zÀ-ÿ]+)_([A-Za-zÀ-ÿ]+)_/,
    // Format: NomPrenom_MoisAnnee
    /^([A-Za-zÀ-ÿ]+)([A-Z][a-zÀ-ÿ]+)_/,
    // Format: PrenomNom_MoisAnnee
    /^([A-Z][a-zÀ-ÿ]+)([A-Z][a-zÀ-ÿ]+)_/
  ];
  
  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      if (match.length === 3) {
        return `${match[1]} ${match[2]}`;
      } else if (match.length === 2) {
        return `${match[1]} ${match[2]}`;
      }
    }
  }
  
  // Si aucun pattern ne correspond, essayer de séparer par underscore
  const parts = nameWithoutExt.split('_');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  
  return null;
}

// Trouver un employé par nom
async function findEmployeeByName(name) {
  try {
    const response = await fetch(`${API_URL}/employees`);
    const data = await response.json();
    
    if (data.success && data.data) {
      // Recherche exacte d'abord
      let employee = data.data.find(emp => 
        emp.name.toLowerCase() === name.toLowerCase()
      );
      
      if (employee) return employee._id;
      
      // Recherche partielle
      const nameParts = name.toLowerCase().split(' ');
      employee = data.data.find(emp => {
        const empNameParts = emp.name.toLowerCase().split(' ');
        return nameParts.every(part => 
          empNameParts.some(empPart => empPart.includes(part))
        );
      });
      
      if (employee) return employee._id;
    }
    
    return null;
  } catch (error) {
    log(`Erreur lors de la recherche d'employé: ${error.message}`, 'red');
    return null;
  }
}

// Uploader un fichier
async function uploadFile(filePath, employeeId, employeeName) {
  try {
    const formData = new FormData();
    const filename = path.basename(filePath);
    const title = path.parse(filename).name;
    
    formData.append('employeeId', employeeId);
    formData.append('title', title);
    formData.append('category', 'payslip');
    formData.append('type', 'personal');
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      log(`✅ ${filename} → ${employeeName}`, 'green');
      return { success: true, filename, employeeName };
    } else {
      log(`❌ ${filename} → Erreur: ${result.message}`, 'red');
      return { success: false, filename, error: result.message };
    }
  } catch (error) {
    log(`❌ ${filename} → Erreur réseau: ${error.message}`, 'red');
    return { success: false, filename, error: error.message };
  }
}

// Fonction principale
async function batchUploadPayslips(directoryPath) {
  log('🚀 Démarrage de l\'upload par lot des fiches de paie', 'cyan');
  log(`📁 Dossier source: ${directoryPath}`, 'blue');
  
  // Vérifier que le dossier existe
  if (!fs.existsSync(directoryPath)) {
    log(`❌ Le dossier ${directoryPath} n'existe pas`, 'red');
    process.exit(1);
  }
  
  // Lire les fichiers du dossier
  const files = fs.readdirSync(directoryPath);
  const pdfFiles = files.filter(file => 
    file.toLowerCase().endsWith('.pdf') && 
    !file.startsWith('.')
  );
  
  if (pdfFiles.length === 0) {
    log('❌ Aucun fichier PDF trouvé dans le dossier', 'red');
    process.exit(1);
  }
  
  log(`📄 ${pdfFiles.length} fichiers PDF trouvés`, 'yellow');
  
  // Statistiques
  let successCount = 0;
  let errorCount = 0;
  const results = [];
  
  // Traiter chaque fichier
  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i];
    const filePath = path.join(directoryPath, file);
    
    log(`\n📤 Traitement ${i + 1}/${pdfFiles.length}: ${file}`, 'blue');
    
    // Extraire le nom de l'employé
    const employeeName = extractEmployeeName(file);
    
    if (!employeeName) {
      log(`⚠️  Impossible d'extraire le nom de l'employé de: ${file}`, 'yellow');
      results.push({ 
        success: false, 
        filename: file, 
        error: 'Nom d\'employé non reconnu' 
      });
      errorCount++;
      continue;
    }
    
    log(`👤 Employé détecté: ${employeeName}`, 'cyan');
    
    // Trouver l'ID de l'employé
    const employeeId = await findEmployeeByName(employeeName);
    
    if (!employeeId) {
      log(`⚠️  Employé non trouvé: ${employeeName}`, 'yellow');
      results.push({ 
        success: false, 
        filename: file, 
        employeeName,
        error: 'Employé non trouvé dans la base' 
      });
      errorCount++;
      continue;
    }
    
    // Uploader le fichier
    const result = await uploadFile(filePath, employeeId, employeeName);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pause entre les uploads pour éviter la surcharge
    if (i < pdfFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Afficher le résumé
  log('\n📊 Résumé de l\'upload par lot:', 'bright');
  log(`✅ Succès: ${successCount}`, 'green');
  log(`❌ Erreurs: ${errorCount}`, 'red');
  
  // Afficher les détails des erreurs
  if (errorCount > 0) {
    log('\n❌ Détails des erreurs:', 'red');
    results
      .filter(r => !r.success)
      .forEach(r => {
        log(`  • ${r.filename}: ${r.error}`, 'red');
      });
  }
  
  // Afficher les succès
  if (successCount > 0) {
    log('\n✅ Fichiers uploadés avec succès:', 'green');
    results
      .filter(r => r.success)
      .forEach(r => {
        log(`  • ${r.filename} → ${r.employeeName}`, 'green');
      });
  }
  
  log('\n🎉 Upload par lot terminé!', 'cyan');
}

// Point d'entrée
if (require.main === module) {
  const directoryPath = process.argv[2];
  
  if (!directoryPath) {
    log('❌ Usage: node scripts/batch-upload-payslips.js /chemin/vers/fiches-de-paie/', 'red');
    log('📝 Exemple: node scripts/batch-upload-payslips.js ./fiches-paie-janvier/', 'yellow');
    process.exit(1);
  }
  
  // Vérifier le token d'administration
  if (ADMIN_TOKEN === 'your-admin-token-here') {
    log('⚠️  Veuillez configurer ADMIN_TOKEN dans les variables d\'environnement', 'yellow');
    log('📝 Exemple: export ADMIN_TOKEN="votre-token-admin"', 'blue');
  }
  
  batchUploadPayslips(directoryPath).catch(error => {
    log(`❌ Erreur fatale: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { batchUploadPayslips, extractEmployeeName, findEmployeeByName };

