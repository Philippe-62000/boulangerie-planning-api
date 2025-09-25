/**
 * Test direct EmailJS - Boulangerie Planning
 * Teste EmailJS sans passer par l'API
 */

const https = require('https');

// Configuration EmailJS
const emailjsConfig = {
  serviceId: process.env.EMAILJS_SERVICE_ID || 'gmail',
  templateId: process.env.EMAILJS_TEMPLATE_ID || 'template_sick_leave',
  userId: process.env.EMAILJS_USER_ID || 'EHw0fFSAwQ_4SfY6Z',
  privateKey: process.env.EMAILJS_PRIVATE_KEY || 'jKt0•••••••••••••••••'
};

console.log('🚀 Test Direct EmailJS - Boulangerie Planning');
console.log('============================================================');
console.log();

console.log('📋 Configuration EmailJS :');
console.log('Service ID:', emailjsConfig.serviceId);
console.log('Template ID:', emailjsConfig.templateId);
console.log('User ID:', emailjsConfig.userId);
console.log('Private Key:', emailjsConfig.privateKey.substring(0, 8) + '•••••••••••••••••');
console.log();

// Données de test
const testEmailData = {
  service_id: emailjsConfig.serviceId,
  template_id: emailjsConfig.templateId,
  user_id: emailjsConfig.userId,
  accessToken: emailjsConfig.privateKey,
  template_params: {
    to_email: 'arras.boulangerie.ange@gmail.com',
    subject: 'Test EmailJS - Boulangerie Planning',
    message: 'Ceci est un test de l\'envoi d\'email via EmailJS.',
    from_name: 'Boulangerie Ange - Arras',
    from_email: 'arras.boulangerie.ange@gmail.com'
  }
};

console.log('📧 Données de test :');
console.log('To:', testEmailData.template_params.to_email);
console.log('Subject:', testEmailData.template_params.subject);
console.log('Message:', testEmailData.template_params.message);
console.log();

// Test d'envoi
console.log('🔄 Test d\'envoi EmailJS...');

const postData = JSON.stringify(testEmailData);

const options = {
  hostname: 'api.emailjs.com',
  port: 443,
  path: '/api/v1.0/email/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
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
    console.log('📧 Réponse EmailJS :');
    console.log(data);
    console.log();
    
    if (res.statusCode === 200) {
      console.log('✅ EmailJS fonctionne correctement !');
      console.log('📧 Email envoyé avec succès');
    } else {
      console.log('❌ Erreur EmailJS :');
      console.log('Status:', res.statusCode);
      console.log('Réponse:', data);
      
      if (res.statusCode === 403) {
        console.log();
        console.log('🔧 SOLUTIONS POUR ERREUR 403 :');
        console.log('1. Vérifier que le service Gmail existe sur EmailJS');
        console.log('2. Vérifier que le template template_sick_leave existe');
        console.log('3. Vérifier les variables d\'environnement sur Render');
        console.log('4. S\'assurer que le service Gmail est connecté');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion :', error.message);
});

req.write(postData);
req.end();

console.log('⏳ Envoi en cours...');
