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

