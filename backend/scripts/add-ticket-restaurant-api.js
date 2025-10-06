const axios = require('axios');

async function addTicketRestaurantPermission() {
  try {
    console.log('🔧 Ajout de la permission ticket-restaurant via API...');
    
    // URL de l'API (ajustez selon votre environnement)
    const apiUrl = 'https://boulangerie-planning-api-4-pbfy.onrender.com';
    
    // D'abord, récupérer les permissions existantes
    console.log('📋 Récupération des permissions existantes...');
    const response = await axios.get(`${apiUrl}/api/menu-permissions`);
    
    if (response.data.success) {
      const permissions = response.data.menuPermissions;
      console.log(`✅ ${permissions.length} permissions trouvées`);
      
      // Vérifier si ticket-restaurant existe déjà
      const ticketRestaurantExists = permissions.find(p => p.menuId === 'ticket-restaurant');
      
      if (ticketRestaurantExists) {
        console.log('ℹ️ Permission ticket-restaurant existe déjà');
        console.log('📋 Détails:', {
          menuId: ticketRestaurantExists.menuId,
          menuName: ticketRestaurantExists.menuName,
          isVisibleToAdmin: ticketRestaurantExists.isVisibleToAdmin,
          isVisibleToEmployee: ticketRestaurantExists.isVisibleToEmployee
        });
      } else {
        console.log('❌ Permission ticket-restaurant manquante');
        console.log('🔧 Ajout de la permission...');
        
        // Créer la nouvelle permission
        const newPermission = {
          menuId: 'ticket-restaurant',
          menuName: 'Ticket restaurant',
          menuPath: '/ticket-restaurant',
          isVisibleToAdmin: true,
          isVisibleToEmployee: true,
          requiredPermissions: ['view_meal_expenses'],
          isActive: true,
          order: 13
        };
        
        // Ajouter via l'API (si l'endpoint existe)
        try {
          const addResponse = await axios.post(`${apiUrl}/api/menu-permissions`, newPermission);
          if (addResponse.data.success) {
            console.log('✅ Permission ticket-restaurant ajoutée avec succès');
          } else {
            console.log('❌ Erreur lors de l\'ajout:', addResponse.data.error);
          }
        } catch (apiError) {
          console.log('⚠️ Endpoint d\'ajout non disponible, permission à ajouter manuellement');
          console.log('📋 Permission à ajouter:', newPermission);
        }
      }
      
      // Afficher toutes les permissions
      console.log('📋 Toutes les permissions:');
      permissions.forEach(permission => {
        console.log(`  - ${permission.menuId}: ${permission.menuName} (Admin: ${permission.isVisibleToAdmin}, Employee: ${permission.isVisibleToEmployee})`);
      });
      
    } else {
      console.log('❌ Erreur lors de la récupération des permissions');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('📋 Détails API:', error.response.data);
    }
  }
}

// Exécuter le script
addTicketRestaurantPermission();




