// Script pour forcer la recréation des permissions par défaut
const API_URL = 'https://boulangerie-planning-api-3.onrender.com/api';

async function recreatePermissions() {
  try {
    console.log('🔄 Recréation des permissions par défaut...');
    
    const response = await fetch(`${API_URL}/menu-permissions/recreate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Permissions recréées avec succès:', result.message);
      console.log('📋 Permissions créées:', result.menuPermissions.length);
      
      // Afficher les permissions créées
      result.menuPermissions.forEach(permission => {
        console.log(`- ${permission.menuId}: Admin=${permission.isVisibleToAdmin}, Employee=${permission.isVisibleToEmployee}`);
      });
    } else {
      console.error('❌ Erreur lors de la recréation:', result.error);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
recreatePermissions();


