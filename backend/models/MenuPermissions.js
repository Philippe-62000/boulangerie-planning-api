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
      },
      {
        menuId: 'vacation-management',
        menuName: 'Gestion des Congés',
        menuPath: '/vacation-management',
        isVisibleToAdmin: true,
        isVisibleToEmployee: false,
        requiredPermissions: ['manage_employees'],
        order: 12
      },
      {
        menuId: 'ticket-restaurant',
        menuName: 'Ticket restaurant',
        menuPath: '/ticket-restaurant',
        isVisibleToAdmin: true,
        isVisibleToEmployee: false,
        requiredPermissions: ['view_meal_expenses'],
        order: 13
      },
      {
        menuId: 'advance-requests',
        menuName: 'Demandes d\'Acompte',
        menuPath: '/advance-requests',
        isVisibleToAdmin: true,
        isVisibleToEmployee: false,
        requiredPermissions: ['manage_employees'],
        order: 13
      },
      {
        menuId: 'recup',
        menuName: 'Heures de récup',
        menuPath: '/recup',
        isVisibleToAdmin: true,
        isVisibleToEmployee: true,
        requiredPermissions: [],
        order: 14
      }
    ];

    const ensureMenuExists = async (menuConfig) => {
      const {
        menuId,
        menuName,
        menuPath,
        isVisibleToAdmin = true,
        isVisibleToEmployee = false,
        requiredPermissions = [],
        order = 0
      } = menuConfig;

      const existing = await this.findOne({ menuId });
      if (!existing) {
        await this.create({
          menuId,
          menuName,
          menuPath,
          isVisibleToAdmin,
          isVisibleToEmployee,
          requiredPermissions,
          order
        });
        console.log(`✅ Menu ${menuId} créé`);
      } else {
        const existingPermissions = existing.requiredPermissions || [];
        const desiredPermissions = requiredPermissions || [];
        const permissionsChanged =
          existingPermissions.length !== desiredPermissions.length ||
          !desiredPermissions.every(permission => existingPermissions.includes(permission));

        let hasChanges = false;

        if (existing.menuName !== menuName) {
          existing.menuName = menuName;
          hasChanges = true;
        }
        if (existing.menuPath !== menuPath) {
          existing.menuPath = menuPath;
          hasChanges = true;
        }
        if (existing.order !== order) {
          existing.order = order;
          hasChanges = true;
        }
        if (permissionsChanged) {
          existing.requiredPermissions = desiredPermissions;
          hasChanges = true;
        }
        if (existing.isActive !== true) {
          existing.isActive = true;
          hasChanges = true;
        }
        if (existing.isVisibleToAdmin !== isVisibleToAdmin) {
          existing.isVisibleToAdmin = isVisibleToAdmin;
          hasChanges = true;
        }
        const legacyRecupVisibilityFix =
          menuId === 'recup' &&
          Array.isArray(existingPermissions) &&
          existingPermissions.includes('manage_employees');
        if (
          (typeof existing.isVisibleToEmployee !== 'boolean' ||
            (legacyRecupVisibilityFix && existing.isVisibleToEmployee !== isVisibleToEmployee))
        ) {
          existing.isVisibleToEmployee = isVisibleToEmployee;
          hasChanges = true;
        }

        if (hasChanges) {
          await existing.save();
          console.log(`🔄 Menu ${menuId} mis à jour`);
        }
      }
    };

    for (const menuConfig of defaultMenus) {
      await ensureMenuExists(menuConfig);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création des permissions de menu:', error);
  }
};

module.exports = mongoose.model('MenuPermissions', menuPermissionsSchema);
