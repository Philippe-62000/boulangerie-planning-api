import React, { useState, useEffect, useCallback } from 'react';
import './AbsenceStatus.css';

const AbsenceStatus = ({ employees }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Calculer la semaine en cours
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    return start;
  });
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);
  const [absenceStats, setAbsenceStats] = useState({
    total: { absences: 0, sickLeave: 0, delays: 0, total: 0 },
    byEmployee: []
  });

  const calculateAbsenceStats = useCallback(() => {
    try {
      // Vérifier que employees est un tableau
      if (!Array.isArray(employees)) {
        console.log('⚠️ employees n\'est pas un tableau:', typeof employees, employees);
        setAbsenceStats({
          total: { absences: 0, sickLeave: 0, delays: 0, total: 0 },
          byEmployee: []
        });
        return;
      }

      let startDate, endDate;
      
      switch (selectedPeriod) {
        case 'year':
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          break;
        case 'month':
          startDate = new Date(selectedYear, selectedMonth - 1, 1);
          endDate = new Date(selectedYear, selectedMonth, 0);
          break;
        case 'week':
          // Utiliser la semaine sélectionnée
          const weekStart = new Date(selectedWeek);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          startDate = weekStart;
          endDate = weekEnd;
          break;
        default:
          startDate = new Date(selectedYear, selectedMonth - 1, 1);
          endDate = new Date(selectedYear, selectedMonth, 0);
      }


    // Calculer les statistiques par employé
    const byEmployee = employees.map(employee => {
      // Vérifier la structure des données et adapter
      // Le backend retourne { absences: { all: [...] }, sickLeaves: { all: [...] }, delays: { all: [...] } }
      const absencesArray = employee.absences?.all || (Array.isArray(employee.absences) ? employee.absences : []);
      const sickLeavesArray = employee.sickLeaves?.all || (Array.isArray(employee.sickLeaves) ? employee.sickLeaves : []);
      const delaysArray = employee.delays?.all || (Array.isArray(employee.delays) ? employee.delays : []);

      // Pour les absences, vérifier si elles ont une date ou startDate/endDate
      const employeeAbsences = Array.isArray(absencesArray) ? absencesArray.filter(absence => {
        // Gérer les deux formats : { date: ... } ou { startDate: ..., endDate: ... }
        if (absence.date) {
          const absenceDate = new Date(absence.date);
          return absenceDate >= startDate && absenceDate <= endDate;
        } else if (absence.startDate && absence.endDate) {
          const absenceStart = new Date(absence.startDate);
          const absenceEnd = new Date(absence.endDate);
          return absenceStart <= endDate && absenceEnd >= startDate;
        }
        return false;
      }) : [];

      // Calculer les arrêts maladie (avec déduplication pour éviter les doublons)
      let employeeSickLeaves = [];
      const seenSickLeaveIds = new Set(); // Pour dédupliquer par sickLeaveId
      const seenSickLeaveDates = new Set(); // Pour dédupliquer par dates (pour les anciens sans ID)
      
      // Fonction helper pour vérifier si un arrêt maladie a déjà été ajouté
      const isDuplicate = (sl) => {
        // Vérifier par sickLeaveId si disponible (le plus fiable)
        if (sl.sickLeaveId) {
          const idStr = sl.sickLeaveId.toString ? sl.sickLeaveId.toString() : String(sl.sickLeaveId);
          if (seenSickLeaveIds.has(idStr)) return true;
          seenSickLeaveIds.add(idStr);
          return false;
        }
        
        // Sinon, vérifier par dates (pour les anciens arrêts sans sickLeaveId)
        if (sl.startDate && sl.endDate) {
          const dateKey = `${new Date(sl.startDate).toISOString().split('T')[0]}_${new Date(sl.endDate).toISOString().split('T')[0]}`;
          if (seenSickLeaveDates.has(dateKey)) return true;
          seenSickLeaveDates.add(dateKey);
          return false;
        }
        
        return false;
      };
      
      // Ajouter les arrêts maladie depuis les absences (type: 'Arrêt maladie' ou 'MAL')
      // C'est la source principale car elle inclut tous les arrêts maladie (manuels et workflow)
      const allAbsencesForSickLeave = absencesArray.filter(absence => {
        const absenceType = absence.type || '';
        const isSickLeave = absenceType === 'Arrêt maladie' || absenceType === 'MAL';
        if (!isSickLeave) return false;
        
        if (absence.startDate && absence.endDate) {
          const absenceStart = new Date(absence.startDate);
          const absenceEnd = new Date(absence.endDate);
          // Vérifier si l'absence chevauche la période sélectionnée
          if (absenceStart <= endDate && absenceEnd >= startDate) {
            const sl = {
              startDate: absence.startDate,
              endDate: absence.endDate,
              sickLeaveId: absence.sickLeaveId // Inclure le sickLeaveId si disponible
            };
            if (!isDuplicate(sl)) {
              employeeSickLeaves.push(sl);
            }
          }
        }
        return false; // Ne pas inclure dans le résultat du filter
      });
      
      // Ajouter les arrêts maladie stockés dans sickLeaves (déjà filtrés par le backend)
      // Cette source peut contenir des arrêts maladie qui ne sont pas encore dans les absences
      if (Array.isArray(sickLeavesArray)) {
        sickLeavesArray.forEach(sickLeave => {
          if (!sickLeave.startDate || !sickLeave.endDate) return;
          const start = new Date(sickLeave.startDate);
          const end = new Date(sickLeave.endDate);
          
          // Vérifier si l'arrêt chevauche la période sélectionnée
          if (start <= endDate && end >= startDate) {
            const sl = {
              startDate: sickLeave.startDate,
              endDate: sickLeave.endDate,
              sickLeaveId: sickLeave._id || sickLeave.sickLeaveId // Inclure l'ID si disponible
            };
            if (!isDuplicate(sl)) {
              employeeSickLeaves.push(sl);
            }
          }
        });
      }
      
      // Vérifier si l'employé a un arrêt maladie actuel (déclaré via declareSickLeave)
      // C'est un arrêt maladie déclaré manuellement, stocké dans employee.sickLeave
      // On l'ajoute seulement s'il n'est pas déjà dans les autres sources
      if (employee.sickLeave && employee.sickLeave.isOnSickLeave) {
        const start = employee.sickLeave.startDate ? new Date(employee.sickLeave.startDate) : null;
        const end = employee.sickLeave.endDate ? new Date(employee.sickLeave.endDate) : null;
        
        if (start && end) {
          // Vérifier si l'arrêt maladie chevauche la période sélectionnée
          if (start <= endDate && end >= startDate) {
            const sl = {
              startDate: employee.sickLeave.startDate,
              endDate: employee.sickLeave.endDate,
              sickLeaveId: employee.sickLeave.sickLeaveId // Inclure l'ID si disponible
            };
            if (!isDuplicate(sl)) {
              employeeSickLeaves.push(sl);
            }
          }
        }
      }

      const employeeDelays = Array.isArray(delaysArray) ? delaysArray.filter(delay => {
        if (delay.date) {
          const delayDate = new Date(delay.date);
          return delayDate >= startDate && delayDate <= endDate;
        }
        return false;
      }) : [];

      // Calculer le nombre total de minutes de retard
      const totalDelayMinutes = employeeDelays.reduce((total, delay) => {
        return total + (delay.duration || 0);
      }, 0);

      // Calculer le nombre de jours d'arrêt maladie dans la période sélectionnée
      const sickLeaveDays = employeeSickLeaves.reduce((total, sl) => {
        const start = new Date(sl.startDate);
        const end = new Date(sl.endDate);
        
        // Calculer l'intersection entre la période de l'arrêt maladie et la période sélectionnée
        const intersectionStart = start > startDate ? start : startDate;
        const intersectionEnd = end < endDate ? end : endDate;
        
        // Calculer le nombre de jours dans l'intersection
        const days = Math.max(0, Math.ceil((intersectionEnd - intersectionStart) / (1000 * 60 * 60 * 24)) + 1);
        return total + days;
      }, 0);

      // Compter le nombre d'arrêts maladie distincts (pas les jours)
      const sickLeaveCount = employeeSickLeaves.length;

      return {
        id: employee._id,
        name: employee.name,
        role: employee.role,
        absences: employeeAbsences.length,
        sickLeave: sickLeaveDays, // Nombre de jours pour l'affichage détaillé
        sickLeaveCount: sickLeaveCount, // Nombre d'arrêts distincts pour le total
        delays: employeeDelays.length,
        totalDelayMinutes: totalDelayMinutes, // Nombre total de minutes de retard
        total: employeeAbsences.length + sickLeaveCount + employeeDelays.length,
        // Stocker les données complètes pour le modal
        employeeData: employee
      };
    });

    // Calculer les totaux
    // Pour sickLeave, on compte les arrêts distincts, pas les jours
    const total = byEmployee.reduce((acc, emp) => ({
      absences: acc.absences + emp.absences,
      sickLeave: acc.sickLeave + (emp.sickLeaveCount || 0), // Compter les arrêts distincts
      delays: acc.delays + emp.delays,
      total: acc.total + emp.total
    }), { absences: 0, sickLeave: 0, delays: 0, total: 0 });

      setAbsenceStats({ total, byEmployee });
    } catch (error) {
      console.error('❌ Erreur dans calculateAbsenceStats:', error);
      console.error('❌ Type d\'erreur:', error.name, error.message);
      console.error('❌ Stack trace:', error.stack);
      setAbsenceStats({
        total: { absences: 0, sickLeave: 0, delays: 0, total: 0 },
        byEmployee: []
      });
    }
  }, [employees, selectedPeriod, selectedMonth, selectedYear, selectedWeek]);

  useEffect(() => {
    calculateAbsenceStats();
  }, [calculateAbsenceStats]);

  // Fonctions utilitaires pour les semaines
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const getDateFromWeek = (year, week) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'year':
        return `${selectedYear}`;
      case 'month':
        const monthDate = new Date(selectedYear, selectedMonth - 1, 1);
        return monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = new Date(selectedWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `Semaine du ${weekStart.toLocaleDateString('fr-FR')} au ${weekEnd.toLocaleDateString('fr-FR')}`;
      default:
        const defaultDate = new Date(selectedYear, selectedMonth - 1, 1);
        return defaultDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
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
        
        {/* Sélecteurs de période */}
        <div className="date-selectors">
          {selectedPeriod === 'week' && (
            <div className="date-selector">
              <label>Semaine</label>
              <input
                type="week"
                value={(() => {
                  // Convertir selectedWeek en format ISO week (YYYY-Www)
                  const year = selectedWeek.getFullYear();
                  const week = getWeekNumber(selectedWeek);
                  return `${year}-W${String(week).padStart(2, '0')}`;
                })()}
                onChange={(e) => {
                  // Convertir le format ISO week en date
                  const [year, week] = e.target.value.split('-W');
                  const date = getDateFromWeek(parseInt(year), parseInt(week));
                  setSelectedWeek(date);
                }}
                className="form-control"
              />
            </div>
          )}
          {(selectedPeriod === 'month' || selectedPeriod === 'year') && (
            <>
              <div className="date-selector">
                <label>Mois</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="form-control"
                  disabled={selectedPeriod === 'year'}
                >
                  <option value={1}>Janvier</option>
                  <option value={2}>Février</option>
                  <option value={3}>Mars</option>
                  <option value={4}>Avril</option>
                  <option value={5}>Mai</option>
                  <option value={6}>Juin</option>
                  <option value={7}>Juillet</option>
                  <option value={8}>Août</option>
                  <option value={9}>Septembre</option>
                  <option value={10}>Octobre</option>
                  <option value={11}>Novembre</option>
                  <option value={12}>Décembre</option>
                </select>
              </div>
              <div className="date-selector">
                <label>Année</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="form-control"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </>
          )}
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
            {absenceStats.byEmployee.map((employee) => {
              // Utiliser employeeData si disponible, sinon chercher dans employees
              const fullEmployee = employee.employeeData || employees.find(emp => emp._id === employee.id || emp._id?.toString() === employee.id?.toString());
              return (
              <div key={employee.id} className="employee-stat-card">
                <div className="employee-info">
                  <h4 
                    className="employee-name" 
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setSelectedEmployeeDetail(fullEmployee || employee)}
                  >
                    {employee.name}
                  </h4>
                  <span className="employee-role">{fullEmployee?.role || employee.role}</span>
                </div>
                <div className="employee-stats-grid">
                  <div className="mini-stat">
                    <span className="mini-stat-value">{employee.total}</span>
                    <span className="mini-stat-label">Total</span>
                  </div>
                  <div className="mini-stat maladie">
                    <span className="mini-stat-value">
                      {employee.sickLeaveCount || (employee.sickLeave > 0 ? 1 : 0)}/{employee.sickLeave || 0}
                    </span>
                    <span className="mini-stat-label">Maladie</span>
                  </div>
                  <div className="mini-stat absence">
                    <span className="mini-stat-value">{employee.absences}</span>
                    <span className="mini-stat-label">Absence</span>
                  </div>
                  <div className="mini-stat retard">
                    <span className="mini-stat-value">
                      {employee.delays}/{employee.totalDelayMinutes || 0}
                    </span>
                    <span className="mini-stat-label">Retard</span>
                  </div>
                </div>
              </div>
            );
            })}
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

      {/* Modal de détail employé */}
      {selectedEmployeeDetail && (
        <div className="modal show" onClick={() => setSelectedEmployeeDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Détail des absences - {selectedEmployeeDetail.name}</h2>
              <button className="modal-close" onClick={() => setSelectedEmployeeDetail(null)}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="close-icon">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                // Chercher l'employé dans employees en utilisant plusieurs méthodes
                let emp = null;
                if (selectedEmployeeDetail._id) {
                  emp = employees.find(e => e._id?.toString() === selectedEmployeeDetail._id?.toString());
                }
                if (!emp && selectedEmployeeDetail.id) {
                  emp = employees.find(e => e._id?.toString() === selectedEmployeeDetail.id?.toString());
                }
                if (!emp && selectedEmployeeDetail.name) {
                  emp = employees.find(e => e.name === selectedEmployeeDetail.name);
                }
                // Si selectedEmployeeDetail contient déjà les données complètes (employeeData)
                if (!emp && selectedEmployeeDetail.absences) {
                  emp = selectedEmployeeDetail;
                }
                
                if (!emp) {
                  console.error('❌ Employé non trouvé dans le modal:', selectedEmployeeDetail);
                  return <p>Aucune donnée disponible pour {selectedEmployeeDetail.name || 'cet employé'}</p>;
                }
                
                // Utiliser la même logique que calculateAbsenceStats
                const absencesArray = emp.absences?.all || (Array.isArray(emp.absences) ? emp.absences : []);
                const sickLeavesArray = emp.sickLeaves?.all || (Array.isArray(emp.sickLeaves) ? emp.sickLeaves : []);
                const delaysArray = emp.delays?.all || (Array.isArray(emp.delays) ? emp.delays : []);
                
                // Filtrer par période
                let startDate, endDate;
                switch (selectedPeriod) {
                  case 'year':
                    startDate = new Date(selectedYear, 0, 1);
                    endDate = new Date(selectedYear, 11, 31);
                    break;
                  case 'month':
                    startDate = new Date(selectedYear, selectedMonth - 1, 1);
                    endDate = new Date(selectedYear, selectedMonth, 0);
                    break;
                  case 'week':
                    startDate = new Date(selectedWeek);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(selectedWeek);
                    endDate.setDate(startDate.getDate() + 6);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                  default:
                    startDate = new Date(selectedYear, selectedMonth - 1, 1);
                    endDate = new Date(selectedYear, selectedMonth, 0);
                }
                
                // Filtrer les absences (type ABS uniquement)
                const filteredAbsences = absencesArray.filter(a => {
                  const absenceType = a.type || '';
                  if (absenceType === 'MAL' || absenceType === 'Arrêt maladie') return false; // Exclure les arrêts maladie
                  
                  if (a.date) {
                    const absenceDate = new Date(a.date);
                    return absenceDate >= startDate && absenceDate <= endDate;
                  } else if (a.startDate && a.endDate) {
                    const aStart = new Date(a.startDate);
                    const aEnd = new Date(a.endDate);
                    return aStart <= endDate && aEnd >= startDate;
                  }
                  return false;
                });
                
                // Filtrer les arrêts maladie (même logique que calculateAbsenceStats avec déduplication)
                let filteredSickLeaves = [];
                const seenSickLeaveIdsModal = new Set(); // Pour dédupliquer par sickLeaveId
                const seenSickLeaveDatesModal = new Set(); // Pour dédupliquer par dates
                
                // Fonction helper pour vérifier si un arrêt maladie a déjà été ajouté
                const isDuplicateModal = (sl) => {
                  // Vérifier par sickLeaveId si disponible (le plus fiable)
                  if (sl.sickLeaveId) {
                    const idStr = sl.sickLeaveId.toString ? sl.sickLeaveId.toString() : String(sl.sickLeaveId);
                    if (seenSickLeaveIdsModal.has(idStr)) return true;
                    seenSickLeaveIdsModal.add(idStr);
                    return false;
                  }
                  
                  // Sinon, vérifier par dates
                  if (sl.startDate && sl.endDate) {
                    const dateKey = `${new Date(sl.startDate).toISOString().split('T')[0]}_${new Date(sl.endDate).toISOString().split('T')[0]}`;
                    if (seenSickLeaveDatesModal.has(dateKey)) return true;
                    seenSickLeaveDatesModal.add(dateKey);
                    return false;
                  }
                  
                  return false;
                };
                
                // 1. Arrêts maladie depuis les absences (type: 'Arrêt maladie' ou 'MAL')
                // C'est la source principale car elle inclut tous les arrêts maladie (manuels et workflow)
                absencesArray.forEach(absence => {
                  const absenceType = absence.type || '';
                  const isSickLeave = absenceType === 'Arrêt maladie' || absenceType === 'MAL';
                  if (!isSickLeave) return;
                  
                  if (absence.startDate && absence.endDate) {
                    const absenceStart = new Date(absence.startDate);
                    const absenceEnd = new Date(absence.endDate);
                    if (absenceStart <= endDate && absenceEnd >= startDate) {
                      const sl = {
                        startDate: absence.startDate,
                        endDate: absence.endDate,
                        reason: absence.reason || 'Arrêt maladie',
                        sickLeaveId: absence.sickLeaveId
                      };
                      if (!isDuplicateModal(sl)) {
                        filteredSickLeaves.push(sl);
                      }
                    }
                  }
                });
                
                // 2. Arrêts maladie depuis sickLeaves
                if (Array.isArray(sickLeavesArray)) {
                  sickLeavesArray.forEach(sl => {
                    if (sl.startDate && sl.endDate) {
                      const slStart = new Date(sl.startDate);
                      const slEnd = new Date(sl.endDate);
                      if (slStart <= endDate && slEnd >= startDate) {
                        const slObj = {
                          startDate: sl.startDate,
                          endDate: sl.endDate,
                          reason: sl.reason || 'Arrêt maladie',
                          sickLeaveId: sl._id || sl.sickLeaveId
                        };
                        if (!isDuplicateModal(slObj)) {
                          filteredSickLeaves.push(slObj);
                        }
                      }
                    }
                  });
                }
                
                // 3. Arrêt maladie actuel (employee.sickLeave)
                // On l'ajoute seulement s'il n'est pas déjà dans les autres sources
                if (emp.sickLeave && emp.sickLeave.isOnSickLeave) {
                  const start = emp.sickLeave.startDate ? new Date(emp.sickLeave.startDate) : null;
                  const end = emp.sickLeave.endDate ? new Date(emp.sickLeave.endDate) : null;
                  if (start && end && start <= endDate && end >= startDate) {
                    const sl = {
                      startDate: emp.sickLeave.startDate,
                      endDate: emp.sickLeave.endDate,
                      reason: 'Arrêt maladie',
                      sickLeaveId: emp.sickLeave.sickLeaveId
                    };
                    if (!isDuplicateModal(sl)) {
                      filteredSickLeaves.push(sl);
                    }
                  }
                }
                
                // Filtrer les retards
                const filteredDelays = delaysArray.filter(d => {
                  if (d.date) {
                    const dDate = new Date(d.date);
                    return dDate >= startDate && dDate <= endDate;
                  }
                  return false;
                });
                
                return (
                  <div>
                    <h3>Absences ({filteredAbsences.length})</h3>
                    {filteredAbsences.length > 0 ? (
                      <ul>
                        {filteredAbsences.map((a, idx) => (
                          <li key={idx}>
                            {new Date(a.startDate).toLocaleDateString('fr-FR')} - {new Date(a.endDate).toLocaleDateString('fr-FR')}
                            {a.reason && ` (${a.reason})`}
                          </li>
                        ))}
                      </ul>
                    ) : <p>Aucune absence</p>}
                    
                    <h3>Arrêts maladie ({filteredSickLeaves.length})</h3>
                    {filteredSickLeaves.length > 0 ? (
                      <ul>
                        {filteredSickLeaves.map((sl, idx) => (
                          <li key={idx}>
                            {new Date(sl.startDate).toLocaleDateString('fr-FR')} - {new Date(sl.endDate).toLocaleDateString('fr-FR')}
                            {sl.reason && ` (${sl.reason})`}
                          </li>
                        ))}
                      </ul>
                    ) : <p>Aucun arrêt maladie</p>}
                    
                    <h3>Retards ({filteredDelays.length})</h3>
                    {filteredDelays.length > 0 ? (
                      <ul>
                        {filteredDelays.map((d, idx) => (
                          <li key={idx}>
                            {new Date(d.date).toLocaleDateString('fr-FR')} - {d.duration} minutes
                            {d.reason && ` (${d.reason})`}
                          </li>
                        ))}
                      </ul>
                    ) : <p>Aucun retard</p>}
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedEmployeeDetail(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceStatus;
