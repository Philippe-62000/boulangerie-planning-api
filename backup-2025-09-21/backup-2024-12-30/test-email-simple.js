/**
 * Test simple de la configuration email
 * Usage: node test-email-simple.js
 */

const https = require('https');

// Configuration
const API_URL = 'https://boulangerie-planning-api-3.onrender.com';

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
    const result = await makeRequest(`${API_URL}/health`);
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
    const result = await makeRequest(`${API_URL}/api/sick-leaves/test-email`);
    
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
          console.log('🎉 SERVICE EMAIL FONCTIONNEL !');
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

// Fonction principale
async function runTest() {
  console.log('🚀 Test Configuration Email - Boulangerie Planning');
  console.log('=' .repeat(60));
  
  // Test de santé
  const healthOk = await testHealth();
  
  if (!healthOk) {
    console.log('\n❌ API non disponible, arrêt des tests');
    process.exit(1);
  }
  
  // Test email
  const emailOk = await testEmailConfig();
  
  // Résumé
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RÉSUMÉ DU TEST');
  console.log('=' .repeat(60));
  console.log(`🔍 API Health: ${healthOk ? '✅ OK' : '❌ KO'}`);
  console.log(`📧 Email Config: ${emailOk ? '✅ OK' : '❌ KO'}`);
  
  if (emailOk) {
    console.log('\n🎉 SUCCÈS !');
    console.log('✅ Le service email est configuré et fonctionnel');
    console.log('✅ Les emails seront envoyés automatiquement');
  } else {
    console.log('\n⚠️ PROBLÈME DÉTECTÉ');
    console.log('❌ Le service email n\'est pas configuré correctement');
    console.log('📋 Vérifiez:');
    console.log('   1. Variables SMTP sur Render');
    console.log('   2. Installation de nodemailer');
    console.log('   3. Logs Render pour erreurs');
  }
  
  console.log('\n📋 Prochaines étapes:');
  if (!emailOk) {
    console.log('   1. Vérifier les logs Render');
    console.log('   2. Configurer les variables SMTP');
    console.log('   3. Redémarrer le service');
  } else {
    console.log('   1. Tester l\'envoi d\'un email');
    console.log('   2. Vérifier les logs d\'envoi');
  }
}

// Exécution
runTest().catch(error => {
  console.error('❌ Erreur lors des tests:', error.message);
  process.exit(1);
});
