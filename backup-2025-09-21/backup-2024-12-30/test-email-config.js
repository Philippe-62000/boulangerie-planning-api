/**
 * Script de test pour la configuration du service email
 * Usage: node test-email-config.js
 */

const https = require('https');

// Configuration
const API_BASE_URL = 'https://boulangerie-planning-api-3.onrender.com';
const ENDPOINTS = {
  health: '/health',
  testEmail: '/api/sick-leaves/test-email',
  testSftp: '/api/sick-leaves/test-sftp'
};

// Fonction pour faire une requête HTTPS
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Test de santé de l'API
async function testHealth() {
  console.log('🔍 Test de santé de l\'API...');
  try {
    const result = await makeRequest(`${API_BASE_URL}${ENDPOINTS.health}`);
    if (result.status === 200) {
      console.log('✅ API en ligne');
      return true;
    } else {
      console.log(`❌ API non disponible (status: ${result.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur connexion API: ${error.message}`);
    return false;
  }
}

// Test de configuration email
async function testEmailConfig() {
  console.log('\n📧 Test de configuration email...');
  try {
    const result = await makeRequest(`${API_BASE_URL}${ENDPOINTS.testEmail}`);
    
    if (result.status === 200 && result.data.success) {
      const config = result.data.config;
      
      console.log('✅ Test email réussi');
      console.log(`📊 Configuration:`);
      console.log(`   - SMTP Host: ${config.smtpHost}`);
      console.log(`   - SMTP Port: ${config.smtpPort}`);
      console.log(`   - SMTP User: ${config.smtpUser}`);
      console.log(`   - Configuré: ${config.configured ? 'Oui' : 'Non'}`);
      
      if (config.connectionTest) {
        if (config.connectionTest.success) {
          console.log('✅ Connexion SMTP vérifiée');
        } else {
          console.log(`❌ Connexion SMTP échouée: ${config.connectionTest.error}`);
        }
      }
      
      return config.configured && config.connectionTest?.success;
    } else {
      console.log(`❌ Test email échoué (status: ${result.status})`);
      if (result.data.error) {
        console.log(`   Erreur: ${result.data.error}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur test email: ${error.message}`);
    return false;
  }
}

// Test de configuration SFTP
async function testSftpConfig() {
  console.log('\n📁 Test de configuration SFTP...');
  try {
    const result = await makeRequest(`${API_BASE_URL}${ENDPOINTS.testSftp}`);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Test SFTP réussi');
      console.log(`📊 Détails: ${result.data.details}`);
      return true;
    } else {
      console.log(`❌ Test SFTP échoué (status: ${result.status})`);
      if (result.data.error) {
        console.log(`   Erreur: ${result.data.error}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur test SFTP: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Test de configuration - Boulangerie Planning API');
  console.log('=' .repeat(60));
  
  const results = {
    health: false,
    email: false,
    sftp: false
  };
  
  // Test de santé
  results.health = await testHealth();
  
  if (!results.health) {
    console.log('\n❌ API non disponible, arrêt des tests');
    process.exit(1);
  }
  
  // Test email
  results.email = await testEmailConfig();
  
  // Test SFTP
  results.sftp = await testSftpConfig();
  
  // Résumé
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('=' .repeat(60));
  console.log(`🔍 API Health: ${results.health ? '✅ OK' : '❌ KO'}`);
  console.log(`📧 Email Config: ${results.email ? '✅ OK' : '❌ KO'}`);
  console.log(`📁 SFTP Config: ${results.sftp ? '✅ OK' : '❌ KO'}`);
  
  if (results.email && results.sftp) {
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('✅ Le service email est configuré et fonctionnel');
    console.log('✅ Le service SFTP est configuré et fonctionnel');
  } else {
    console.log('\n⚠️ CONFIGURATION INCOMPLÈTE');
    if (!results.email) {
      console.log('❌ Service email non configuré');
      console.log('   → Configurer les variables SMTP sur Render');
    }
    if (!results.sftp) {
      console.log('❌ Service SFTP non configuré');
      console.log('   → Configurer la variable SFTP_PASSWORD sur Render');
    }
  }
  
  console.log('\n📋 Prochaines étapes:');
  if (!results.email) {
    console.log('   1. Aller sur https://dashboard.render.com');
    console.log('   2. Sélectionner boulangerie-planning-api-3');
    console.log('   3. Ajouter les variables SMTP dans Environment');
    console.log('   4. Redémarrer le service');
  }
  if (!results.sftp) {
    console.log('   5. Ajouter la variable SFTP_PASSWORD');
  }
  
  console.log('\n🔗 Liens utiles:');
  console.log('   - Render Dashboard: https://dashboard.render.com');
  console.log('   - Documentation: CONFIGURATION-EMAIL.md');
}

// Exécution
runTests().catch(error => {
  console.error('❌ Erreur lors des tests:', error.message);
  process.exit(1);
});
