// Script pour corriger les permissions des salariés
const API_URL = 'https://boulangerie-planning-api-3.onrender.com/api';

async function fixEmployeePermissions() {
  try {
    console.log('🔧 Correction des permissions pour les salariés...');
    
    // D'abord, récupérer toutes les permissions
    const response = await fetch(`${API_URL}/menu-permissions/all`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Erreur lors de la récupération des permissions');
    }
    
    console.log(`📋 ${data.menuPermissions.length} permissions récupérées`);
    
    // Définir les permissions correctes pour les salariés
    const employeePermissions = data.menuPermissions.map(permission => {
      let isVisibleToEmployee = false;
      
      // Menus visibles pour les salariés
      const visibleForEmployees = [
        'dashboard',
        'planning', 
        'sales-stats',
        'absences',
        'meal-expenses',
        'km-expenses'
      ];
      
      if (visibleForEmployees.includes(permission.menuId)) {
        isVisibleToEmployee = true;
      }
      
      return {
        _id: permission._id,
        isVisibleToAdmin: permission.isVisibleToAdmin,
        isVisibleToEmployee: isVisibleToEmployee,
        order: permission.order
      };
    });
    
    console.log('📝 Permissions à mettre à jour:');
    employeePermissions.forEach(p => {
      const permission = data.menuPermissions.find(perm => perm._id === p._id);
      console.log(`- ${permission.menuId}: Employee=${p.isVisibleToEmployee}`);
    });
    
    // Mettre à jour les permissions
    const updateResponse = await fetch(`${API_URL}/menu-permissions/batch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permissions: employeePermissions })
    });
    
    const updateResult = await updateResponse.json();
    
    if (updateResult.success) {
      console.log('✅ Permissions des salariés corrigées avec succès');
    } else {
      console.error('❌ Erreur lors de la mise à jour:', updateResult.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter la correction
fixEmployeePermissions();


