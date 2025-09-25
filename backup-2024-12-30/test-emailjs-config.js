// Script de test pour vérifier la configuration EmailJS
console.log('🔍 Vérification de la configuration EmailJS...');

const emailjsConfig = {
  serviceId: process.env.EMAILJS_SERVICE_ID || 'service_default',
  templateId: process.env.EMAILJS_TEMPLATE_ID || 'template_default',
  userId: process.env.EMAILJS_USER_ID || 'user_default',
  privateKey: process.env.EMAILJS_PRIVATE_KEY || 'jKt0•••••••••••••••••'
};

console.log('📋 Configuration EmailJS:');
console.log('  Service ID:', emailjsConfig.serviceId);
console.log('  Template ID:', emailjsConfig.templateId);
console.log('  User ID:', emailjsConfig.userId);
console.log('  Private Key:', emailjsConfig.privateKey.substring(0, 10) + '...');

// Vérifier si les variables sont configurées
const isConfigured = emailjsConfig.serviceId !== 'service_default' && 
                    emailjsConfig.templateId !== 'template_default' && 
                    emailjsConfig.userId !== 'user_default';

console.log('✅ EmailJS configuré:', isConfigured);

if (!isConfigured) {
  console.log('⚠️ Variables d\'environnement manquantes:');
  if (emailjsConfig.serviceId === 'service_default') console.log('  - EMAILJS_SERVICE_ID');
  if (emailjsConfig.templateId === 'template_default') console.log('  - EMAILJS_TEMPLATE_ID');
  if (emailjsConfig.userId === 'user_default') console.log('  - EMAILJS_USER_ID');
}

// Test de l'API EmailJS
async function testEmailJS() {
  try {
    const testData = {
      to_email: 'test@example.com',
      subject: 'Test EmailJS',
      message: 'Test message',
      from_name: 'Boulangerie Ange - Arras',
      from_email: 'test@boulangerie.fr'
    };

    console.log('🧪 Test de l\'API EmailJS...');
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Boulangerie-Planning-API/1.0',
        'Origin': 'https://boulangerie-planning-api-3.onrender.com'
      },
      body: JSON.stringify({
        service_id: emailjsConfig.serviceId,
        template_id: emailjsConfig.templateId,
        user_id: emailjsConfig.userId,
        accessToken: emailjsConfig.privateKey,
        template_params: testData
      })
    });

    console.log('📊 Réponse EmailJS:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erreur EmailJS:', errorText);
    } else {
      console.log('✅ Test EmailJS réussi');
    }

  } catch (error) {
    console.error('❌ Erreur test EmailJS:', error.message);
  }
}

if (isConfigured) {
  testEmailJS();
} else {
  console.log('⚠️ Test EmailJS ignoré - configuration incomplète');
}
