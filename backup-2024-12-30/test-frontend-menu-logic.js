// Script pour tester la logique de filtrage des menus côté frontend
const API_URL = 'https://boulangerie-planning-api-3.onrender.com/api';

// Simuler les permissions par défaut
const getDefaultMenuPermissions = (role) => {
  if (role === 'admin') {
    return [
      { menuId: 'dashboard', isVisibleToAdmin: true, isVisibleToEmployee: false },
      { menuId: 'employees', isVisibleToAdmin: true, isVisibleToEmployee: false },
      { menuId: 'constraints', isVisibleToAdmin: true, isVisibleToEmployee: false },
      { menuId: 'planning', isVisibleToAdmin: true, isVisibleToEmployee: true },
      { menuId: 'sales-stats', isVisibleToAdmin: true, isVisibleToEmployee: true },
      { menuId: 'absences', isVisibleToAdmin: true, isVisibleToEmployee: true },
      { menuId: 'meal-expenses', isVisibleToAdmin: true, isVisibleToEmployee: true },
      { menuId: 'km-expenses', isVisibleToAdmin: true, isVisibleToEmployee: true },
      { menuId: 'employee-status-print', isVisibleToAdmin: true, isVisibleToEmployee: false },
      { menuId: 'parameters', isVisibleToAdmin: true, isVisibleToEmployee: false },
      { menuId: 'sick-leave-management', isVisibleToAdmin: true, isVisibleToEmployee: false }
    ];
  } else {
    return [
      { menuId: 'dashboard', isVisibleToAdmin: false, isVisibleToEmployee: true },
      { menuId: 'planning', isVisibleToAdmin: false, isVisibleToEmployee: true },
      { menuId: 'sales-stats', isVisibleToAdmin: false, isVisibleToEmployee: true },
      { menuId: 'absences', isVisibleToAdmin: false, isVisibleToEmployee: true },
      { menuId: 'meal-expenses', isVisibleToAdmin: false, isVisibleToEmployee: true },
      { menuId: 'km-expenses', isVisibleToAdmin: false, isVisibleToEmployee: true }
    ];
  }
};

// Simuler les items de menu
const menuItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: '📊', menuId: 'dashboard' },
  { path: '/employees', label: 'Gestion des employés', icon: '👥', menuId: 'employees' },
  { path: '/constraints', label: 'Contraintes hebdomadaires', icon: '📋', menuId: 'constraints' },
  { path: '/planning', label: 'Génération du planning', icon: '🎯', menuId: 'planning' },
  { path: '/sales-stats', label: 'Stats Vente', icon: '💰', menuId: 'sales-stats' },
  { path: '/absences', label: 'État des absences', icon: '📈', menuId: 'absences' },
  { path: '/meal-expenses', label: 'Frais Repas', icon: '🍽️', menuId: 'meal-expenses' },
  { path: '/km-expenses', label: 'Frais KM', icon: '🚗', menuId: 'km-expenses' },
  { path: '/employee-status-print', label: 'Imprimer État', icon: '🖨️', menuId: 'employee-status-print' },
  { path: '/parameters', label: 'Paramètres', icon: '⚙️', menuId: 'parameters' },
  { path: '/sick-leave-management', label: 'Gestion des Arrêts Maladie', icon: '🏥', menuId: 'sick-leave-management' }
];

// Simuler la logique de filtrage
function getFilteredMenuItems(user, menuPermissions, isAdmin, isEmployee) {
  if (!user) {
    console.log('⚠️ Pas d\'utilisateur connecté');
    return [];
  }
  
  if (menuPermissions.length === 0) {
    console.log('⚠️ Permissions vides, utilisation des permissions par défaut');
    return menuItems.filter(item => {
      const defaultPermission = getDefaultMenuPermissions(user.role).find(p => p.menuId === item.menuId);
      if (!defaultPermission) return false;
      
      if (isAdmin()) {
        return defaultPermission.isVisibleToAdmin;
      } else if (isEmployee()) {
        return defaultPermission.isVisibleToEmployee;
      }
      return false;
    });
  }

  console.log('🔍 Filtrage des menus pour:', user.role);
  console.log('📋 Permissions disponibles:', menuPermissions.length);
  console.log('👑 isAdmin():', isAdmin());
  console.log('👤 isEmployee():', isEmployee());

  const filteredItems = menuItems.filter(item => {
    const permission = menuPermissions.find(p => p.menuId === item.menuId);
    console.log(`🔍 Menu ${item.menuId}:`, { 
      permission: permission ? `${permission.menuId} (Admin:${permission.isVisibleToAdmin})` : 'NON TROUVÉ', 
      isAdmin: isAdmin(), 
      isEmployee: isEmployee() 
    });
    
    if (!permission) {
      console.log(`❌ Pas de permission pour ${item.menuId}`);
      return false;
    }

    if (isAdmin()) {
      const visible = permission.isVisibleToAdmin;
      console.log(`👑 Admin - ${item.menuId}: ${visible}`);
      return visible;
    } else if (isEmployee()) {
      const visible = permission.isVisibleToEmployee;
      console.log(`👤 Employee - ${item.menuId}: ${visible}`);
      return visible;
    }
    return false;
  });

  console.log('✅ Menus filtrés:', filteredItems.map(item => item.menuId));

  return filteredItems;
}

async function testMenuLogic() {
  try {
    // Simuler un utilisateur admin
    const user = { role: 'admin' };
    const isAdmin = () => true;
    const isEmployee = () => false;

    console.log('🧪 Test 1: Permissions par défaut (menuPermissions = [])');
    const defaultMenus = getFilteredMenuItems(user, [], isAdmin, isEmployee);
    console.log('📋 Menus avec permissions par défaut:', defaultMenus.map(m => m.menuId));
    console.log('');

    console.log('🧪 Test 2: Permissions depuis l\'API');
    const response = await fetch(`${API_URL}/menu-permissions?role=admin`);
    const data = await response.json();
    
    if (data.success) {
      const apiMenus = getFilteredMenuItems(user, data.menuPermissions, isAdmin, isEmployee);
      console.log('📋 Menus avec permissions API:', apiMenus.map(m => m.menuId));
      
      // Vérifier spécifiquement sick-leave-management
      const sickLeaveInDefault = defaultMenus.find(m => m.menuId === 'sick-leave-management');
      const sickLeaveInApi = apiMenus.find(m => m.menuId === 'sick-leave-management');
      
      console.log('');
      console.log('🔍 Vérification sick-leave-management:');
      console.log('- Dans permissions par défaut:', sickLeaveInDefault ? '✅ PRÉSENT' : '❌ ABSENT');
      console.log('- Dans permissions API:', sickLeaveInApi ? '✅ PRÉSENT' : '❌ ABSENT');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le test
testMenuLogic();


