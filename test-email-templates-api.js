/**
 * Test de l'API Email Templates
 */

const https = require('https');

console.log('🧪 Test API Email Templates - Boulangerie Planning');
console.log('============================================================');
console.log();

// Test 1: Récupérer tous les templates
console.log('📋 Test 1: Récupérer tous les templates...');

const options = {
  hostname: 'boulangerie-planning-api-3.onrender.com',
  port: 443,
  path: '/api/email-templates',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log('📊 Status Code:', res.statusCode);
  console.log('📋 Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log();
    console.log('📧 Réponse API Email Templates :');
    console.log(data);
    console.log();
    
    if (res.statusCode === 200) {
      console.log('✅ API Email Templates fonctionne !');
      
      try {
        const response = JSON.parse(data);
        if (response.success && response.templates) {
          console.log(`📊 ${response.templates.length} templates trouvés`);
          
          if (response.templates.length === 0) {
            console.log('⚠️ Aucun template trouvé - initialisation nécessaire');
            testInitializeTemplates();
          } else {
            console.log('✅ Templates disponibles :');
            response.templates.forEach((template, index) => {
              console.log(`   ${index + 1}. ${template.displayName} (${template.name})`);
            });
          }
        }
      } catch (error) {
        console.log('⚠️ Erreur parsing JSON:', error.message);
      }
    } else {
      console.log('❌ Erreur API Email Templates :');
      console.log('Status:', res.statusCode);
      console.log('Réponse:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion :', error.message);
});

req.end();

// Test 2: Initialiser les templates par défaut
function testInitializeTemplates() {
  console.log();
  console.log('🚀 Test 2: Initialiser les templates par défaut...');
  
  const postOptions = {
    hostname: 'boulangerie-planning-api-3.onrender.com',
    port: 443,
    path: '/api/email-templates/initialize-defaults',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const postReq = https.request(postOptions, (res) => {
    console.log('📊 Status Code:', res.statusCode);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log();
      console.log('📧 Réponse Initialisation :');
      console.log(data);
      console.log();
      
      if (res.statusCode === 200) {
        console.log('✅ Templates initialisés avec succès !');
        
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('📊 Message:', response.message);
            if (response.templates) {
              console.log(`📊 ${response.templates.length} templates créés`);
            }
          }
        } catch (error) {
          console.log('⚠️ Erreur parsing JSON:', error.message);
        }
      } else {
        console.log('❌ Erreur initialisation :');
        console.log('Status:', res.statusCode);
        console.log('Réponse:', data);
      }
    });
  });
  
  postReq.on('error', (error) => {
    console.error('❌ Erreur de connexion :', error.message);
  });
  
  postReq.end();
}

console.log('⏳ Test en cours...');
