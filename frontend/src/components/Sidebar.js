import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      label: 'Tableau de bord',
      icon: '📊'
    },
    {
      path: '/employees',
      label: 'Gestion des employés',
      icon: '👥'
    },
    {
      path: '/constraints',
      label: 'Contraintes hebdomadaires',
      icon: '📝'
    },
    {
      path: '/planning',
      label: 'Génération du planning',
      icon: '📅'
    }
  ];

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

