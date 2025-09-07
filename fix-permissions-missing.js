// Fix des permissions manquantes
const fixPermissions = async () => {
  try {
    console.log('🔧 Recréation des permissions par défaut...');
    
    const response = await fetch('https://boulangerie-planning-api-3.onrender.com/api/menu-permissions/recreate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.filmara.fr'
      }
    });
    
    console.log('📊 Status:', response.status);
    
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Permissions recréées avec succès !');
      console.log(`📋 ${data.menuPermissions.length} permissions créées`);
      
      // Afficher toutes les permissions
      data.menuPermissions.forEach(perm => {
        console.log(`  - ${perm.menuId}: admin=${perm.isVisibleToAdmin}, employee=${perm.isVisibleToEmployee}`);
      });
    } else {
      console.log('❌ Erreur lors de la recréation:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

fixPermissions();
