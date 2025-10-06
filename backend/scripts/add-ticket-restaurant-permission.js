const mongoose = require('mongoose');
const config = require('../config');

// Modèle MenuPermissions
const menuPermissionsSchema = new mongoose.Schema({
  menuId: String,
  menuName: String,
  menuPath: String,
  isVisibleToAdmin: Boolean,
  isVisibleToEmployee: Boolean,
  requiredPermissions: [String],
  isActive: Boolean,
  order: Number
}, { timestamps: true });

const MenuPermissions = mongoose.model('MenuPermissions', menuPermissionsSchema);

async function addTicketRestaurantPermission() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connecté à MongoDB');
    
    // Vérifier si la permission existe déjà
    const existingPermission = await MenuPermissions.findOne({ menuId: 'ticket-restaurant' });
    
    if (existingPermission) {
      console.log('ℹ️ Permission ticket-restaurant existe déjà');
      console.log('📋 Détails:', {
        menuId: existingPermission.menuId,
        menuName: existingPermission.menuName,
        isVisibleToAdmin: existingPermission.isVisibleToAdmin,
        isVisibleToEmployee: existingPermission.isVisibleToEmployee
      });
    } else {
      // Créer la permission
      const ticketRestaurantPermission = new MenuPermissions({
        menuId: 'ticket-restaurant',
        menuName: 'Ticket restaurant',
        menuPath: '/ticket-restaurant',
        isVisibleToAdmin: true,
        isVisibleToEmployee: true,
        requiredPermissions: ['view_meal_expenses'],
        isActive: true,
        order: 13
      });
      
      await ticketRestaurantPermission.save();
      console.log('✅ Permission ticket-restaurant ajoutée avec succès');
    }
    
    // Vérifier toutes les permissions
    const allPermissions = await MenuPermissions.find().sort({ order: 1 });
    console.log('📋 Toutes les permissions:');
    allPermissions.forEach(permission => {
      console.log(`  - ${permission.menuId}: ${permission.menuName} (Admin: ${permission.isVisibleToAdmin}, Employee: ${permission.isVisibleToEmployee})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion MongoDB');
  }
}

// Exécuter le script
addTicketRestaurantPermission();



