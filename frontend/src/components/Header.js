import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [currentWeek, setCurrentWeek] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Calculer la semaine actuelle
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    setCurrentWeek(`S${weekNumber}`);
    
    // Formater la date du jour
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formattedDate = now.toLocaleDateString('fr-FR', options);
    setCurrentDate(formattedDate);
  }, []);

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 120 60" className="filmara-logo" xmlns="http://www.w3.org/2000/svg">
              {/* Orca (left side) */}
              <path d="M15 20c0-5 5-10 10-10s10 5 10 10c0 3-2 6-4 8l-2 2c-1 1-2 2-4 2s-3-1-4-2l-2-2c-2-2-4-5-4-8z" fill="#8B4513"/>
              <path d="M18 18c0-2 1-4 3-4s3 2 3 4-1 4-3 4-3-2-3-4z" fill="white"/>
              
              {/* Fox (right side) */}
              <path d="M85 20c0-5 5-10 10-10s10 5 10 10c0 3-2 6-4 8l-2 2c-1 1-2 2-4 2s-3-1-4-2l-2-2c-2-2-4-5-4-8z" fill="#D2691E"/>
              <path d="M88 18c0-2 1-4 3-4s3 2 3 4-1 4-3 4-3-2-3-4z" fill="white"/>
              <path d="M95 25c0-2 1-4 3-4s3 2 3 4-1 4-3 4-3-2-3-4z" fill="white"/>
              
              {/* FILMARA text - using path instead of text element for better compatibility */}
              <path d="M45 45 L55 45 L55 50 L45 50 Z" fill="#8B4513"/>
              <path d="M60 45 L70 45 L70 50 L60 50 Z" fill="#8B4513"/>
              <path d="M75 45 L85 45 L85 50 L75 50 Z" fill="#8B4513"/>
            </svg>
            <div className="filmara-text">FILMARA</div>
          </div>
          <div className="week-info">
            <div className="week-number">{currentWeek}</div>
            <div className="current-date">{currentDate}</div>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">Planning Boulangerie</h1>
            <p className="brand-subtitle">Gestion intelligente des équipes</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="header-info">
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

