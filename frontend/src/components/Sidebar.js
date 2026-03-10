import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/apiConfig';
import './Sidebar.css';

const Sidebar = () => {
  // Étendu par défaut sur desktop (largeur > 768px) pour éviter que le menu semble "disparaître" au refresh
  const [isExpanded, setIsExpanded] = useState(() => typeof window !== 'undefined' && window.innerWidth > 768);
  const [socialMenuExpanded, setSocialMenuExpanded] = useState(false);
  const [menuPermissions, setMenuPermissions] = useState([]);
  const location = useLocation();
  const { user, isAdmin, isEmployee } = useAuth();
  const isLonguenesse = window.location.pathname.startsWith('/lon');

  // Menus regroupés sous "Social" (visible uniquement pour l'admin)
  // Note: product-exchanges est dans le menu principal pour Longuenesse et Arras (pas dans Social)
  const SOCIAL_MENU_ITEMS = [
    { path: '/advance-requests', label: 'Demandes d\'Acompte', icon: '💰', menuId: 'advance-requests' },
    { path: '/vacation-management', label: 'Gestion des Congés', icon: '🏖️', menuId: 'vacation-management' },
    { path: '/sick-leave-management', label: 'Gestion des Arrêts Maladie', icon: '🏥', menuId: 'sick-leave-management' },
    { path: '/mutuelle-management', label: 'Gestion des Mutuelles', icon: '🏥', menuId: 'mutuelle-management' },
    { path: '/primes', label: 'Primes', icon: '💰', menuId: 'primes' }
  ];

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
        { menuId: 'meal-expenses', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'km-expenses', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'recup', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'primes', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'employee-status-print', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'parameters', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'sick-leave-management', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'mutuelle-management', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'vacation-management', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'ticket-restaurant', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'advance-requests', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'employee-dashboard', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'ambassadeur', isVisibleToAdmin: true, isVisibleToEmployee: false },
        { menuId: 'commandes-en-ligne', isVisibleToAdmin: true, isVisibleToEmployee: true },
        { menuId: 'product-exchanges', isVisibleToAdmin: true, isVisibleToEmployee: false }
      ];
    } else {
      return [
        { menuId: 'dashboard', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'planning', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'sales-stats', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'absences', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'meal-expenses', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'km-expenses', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'recup', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'ticket-restaurant', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'advance-requests', isVisibleToAdmin: false, isVisibleToEmployee: false },
        { menuId: 'vacation-management', isVisibleToAdmin: false, isVisibleToEmployee: false },
        { menuId: 'sick-leave-management', isVisibleToAdmin: false, isVisibleToEmployee: false },
        { menuId: 'mutuelle-management', isVisibleToAdmin: false, isVisibleToEmployee: false },
        { menuId: 'primes', isVisibleToAdmin: false, isVisibleToEmployee: false },
        { menuId: 'ambassadeur', isVisibleToAdmin: false, isVisibleToEmployee: false },
        { menuId: 'commandes-en-ligne', isVisibleToAdmin: false, isVisibleToEmployee: true },
        { menuId: 'product-exchanges', isVisibleToAdmin: false, isVisibleToEmployee: false }
      ];
    }
  };

  // Auto-expandre le menu Social quand on est sur une de ses pages
  useEffect(() => {
    const socialPaths = ['advance-requests', 'vacation-management', 'sick-leave-management', 'mutuelle-management', 'primes', 'product-exchanges'];
    if (socialPaths.some(p => location.pathname.includes(p))) {
      setSocialMenuExpanded(true);
    }
  }, [location.pathname]);

  // Charger les permissions de menu selon le rôle utilisateur
  useEffect(() => {
    const loadMenuPermissions = async () => {
      if (!user) return;

      try {
        const apiBaseUrl = getApiUrl();
        const response = await fetch(`${apiBaseUrl}/menu-permissions?role=${user.role}`);
        
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


  // Menu items avec permissions (sans les items Social - regroupés séparément)
  const menuItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊', menuId: 'dashboard' },
    { path: '/employees', label: 'Gestion des employés', icon: '👥', menuId: 'employees' },
    { path: '/constraints', label: 'Contraintes hebdomadaires', icon: '📋', menuId: 'constraints' },
    { path: '/planning', label: 'Génération du planning', icon: '🎯', menuId: 'planning' },
    { path: '/sales-stats', label: 'Stats Vente', icon: '💰', menuId: 'sales-stats' },
    { path: '/absences', label: 'État des absences', icon: '📈', menuId: 'absences' },
    { path: '/meal-expenses', label: 'Frais Repas', icon: '🍽️', menuId: 'meal-expenses' },
    { path: '/km-expenses', label: 'Frais KM', icon: '🚗', menuId: 'km-expenses' },
    { path: '/recup', label: 'Heures de récup', icon: '⏱️', menuId: 'recup' },
    { path: '/employee-status-print', label: 'Imprimer État', icon: '🖨️', menuId: 'employee-status-print' },
    { path: '/parameters', label: 'Paramètres', icon: '⚙️', menuId: 'parameters' },
    { path: '/ticket-restaurant', label: 'Ticket restaurant', icon: '🎫', menuId: 'ticket-restaurant' },
    { path: '/employee-dashboard', label: 'Mes Documents', icon: '📁', menuId: 'employee-dashboard' },
    { path: '/ambassadeur', label: 'Ambassadeur', icon: '⭐', menuId: 'ambassadeur' },
    { path: '/commandes-en-ligne', label: 'Commandes en ligne', icon: '🛒', menuId: 'commandes-en-ligne', longuenesseOnly: true },
    { path: '/product-exchanges', label: 'Échanges entre boulangeries', icon: '🔄', menuId: 'product-exchanges' }
  ];

  // Vérifier si un menu a la permission pour le rôle actuel (fallback sur défaut si absent de l'API)
  const hasPermission = (menuId) => {
    const permission = menuPermissions.find(p => p.menuId === menuId);
    if (permission) {
      return isAdmin() ? permission.isVisibleToAdmin : permission.isVisibleToEmployee;
    }
    // Fallback : si l'API ne retourne pas ce menu (backend pas à jour), utiliser les défauts
    const defaultPermission = getDefaultMenuPermissions(user?.role).find(p => p.menuId === menuId);
    if (!defaultPermission) return false;
    return isAdmin() ? defaultPermission.isVisibleToAdmin : defaultPermission.isVisibleToEmployee;
  };

  // Filtrer les menus principaux (sans les items Social)
  const getFilteredMenuItems = () => {
    if (!user) return [];

    let items = menuItems.filter(item => !(item.longuenesseOnly && !isLonguenesse));

    return items.filter(item => hasPermission(item.menuId));
  };

  // Items du menu Social visibles pour le salarié (affichés individuellement, pas sous un parent)
  const getSocialItemsForEmployee = () => {
    if (!isEmployee()) return [];
    return SOCIAL_MENU_ITEMS.filter(item => hasPermission(item.menuId));
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
        {/* Menu Social - visible uniquement pour l'admin */}
        {isAdmin() && (
          <div className="nav-group social-menu">
            <button
              type="button"
              className={`nav-item nav-group-toggle ${socialMenuExpanded ? 'expanded' : ''} ${SOCIAL_MENU_ITEMS.some(i => location.pathname.includes(i.path)) ? 'active' : ''}`}
              onClick={() => setSocialMenuExpanded(!socialMenuExpanded)}
              onMouseEnter={() => isExpanded && setSocialMenuExpanded(true)}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Social</span>
              <span className="nav-chevron">{socialMenuExpanded ? '▼' : '▶'}</span>
            </button>
            {socialMenuExpanded && isExpanded && (
              <div className="nav-submenu">
                {SOCIAL_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item nav-subitem ${location.pathname.includes(item.path) ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Items Social pour les salariés (affichés individuellement selon permissions) */}
        {getSocialItemsForEmployee().map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname.includes(item.path) ? 'active' : ''}`}
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

