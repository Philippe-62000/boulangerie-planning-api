import React, { useState, useEffect } from 'react';
import './AbsenceStatus.css';

const AbsenceStatus = ({ employees }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [absenceStats, setAbsenceStats] = useState({
    total: 0,
    maladie: 0,
    absence: 0,
    retard: 0,
    byEmployee: []
  });

  useEffect(() => {
    calculateAbsenceStats();
  }, [employees, selectedPeriod]);

  const calculateAbsenceStats = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let stats = {
      total: 0,
      maladie: 0,
      absence: 0,
      retard: 0,
      byEmployee: []
    };

    employees.forEach(employee => {
      let employeeStats = {
        id: employee._id,
        name: employee.name,
        role: employee.role,
        total: 0,
        maladie: 0,
        absence: 0,
        retard: 0
      };

      // Calculer les absences maladie
      if (employee.sickLeave?.isOnSickLeave) {
        const startDate = new Date(employee.sickLeave.startDate);
        const endDate = new Date(employee.sickLeave.endDate);
        
        if (selectedPeriod === 'current') {
          if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            employeeStats.maladie += daysDiff;
            stats.maladie += daysDiff;
            stats.total += daysDiff;
            employeeStats.total += daysDiff;
          }
        } else if (selectedPeriod === 'all') {
          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          employeeStats.maladie += daysDiff;
          stats.maladie += daysDiff;
          stats.total += daysDiff;
          employeeStats.total += daysDiff;
        }
      }

      // Calculer les absences
      if (employee.absence?.isAbsent) {
        const startDate = new Date(employee.absence.startDate);
        const endDate = new Date(employee.absence.endDate);
        
        if (selectedPeriod === 'current') {
          if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            employeeStats.absence += daysDiff;
            stats.absence += daysDiff;
            stats.total += daysDiff;
            employeeStats.total += daysDiff;
          }
        } else if (selectedPeriod === 'all') {
          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          employeeStats.absence += daysDiff;
          stats.absence += daysDiff;
          stats.total += daysDiff;
          employeeStats.total += daysDiff;
        }
      }

      // Ajouter les statistiques de l'employé si il a des absences
      if (employeeStats.total > 0) {
        stats.byEmployee.push(employeeStats);
      }
    });

    // Trier par total d'absences décroissant
    stats.byEmployee.sort((a, b) => b.total - a.total);
    
    setAbsenceStats(stats);
  };

  const getPeriodLabel = () => {
    const currentDate = new Date();
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    if (selectedPeriod === 'current') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    return 'Toutes périodes';
  };

  return (
    <div className="absence-status">
      <div className="status-header">
        <h2>📊 État des absences</h2>
        <div className="period-selector">
          <button
            className={`period-btn ${selectedPeriod === 'current' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('current')}
          >
            Période actuelle
          </button>
          <button
            className={`period-btn ${selectedPeriod === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('all')}
          >
            Toutes périodes
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{absenceStats.total}</h3>
            <p className="stat-label">Total des absences</p>
            <p className="stat-period">{getPeriodLabel()}</p>
          </div>
        </div>

        <div className="stat-card maladie">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{absenceStats.maladie}</h3>
            <p className="stat-label">Arrêts maladie</p>
            <p className="stat-period">{getPeriodLabel()}</p>
          </div>
        </div>

        <div className="stat-card absence">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{absenceStats.absence}</h3>
            <p className="stat-label">Absences</p>
            <p className="stat-period">{getPeriodLabel()}</p>
          </div>
        </div>

        <div className="stat-card retard">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{absenceStats.retard}</h3>
            <p className="stat-label">Retards</p>
            <p className="stat-period">{getPeriodLabel()}</p>
          </div>
        </div>
      </div>

      {/* Détail par employé */}
      <div className="employee-details">
        <h3>Détail par employé</h3>
        {absenceStats.byEmployee.length > 0 ? (
          <div className="employee-stats">
            {absenceStats.byEmployee.map((employee) => (
              <div key={employee.id} className="employee-stat-card">
                <div className="employee-info">
                  <h4 className="employee-name">{employee.name}</h4>
                  <span className="employee-role">{employee.role}</span>
                </div>
                <div className="employee-stats-grid">
                  <div className="mini-stat">
                    <span className="mini-stat-value">{employee.total}</span>
                    <span className="mini-stat-label">Total</span>
                  </div>
                  <div className="mini-stat maladie">
                    <span className="mini-stat-value">{employee.maladie}</span>
                    <span className="mini-stat-label">Maladie</span>
                  </div>
                  <div className="mini-stat absence">
                    <span className="mini-stat-value">{employee.absence}</span>
                    <span className="mini-stat-label">Absence</span>
                  </div>
                  <div className="mini-stat retard">
                    <span className="mini-stat-value">{employee.retard}</span>
                    <span className="mini-stat-label">Retard</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <svg viewBox="0 0 24 24" fill="currentColor" className="no-data-icon">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>Aucune absence enregistrée pour cette période</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsenceStatus;
