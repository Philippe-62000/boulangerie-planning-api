import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      label: 'Tableau de bord',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
      )
    },
    {
      path: '/employees',
      label: 'Gestion des employés',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-3.24 4.53c-.31.43-.75.69-1.23.69-.48 0-.92-.26-1.23-.69L6.01 9C5.54 8.37 4.8 8 4 8H2.46c-.8 0-1.54.37-2.01 1L0 16.5V22h2v-5.5l.54-1.63A1.5 1.5 0 0 1 4 14h1c.8 0 1.54-.37 2.01-1l3.24-4.53c.31-.43.75-.69 1.23-.69.48 0 .92.26 1.23.69L14.99 13c.47.63 1.21 1 2.01 1h1c.46 0 .92-.37 1.46-.87L20 16.5V22h2z"/>
        </svg>
      )
    },
    {
      path: '/constraints',
      label: 'Contraintes hebdomadaires',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      )
    },
    {
      path: '/planning',
      label: 'Génération du planning',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      )
    },
    {
      path: '/absences',
      label: 'État des absences',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      )
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="currentColor" className="logo-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
          </svg>
          <span className="logo-text">PB</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {location.pathname === item.path && (
                  <div className="nav-indicator"></div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="sidebar-version">
          <span className="version-text">v2.0</span>
          <span className="version-label">Planning Boulangerie</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

