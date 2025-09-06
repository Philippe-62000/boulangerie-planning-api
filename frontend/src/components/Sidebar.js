import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuPermissions, setMenuPermissions] = useState([]);
  const location = useLocation();
  const { user, isAdmin, isEmployee } = useAuth();

  // Permissions par défaut en cas d'erreur API
  const getDefaultMenuPermissions = (role) => {
    if (role === 'admin') {
      return [
        { menuId: 'dashboard', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'employees', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'constraints', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'planning', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'sales-stats', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'absences', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'parameters', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'employee-status', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'meal-expenses', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'km-expenses', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'employee-status-print', isVisibleToAdmin: true, isVisibleToEmployee: false }
      ];
    } else {
      return [
        { menuId: 'dashboard', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'planning', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'sales-stats', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'absences', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'employee-status', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'meal-expenses', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'km-expenses', isVisibleToAdmin: false, isVisibleToEmployee: true }
      ];
    }
  };

  // Charger les permissions de menu selon le rôle utilisateur
  useEffect(() => {
    const loadMenuPermissions = async () => {
      if (!user) return;

      try {
        const response = await fetch(`https://boulangerie-planning-api-3.onrender.com/api/menu-permissions?role=${user.role}`);
        
        // Vérifier si la réponse est du JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('⚠️ API non disponible, utilisation des permissions par défaut');
          // Utiliser des permissions par défaut en cas d'erreur API
          setMenuPermissions(getDefaultMenuPermissions(user.role));
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setMenuPermissions(data.menuPermissions);
          console.log('📋 Permissions de menu chargées:', data.menuPermissions);
        } else {
          console.warn('⚠️ Erreur API, utilisation des permissions par défaut');
          setMenuPermissions(getDefaultMenuPermissions(user.role));
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des permissions:', error);
        console.warn('⚠️ Utilisation des permissions par défaut');
        setMenuPermissions(getDefaultMenuPermissions(user.role));
      }
    };

    loadMenuPermissions();
  }, [user]);


  // Menu items avec permissions (tous en menus principaux)
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
    { path: '/parameters', label: 'Paramètres', icon: '⚙️', menuId: 'parameters' }
  ];

  // Filtrer les menus selon les permissions
  const getFilteredMenuItems = () => {
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
    console.log('📋 Permissions disponibles:', menuPermissions);

    const filteredItems = menuItems.filter(item => {
      const permission = menuPermissions.find(p => p.menuId === item.menuId);
      console.log(`🔍 Menu ${item.menuId}:`, { permission, isAdmin: isAdmin(), isEmployee: isEmployee() });
      
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
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };


  return (
    <div 
      className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="filmara-logo-sidebar">
            <div className="logo-symbol">
              <div className="orca-element"></div>
              <div className="fox-element"></div>
            </div>
            <div className="logo-text">FILMARA</div>
          </div>
        </div>
        <div className="sidebar-title">Boulangerie</div>
      </div>
      
      <nav className="sidebar-nav">
        {getFilteredMenuItems().map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          {user && (
            <div className="user-role">
              <span className="user-icon">{isAdmin() ? '👑' : '👤'}</span>
              <span className="user-name">{user.name}</span>
            </div>
          )}
        </div>
        <div className="version-info">v2.0</div>
      </div>
    </div>
  );
};

export default Sidebar;

