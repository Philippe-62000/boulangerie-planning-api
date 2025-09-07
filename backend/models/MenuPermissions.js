const mongoose = require('mongoose');

const menuPermissionsSchema = new mongoose.Schema({
  menuId: {
    type: String,
    required: true,
    unique: true
  },
  menuName: {
    type: String,
    required: true
  },
  menuPath: {
    type: String,
    required: true
  },
  isVisibleToAdmin: {
    type: Boolean,
    default: true
  },
  isVisibleToEmployee: {
    type: Boolean,
    default: false
  },
  requiredPermissions: [{
    type: String,
    enum: [
      'all',
      'view_planning',
      'view_absences', 
      'view_sales_stats',
      'view_meal_expenses',
      'view_km_expenses',
      'manage_employees',
      'manage_parameters',
      'manage_planning',
      'view_reports'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Méthode statique pour créer les permissions de menu par défaut
menuPermissionsSchema.statics.createDefaultPermissions = async function() {
  try {
    // Vérifier si des permissions existent déjà
    const existingPermissions = await this.countDocuments();
    
    if (existingPermissions === 0) {
      const defaultMenus = [
        {
          menuId: 'dashboard',
          menuName: 'Tableau de bord',
          menuPath: '/dashboard',
          isVisibleToAdmin: true,
          isVisibleToEmployee: true,
          requiredPermissions: ['all'],
          order: 0
        },
        {
          menuId: 'planning',
          menuName: 'Planning',
          menuPath: '/planning',
          isVisibleToAdmin: true,
          isVisibleToEmployee: true,
          requiredPermissions: ['view_planning'],
          order: 1
        },
        {
          menuId: 'employees',
          menuName: 'Gestion des salariés',
          menuPath: '/employees',
          isVisibleToAdmin: true,
          isVisibleToEmployee: false,
          requiredPermissions: ['manage_employees'],
          order: 2
        },
        {
          menuId: 'constraints',
          menuName: 'Contraintes hebdomadaires',
          menuPath: '/constraints',
          isVisibleToAdmin: true,
          isVisibleToEmployee: false,
          requiredPermissions: ['manage_planning'],
          order: 3
        },
        {
          menuId: 'absences',
          menuName: 'État des absences',
          menuPath: '/absences',
          isVisibleToAdmin: true,
          isVisibleToEmployee: true,
          requiredPermissions: ['view_absences'],
          order: 4
        },
        {
          menuId: 'sales-stats',
          menuName: 'Stats Vente',
          menuPath: '/sales-stats',
          isVisibleToAdmin: true,
          isVisibleToEmployee: true,
          requiredPermissions: ['view_sales_stats'],
          order: 5
        },
        {
          menuId: 'parameters',
          menuName: 'Paramètres',
          menuPath: '/parameters',
          isVisibleToAdmin: true,
          isVisibleToEmployee: false,
          requiredPermissions: ['manage_parameters'],
          order: 6
        },
        {
          menuId: 'employee-status',
          menuName: 'État Salariés',
          menuPath: '/employee-status',
          isVisibleToAdmin: true,
          isVisibleToEmployee: false,
          requiredPermissions: ['view_reports'],
          order: 7
        },
        {
          menuId: 'meal-expenses',
          menuName: 'Frais Repas',
          menuPath: '/meal-expenses',
          isVisibleToAdmin: true,
          isVisibleToEmployee: true,
          requiredPermissions: ['view_meal_expenses'],
          order: 8
        },
        {
          menuId: 'km-expenses',
          menuName: 'Frais KM',
          menuPath: '/km-expenses',
          isVisibleToAdmin: true,
          isVisibleToEmployee: true,
          requiredPermissions: ['view_km_expenses'],
          order: 9
        },
        {
          menuId: 'employee-status-print',
          menuName: 'Imprimer État',
          menuPath: '/employee-status-print',
          isVisibleToAdmin: true,
          isVisibleToEmployee: false,
          requiredPermissions: ['view_reports'],
          order: 10
        },
        {
          menuId: 'sick-leave-management',
          menuName: 'Gestion des Arrêts Maladie',
          menuPath: '/sick-leave-management',
          isVisibleToAdmin: true,
          isVisibleToEmployee: false,
          requiredPermissions: ['manage_employees'],
          order: 11
        }
      ];

      await this.insertMany(defaultMenus);
      console.log('✅ Permissions de menu par défaut créées');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création des permissions de menu:', error);
  }
};

module.exports = mongoose.model('MenuPermissions', menuPermissionsSchema);
