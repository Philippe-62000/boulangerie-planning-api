import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { path: '/employees', label: 'Gestion des employés', icon: '👥' },
    { path: '/constraints', label: 'Contraintes hebdomadaires', icon: '📋' },
    { path: '/planning', label: 'Génération du planning', icon: '🎯' },
    { path: '/sales-stats', label: 'Stats Vente', icon: '💰' },
    { path: '/absences', label: 'État des absences', icon: '📈' },
    { path: '/parameters', label: 'Paramètres', icon: '⚙️' },
    { 
      key: 'employee-status',
      label: 'État Salariés', 
      icon: '👤',
      submenu: [
        { path: '/meal-expenses', label: 'Frais Repas', icon: '🍽️' },
        { path: '/km-expenses', label: 'Frais KM', icon: '🚗' },
        { path: '/employee-status-print', label: 'Imprimer État', icon: '🖨️' }
      ]
    }
  ];

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
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
        {menuItems.map((item) => {
          if (item.submenu) {
            // Menu avec sous-menu
            const isExpanded = expandedMenus[item.key];
            const isActive = isSubmenuActive(item.submenu);
            
            return (
              <div key={item.key} className="nav-group">
                <div
                  className={`nav-item nav-parent ${isActive ? 'active' : ''}`}
                  onClick={() => toggleSubmenu(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className={`nav-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
                </div>
                <div className={`nav-submenu ${isExpanded ? 'expanded' : ''}`}>
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={`nav-item nav-child ${location.pathname === subItem.path ? 'active' : ''}`}
                    >
                      <span className="nav-icon">{subItem.icon}</span>
                      <span className="nav-label">{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          } else {
            // Menu simple
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          }
        })}
      </nav>
      
      <div className="sidebar-footer">
        <div className="version-info">v2.0</div>
      </div>
    </div>
  );
};

export default Sidebar;

