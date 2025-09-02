import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" className="bread-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">Planning Boulangerie</h1>
            <p className="brand-subtitle">Gestion intelligente des équipes</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="header-info">
            <div className="info-item">
              <span className="info-label">Version</span>
              <span className="info-value">v2.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Statut</span>
              <span className="status-badge status-online">
                <span className="status-dot"></span>
                En ligne
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

