import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Header.css';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const [siteName, setSiteName] = useState('');

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const response = await api.get('/site');
        if (response.data && response.data.city) {
          setSiteName(response.data.city);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du nom du site:', error);
      }
    };

    fetchSiteName();
  }, []);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">
            Planning Boulangerie {siteName && `'${siteName}'`}
          </h1>
        </div>
        
        <div className="header-right">
          {user && (
            <div className="user-info">
              <div className="user-details">
                <span className="user-icon">{isAdmin() ? '👑' : '👤'}</span>
                <span className="user-name">{user.name}</span>
                <span className="user-role">({user.role === 'admin' ? 'Administrateur' : 'Salarié'})</span>
              </div>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Se déconnecter"
              >
                <span className="logout-icon">🚪</span>
                <span className="logout-text">Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;