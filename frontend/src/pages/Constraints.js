import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Constraints = () => {
  const [weekNumber, setWeekNumber] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState([]);
  const [constraints, setConstraints] = useState({});
  const [affluenceLevels, setAffluenceLevels] = useState({
    Lundi: 2, Mardi: 2, Mercredi: 2, Jeudi: 2, Vendredi: 2, Samedi: 2, Dimanche: 2
  });
  const [loading, setLoading] = useState(false);
  const [sixDayWorkers, setSixDayWorkers] = useState({});

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const constraintOptions = [
    { value: '', label: 'Travail normal' },
    { value: 'Fermé', label: 'Fermé' },
    { value: 'Matin', label: 'Matin seulement' },
    { value: 'Après-midi', label: 'Après-midi seulement' },
    { value: 'Repos', label: 'Repos' },
    { value: 'Formation', label: 'Formation (8h)' },
    { value: 'CP', label: 'Congé payé' },
    { value: 'MAL', label: 'Maladie' },
    { value: 'ABS', label: 'Absence' },
    { value: 'RET', label: 'Retard' },
    { value: 'Férié', label: 'Jour férié' },
    { value: 'Management', label: 'Management' }
  ];

  useEffect(() => {
    fetchEmployees();
    // Calculer automatiquement la semaine actuelle
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    setWeekNumber(currentWeek);
  }, []);

  useEffect(() => {
    if (weekNumber && year) {
      fetchConstraints();
    }
  }, [weekNumber, year]);

  // Appliquer automatiquement les jours de formation pour les apprentis
  useEffect(() => {
    if (employees.length > 0 && Object.keys(constraints).length > 0) {
      const updatedConstraints = { ...constraints };
      let hasChanges = false;

      employees.forEach(employee => {
        if (employee.contractType === 'Apprentissage' && employee.trainingDays) {
          employee.trainingDays.forEach(day => {
            if (constraints[employee._id]?.[day] !== 'Formation') {
              if (!updatedConstraints[employee._id]) {
                updatedConstraints[employee._id] = {};
              }
              updatedConstraints[employee._id][day] = 'Formation';
              hasChanges = true;
            }
          });
        }
      });

      if (hasChanges) {
        setConstraints(updatedConstraints);
      }
    }
  }, [employees, constraints]);

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      
      // L'API peut retourner soit { success: true, data: [...] } soit directement [...]
      let employeesData = null;
      if (response.data.success && response.data.data) {
        employeesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        employeesData = response.data;
      }
      
      if (employeesData) {
        setEmployees(employeesData.filter(emp => emp.isActive));
      } else {
        setEmployees([]);
        toast.error('Format de données invalide');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des employés');
      setEmployees([]);
    }
  };

  const fetchConstraints = async () => {
    try {
      const response = await api.get(`/constraints/${weekNumber}/${year}`);
      const constraintsMap = {};

      response.data.forEach(constraint => {
        constraintsMap[constraint.employeeId._id] = constraint.constraints;
      });

      setConstraints(constraintsMap);
    } catch (error) {
      // Si pas de contraintes trouvées, initialiser avec des valeurs vides
      const emptyConstraints = {};
      employees.forEach(employee => {
        emptyConstraints[employee._id] = {};
      });
      setConstraints(emptyConstraints);
    }
  };

  const handleConstraintChange = (employeeId, day, value) => {
    setConstraints(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [day]: value
      }
    }));
  };

  const handleAffluenceChange = (day, value) => {
    setAffluenceLevels(prev => ({
      ...prev,
      [day]: parseInt(value)
    }));
  };

  const applyGlobalConstraint = (day, constraint) => {
    setConstraints(prev => {
      const updated = { ...prev };
      employees.forEach(employee => {
        if (!updated[employee._id]) {
          updated[employee._id] = {};
        }
        updated[employee._id][day] = constraint;
      });
      return updated;
    });
  };

  const applySickLeave = (employeeId) => {
    setConstraints(prev => {
      const updated = { ...prev };
      if (!updated[employeeId]) {
        updated[employeeId] = {};
      }
      daysOfWeek.forEach(day => {
        updated[employeeId][day] = 'MAL';
      });
      return updated;
    });
    toast.success('Maladie appliquée pour toute la semaine');
  };

  // Fonction améliorée pour appliquer 6/7 jours de travail
  const applySixDaysWork = (employeeId) => {
    setSixDayWorkers(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));

    setConstraints(prev => {
      const updated = { ...prev };
      if (!updated[employeeId]) {
        updated[employeeId] = {};
      }
      
      if (sixDayWorkers[employeeId]) {
        // Désactiver 6j/7 - remettre toutes les contraintes
        daysOfWeek.forEach(day => {
          updated[employeeId][day] = '';
        });
        toast.success('6j/7 désactivé pour cet employé');
      } else {
        // Activer 6j/7 - forcer 1 jour de repos
        daysOfWeek.forEach(day => {
          updated[employeeId][day] = '';
        });
        
        // Choisir un jour de repos (généralement le dimanche)
        const restDay = 'Dimanche';
        updated[employeeId][restDay] = 'Repos';
        toast.success('6 jours de travail appliqués (1 jour de repos)');
      }
      
      return updated;
    });
  };

  const saveConstraints = async () => {
    setLoading(true);
    try {
      const promises = employees.map(employee => {
        const employeeConstraints = constraints[employee._id] || {};
        
        // Filtrer les contraintes vides et ne garder que les valeurs valides
        const filteredConstraints = {};
        daysOfWeek.forEach(day => {
          if (employeeConstraints[day] && employeeConstraints[day].trim() !== '') {
            filteredConstraints[day] = employeeConstraints[day];
          }
        });
        
        return api.post('/constraints', {
          weekNumber: parseInt(weekNumber),
          year: parseInt(year),
          employeeId: employee._id,
          constraints: filteredConstraints
        });
      });

      await Promise.all(promises);
      toast.success('Contraintes sauvegardées avec succès');
    } catch (error) {
      console.error('Erreur détaillée:', error);
      toast.error('Erreur lors de la sauvegarde des contraintes');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlanning = async () => {
    try {
      // D'abord sauvegarder les contraintes
      await saveConstraints();
      
      // Ensuite rediriger vers la génération du planning
      window.location.href = `/planning?week=${weekNumber}&year=${year}`;
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des contraintes');
    }
  };

  const getAffluenceLabel = (level) => {
    const labels = {
      0: 'Faible',
      1: 'Moyen-faible',
      2: 'Normal',
      3: 'Moyen-fort',
      4: 'Très fort'
    };
    return labels[level] || 'Normal';
  };

  // Fonction helper pour convertir les jours de la semaine en index de date
  const getDayOfWeekIndex = (day) => {
    const dayMap = {
      'Lundi': 1,
      'Mardi': 2,
      'Mercredi': 3,
      'Jeudi': 4,
      'Vendredi': 5,
      'Samedi': 6,
      'Dimanche': 0
    };
    return dayMap[day] || 1;
  };

  const getConstraintLabel = (constraint) => {
    const option = constraintOptions.find(opt => opt.value === constraint);
    return option ? option.label : 'Travail normal';
  };

  return (
    <div className="constraints fade-in">
      <h2>Contraintes hebdomadaires</h2>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Semaine n°</label>
            <input
              type="number"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              min="1"
              max="52"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Année</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2020"
              max="2030"
              style={{ width: '100px' }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={saveConstraints}
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>🌡️ Niveaux d'affluence</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
          {daysOfWeek.map(day => (
            <div key={day} className="form-group" style={{ margin: 0 }}>
              <label>{day}</label>
              <select
                value={affluenceLevels[day]}
                onChange={(e) => handleAffluenceChange(day, e.target.value)}
              >
                <option value={0}>Faible (0)</option>
                <option value={1}>Moyen-faible (1)</option>
                <option value={2}>Normal (2)</option>
                <option value={3}>Moyen-fort (3)</option>
                <option value={4}>Très fort (4)</option>
              </select>
              <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                {getAffluenceLabel(affluenceLevels[day])}
              </small>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>👥 Contraintes individuelles</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employé</th>
                {daysOfWeek.map(day => (
                  <th key={day}>
                    {day}
                    <br />
                    <button
                      className="btn btn-secondary"
                      onClick={() => applyGlobalConstraint(day, 'Fermé')}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
                      title={`Fermer ${day} pour tous`}
                    >
                      Fermer
                    </button>
                    <br />
                    <button
                      className="btn btn-warning"
                      onClick={() => applyGlobalConstraint(day, 'Férié')}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
                      title={`Enregistrer travail jour férié pour ${day}`}
                    >
                      Jour férié
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee._id}>
                  <td style={{ fontWeight: 'bold' }}>
                    {employee.name}
                    <br />
                    <small style={{ color: '#666' }}>
                      {employee.role} • {employee.weeklyHours}h
                    </small>
                    <br />
                    <button
                      className="btn btn-danger"
                      onClick={() => applySickLeave(employee._id)}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
                      title="Déclarer maladie pour toute la semaine"
                    >
                      🏥 Maladie
                    </button>
                    <br />
                    <button
                      className={`btn btn-info ${sixDayWorkers[employee._id] ? 'active' : ''}`}
                      onClick={() => applySixDaysWork(employee._id)}
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.25rem 0.5rem', 
                        marginTop: '0.25rem',
                        backgroundColor: sixDayWorkers[employee._id] ? '#17a2b8' : '#6c757d',
                        color: 'white'
                      }}
                      title={sixDayWorkers[employee._id] ? "Désactiver 6j/7" : "Appliquer 6 jours de travail (1 jour de repos)"}
                    >
                      {sixDayWorkers[employee._id] ? '✅ 6j/7' : '📅 6j/7'}
                    </button>
                  </td>
                  {daysOfWeek.map(day => (
                    <td key={day}>
                      {employee.sickLeave?.isOnSickLeave && 
                       new Date(employee.sickLeave.startDate) <= new Date(`${year}-${String(parseInt(weekNumber) + 1).padStart(2, '0')}-${getDayOfWeekIndex(day)}`) &&
                       new Date(employee.sickLeave.endDate) >= new Date(`${year}-${String(parseInt(weekNumber) + 1).padStart(2, '0')}-${getDayOfWeekIndex(day)}`) ? (
                        <div style={{ 
                          backgroundColor: '#f8d7da', 
                          color: '#721c24', 
                          padding: '0.5rem', 
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          🏥 Maladie
                        </div>
                      ) : (
                        <select
                          value={constraints[employee._id]?.[day] || ''}
                          onChange={(e) => handleConstraintChange(employee._id, day, e.target.value)}
                          style={{ width: '100%', fontSize: '0.9rem' }}
                        >
                          {constraintOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>📋 Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-success"
            onClick={handleGeneratePlanning}
            disabled={loading}
          >
            {loading ? '⏳ Sauvegarde...' : '🎯 Générer le planning'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const nextWeek = parseInt(weekNumber) + 1;
              setWeekNumber(nextWeek > 52 ? 1 : nextWeek);
              if (nextWeek > 52) setYear(year + 1);
            }}
          >
            Semaine suivante
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const prevWeek = parseInt(weekNumber) - 1;
              setWeekNumber(prevWeek < 1 ? 52 : prevWeek);
              if (prevWeek < 1) setYear(year - 1);
            }}
          >
            Semaine précédente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Constraints;

