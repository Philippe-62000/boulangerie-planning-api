// Test de l'API des permissions
const testPermissions = async () => {
  try {
    console.log('🔍 Test API permissions admin...');
    
    const response = await fetch('https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=admin', {
      headers: {
        'Origin': 'https://www.filmara.fr'
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.menuPermissions) {
      console.log('✅ Permissions trouvées:', data.menuPermissions.length);
      data.menuPermissions.forEach(perm => {
        console.log(`  - ${perm.menuId}: admin=${perm.isVisibleToAdmin}, employee=${perm.isVisibleToEmployee}`);
      });
    } else {
      console.log('❌ Pas de permissions dans la réponse');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testPermissions();
