import React, { useState, useEffect } from 'react';
import './AbsenceStatus.css';

const AbsenceStatus = ({ employees }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [absenceStats, setAbsenceStats] = useState({
    total: { absences: 0, sickLeave: 0, delays: 0, total: 0 },
    byEmployee: []
  });

  useEffect(() => {
    calculateAbsenceStats();
  }, [employees, selectedPeriod]);

  const calculateAbsenceStats = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (selectedPeriod) {
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        startDate = weekStart;
        endDate = weekEnd;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Calculer les statistiques par employé
    const byEmployee = employees.map(employee => {
      const employeeAbsences = employee.absences?.filter(absence => {
        const absenceDate = new Date(absence.date);
        return absenceDate >= startDate && absenceDate <= endDate;
      }) || [];

      const employeeSickLeaves = employee.sickLeaves?.filter(sickLeave => {
        const start = new Date(sickLeave.startDate);
        const end = new Date(sickLeave.endDate);
        return (start <= endDate && end >= startDate);
      }) || [];

      const employeeDelays = employee.delays?.filter(delay => {
        const delayDate = new Date(delay.date);
        return delayDate >= startDate && delayDate <= endDate;
      }) || [];

      return {
        id: employee._id,
        name: employee.name,
        absences: employeeAbsences.length,
        sickLeave: employeeSickLeaves.reduce((total, sl) => {
          const start = new Date(sl.startDate);
          const end = new Date(sl.endDate);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }, 0),
        delays: employeeDelays.length,
        total: employeeAbsences.length + employeeSickLeaves.length + employeeDelays.length
      };
    });

    // Calculer les totaux
    const total = byEmployee.reduce((acc, emp) => ({
      absences: acc.absences + emp.absences,
      sickLeave: acc.sickLeave + emp.sickLeave,
      delays: acc.delays + emp.delays,
      total: acc.total + emp.total
    }), { absences: 0, sickLeave: 0, delays: 0, total: 0 });

    setAbsenceStats({ total, byEmployee });
  };

  const getPeriodLabel = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'year':
        return `${now.getFullYear()}`;
      case 'month':
        return `${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `Semaine du ${weekStart.toLocaleDateString('fr-FR')} au ${weekEnd.toLocaleDateString('fr-FR')}`;
      default:
        return `${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    }
  };

  return (
    <div className="absence-status">
      <div className="status-header">
        <h2>📊 État des absences</h2>
        <div className="period-selector">
          <button
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            Mois
          </button>
          <button
            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('year')}
          >
            Année
          </button>
          <button
            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            Semaine
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
            <h3 className="stat-value">{absenceStats.total.total}</h3>
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
            <h3 className="stat-value">{absenceStats.total.sickLeave}</h3>
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
            <h3 className="stat-value">{absenceStats.total.absences}</h3>
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
            <h3 className="stat-value">{absenceStats.total.delays}</h3>
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
                    <span className="mini-stat-value">{employee.sickLeave}</span>
                    <span className="mini-stat-label">Maladie</span>
                  </div>
                  <div className="mini-stat absence">
                    <span className="mini-stat-value">{employee.absences}</span>
                    <span className="mini-stat-label">Absence</span>
                  </div>
                  <div className="mini-stat retard">
                    <span className="mini-stat-value">{employee.delays}</span>
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
