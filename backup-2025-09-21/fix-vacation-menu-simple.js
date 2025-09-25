const https = require('https');

async function fixVacationMenu() {
  try {
    console.log('🔧 Correction du menu Gestion des Congés...');
    
    const options = {
      hostname: 'boulangerie-planning-api-4-pbfy.onrender.com',
      port: 443,
      path: '/api/menu-permissions/recreate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Réponse du serveur:', response.message);
          
          if (response.menuPermissions) {
            console.log('📋 Permissions créées:');
            response.menuPermissions.forEach(p => {
              console.log(`  - ${p.menuId}: ${p.menuName} (admin: ${p.isVisibleToAdmin}, employee: ${p.isVisibleToEmployee})`);
            });
          }
        } catch (error) {
          console.error('❌ Erreur parsing réponse:', error);
          console.log('📄 Réponse brute:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur requête:', error);
    });

    req.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

fixVacationMenu();
