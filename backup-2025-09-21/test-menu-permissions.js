// Script pour tester les permissions de menu
const API_URL = 'https://boulangerie-planning-api-3.onrender.com/api';

async function testMenuPermissions() {
  try {
    console.log('🔍 Test des permissions de menu pour admin...');
    
    const response = await fetch(`${API_URL}/menu-permissions?role=admin`);
    
    console.log('📡 Réponse reçue:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Données reçues:', data);
    
    if (data.success && data.menuPermissions) {
      console.log(`✅ ${data.menuPermissions.length} permissions récupérées pour admin:`);
      
      data.menuPermissions.forEach(permission => {
        console.log(`- ${permission.menuId}: Admin=${permission.isVisibleToAdmin}, Employee=${permission.isVisibleToEmployee}`);
      });
      
      // Vérifier spécifiquement sick-leave-management
      const sickLeavePermission = data.menuPermissions.find(p => p.menuId === 'sick-leave-management');
      if (sickLeavePermission) {
        console.log('✅ Permission sick-leave-management trouvée:', sickLeavePermission);
      } else {
        console.log('❌ Permission sick-leave-management NON trouvée');
      }
    } else {
      console.error('❌ Réponse API invalide:', data);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le test
testMenuPermissions();


