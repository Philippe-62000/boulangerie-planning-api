// Script pour tester les permissions de menu pour les salariés
const API_URL = 'https://boulangerie-planning-api-3.onrender.com/api';

async function testEmployeePermissions() {
  try {
    console.log('🔍 Test des permissions de menu pour employee...');
    
    const response = await fetch(`${API_URL}/menu-permissions?role=employee`);
    
    console.log('📡 Réponse reçue:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 Données reçues:', data);
    
    if (data.success && data.menuPermissions) {
      console.log(`✅ ${data.menuPermissions.length} permissions récupérées pour employee:`);
      
      data.menuPermissions.forEach(permission => {
        console.log(`- ${permission.menuId}: Admin=${permission.isVisibleToAdmin}, Employee=${permission.isVisibleToEmployee}`);
      });
      
      // Vérifier les menus qui ne devraient PAS être visibles pour les salariés
      const restrictedMenus = ['employees', 'constraints', 'parameters', 'employee-status-print', 'sick-leave-management'];
      
      console.log('\n🔍 Vérification des menus restreints:');
      restrictedMenus.forEach(menuId => {
        const permission = data.menuPermissions.find(p => p.menuId === menuId);
        if (permission) {
          if (permission.isVisibleToEmployee) {
            console.log(`❌ ${menuId}: VISIBLE pour les salariés (ne devrait pas l'être)`);
          } else {
            console.log(`✅ ${menuId}: NON visible pour les salariés (correct)`);
          }
        } else {
          console.log(`⚠️ ${menuId}: Permission non trouvée`);
        }
      });
    } else {
      console.error('❌ Réponse API invalide:', data);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le test
testEmployeePermissions();


