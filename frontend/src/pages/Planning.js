import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Planning = () => {
  const [weekNumber, setWeekNumber] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [planning, setPlanning] = useState(null);
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null); // Non utilisé
  // const [affluenceLevels, setAffluenceLevels] = useState({
  //   Lundi: 2, Mardi: 2, Mercredi: 2, Jeudi: 2, Vendredi: 2, Samedi: 2, Dimanche: 2
  // }); // Non utilisé

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  useEffect(() => {
    // Récupérer les paramètres d'URL
    const urlParams = new URLSearchParams(window.location.search);
    const week = urlParams.get('week');
    const yearParam = urlParams.get('year');

    if (week) setWeekNumber(week);
    if (yearParam) setYear(parseInt(yearParam));
    else {
      // Calculer automatiquement la semaine actuelle
      const now = new Date();
      const currentWeek = getWeekNumber(now);
      setWeekNumber(currentWeek);
    }
  }, []);

  useEffect(() => {
    if (weekNumber && year) {
      fetchPlanning();
    }
    // ⚠️ Ne pas ajouter fetchPlanning dans les dépendances pour éviter les boucles et
    // l'erreur "Cannot access 'N' before initialization" liée à la création de la fonction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekNumber, year]);

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Fonction pour calculer la date de chaque jour
  const getDayDate = (weekNumber, year, dayIndex) => {
    const firstDayOfWeek = new Date(year, 0, 1);
    // const dayOfWeek = firstDayOfWeek.getDay(); // Non utilisé
    const daysSinceStartOfYear = Math.floor((weekNumber - 1) * 7) + dayIndex;
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + daysSinceStartOfYear);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Fonction pour déterminer le type de shift
  const getShiftType = (shift) => {
    const startHour = parseInt(shift.startTime.split(':')[0]);
    if (startHour <= 7) return 'Ouverture';
    if (startHour >= 16) return 'Fermeture';
    return 'Standard';
  };

  // Fonction pour obtenir la couleur du shift
  const getShiftColor = (shiftType) => {
    switch (shiftType) {
      case 'Ouverture':
        return '#28a745'; // Vert pour ouverture
      case 'Fermeture':
        return '#dc3545'; // Rouge pour fermeture
      default:
        return '#007bff'; // Bleu pour standard
    }
  };

  const fetchPlanning = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/planning/${weekNumber}/${year}`);
      setPlanning(response.data);
    } catch (error) {
      setPlanning(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePlanning = async () => {
    if (!weekNumber || !year) {
      toast.error('Veuillez saisir le numéro de semaine et l\'année');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/planning/generate', {
        weekNumber: parseInt(weekNumber),
        year: parseInt(year),
        affluenceLevels: {
          Lundi: 2, Mardi: 2, Mercredi: 2, Jeudi: 2, Vendredi: 2, Samedi: 2, Dimanche: 2
        }
      });

      toast.success('Planning généré avec succès !');
      setPlanning(response.data.plannings);
    } catch (error) {
      toast.error('Erreur lors de la génération du planning');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // const validatePlanning = async (planningId) => {
  //   try {
  //     await api.patch(`/planning/${planningId}/validate`);
  //     toast.success('Planning validé');
  //     fetchPlanning();
  //   } catch (error) {
  //     toast.error('Erreur lors de la validation');
  //   }
  // }; // Non utilisé

  const markAsRealized = async (planningId) => {
    try {
      await api.patch(`/planning/${planningId}/realize`, {
        status: 'realized'
      });
      toast.success('Planning marqué comme réalisé');
      fetchPlanning();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // Retirer les secondes si présentes
  };

  const getStaffCountByDay = (planning, day) => {
    return planning.filter(emp => {
      const daySchedule = emp.schedule.find(s => s.day === day);
      // Ne compter que les personnes réellement en vente (au moins un shift),
      // et ignorer les jours de Repos / Formation / CP / Maladie / autre contrainte.
      return daySchedule && daySchedule.shifts.length > 0;
    }).length;
  };

  const getTotalHoursByDay = (planning, day) => {
    return planning.reduce((total, emp) => {
      const daySchedule = emp.schedule.find(s => s.day === day);
      if (daySchedule && daySchedule.shifts.length > 0) {
        return total + daySchedule.totalHours;
      }
      return total;
    }, 0);
  };

  // Calcul des heures travaillées à partir des horaires (avec pause 30min si >= 5h30)
  const calculateHoursFromTimes = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    let hours = (endMinutes - startMinutes) / 60;
    if (hours <= 0) return 0;
    // Même règle que côté backend : pause de 30min si journée >= 5h30
    if (hours >= 5.5) {
      hours -= 0.5;
    }
    return Math.max(0, hours);
  };

  // Permet de modifier un shift directement dans le tableau
  const handleShiftChange = (planningId, day, shiftIndex, field, value) => {
    setPlanning(prev =>
      prev.map(empPlanning => {
        if (empPlanning._id !== planningId) return empPlanning;

        const newSchedule = empPlanning.schedule.map(daySchedule => {
          if (daySchedule.day !== day) return daySchedule;

          const newShifts = daySchedule.shifts.map((shift, idx) => {
            if (idx !== shiftIndex) return shift;

            const updatedShift = { ...shift, [field]: value };

            if (field === 'startTime' || field === 'endTime') {
              updatedShift.hoursWorked = calculateHoursFromTimes(
                updatedShift.startTime,
                updatedShift.endTime
              );
            }

            return updatedShift;
          });

          const totalHours = newShifts.reduce(
            (sum, sh) => sum + (sh.hoursWorked || 0),
            0
          );

          return {
            ...daySchedule,
            shifts: newShifts,
            totalHours
          };
        });

        const totalWeeklyHours = newSchedule.reduce(
          (sum, ds) => sum + (ds.totalHours || 0),
          0
        );

        return {
          ...empPlanning,
          schedule: newSchedule,
          totalWeeklyHours
        };
      })
    );
  };

  return (
    <div className="planning fade-in">
      <div className="card">
        <h2>🎯 Génération du planning</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label>Semaine :</label>
            <input
              type="number"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              min="1"
              max="53"
              style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label>Année :</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
              style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={generatePlanning}
            disabled={loading}
          >
            {loading ? 'Génération...' : '🎯 Générer le planning'}
          </button>

        </div>
      </div>

      {loading && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading"></div>
            <p>Génération du planning en cours...</p>
          </div>
        </div>
      )}

      {planning && !loading && (
        <div>
          {/* Résumé des totaux par jour */}
          <div className="card">
            <h3>📊 Résumé par jour</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Personnel présent</th>
                    <th>Total heures</th>
                    <th>Affluence</th>
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeek.map(day => (
                    <tr key={day}>
                      <td style={{ fontWeight: 'bold' }}>{day}</td>
                      <td>{getStaffCountByDay(planning, day)} personnes</td>
                      <td>{getTotalHoursByDay(planning, day).toFixed(1)}h</td>
                      <td>2/4</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Planning détaillé */}
          <div className="card">
            <h3>📅 Planning détaillé - Semaine {weekNumber} ({year})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Employé</th>
                    {daysOfWeek.map((day, index) => {
                      const dayDate = getDayDate(weekNumber, year, index);
                      return (
                        <th key={day}>
                          {day}<br />
                          <small style={{ fontSize: '0.8rem', color: '#666' }}>
                            {dayDate}
                          </small>
                        </th>
                      );
                    })}
                    <th>Total semaine</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {planning.map(employeePlanning => (
                    <tr key={employeePlanning.employeeId}>
                      <td style={{ fontWeight: 'bold' }}>
                        {employeePlanning.employeeName}
                      </td>
                      {daysOfWeek.map(day => {
                        const daySchedule = employeePlanning.schedule.find(s => s.day === day);
                        return (
                          <td key={day}>
                            {daySchedule && daySchedule.shifts.length > 0 ? (
                              <div>
                                {daySchedule.shifts.map((shift, index) => {
                                  const shiftType = getShiftType(shift);
                                  const shiftColor = getShiftColor(shiftType);
                                  
                                  return (
                                    <div key={index} className="planning-shift" style={{ color: shiftColor }}>
                                      <input
                                        type="time"
                                        value={formatTime(shift.startTime)}
                                        onChange={(e) =>
                                          handleShiftChange(
                                            employeePlanning._id,
                                            day,
                                            index,
                                            'startTime',
                                            e.target.value
                                          )
                                        }
                                        style={{ width: '90px', marginRight: '0.25rem' }}
                                      />
                                      {' - '}
                                      <input
                                        type="time"
                                        value={formatTime(shift.endTime)}
                                        onChange={(e) =>
                                          handleShiftChange(
                                            employeePlanning._id,
                                            day,
                                            index,
                                            'endTime',
                                            e.target.value
                                          )
                                        }
                                        style={{ width: '90px', marginLeft: '0.25rem' }}
                                      />
                                      <br />
                                      <small style={{ color: shiftColor }}>
                                        {shiftType}
                                      </small>
                                    </div>
                                  );
                                })}
                                <small style={{ color: '#666' }}>
                                  {daySchedule.totalHours.toFixed(1)}h
                                </small>
                              </div>
                            ) : daySchedule && daySchedule.constraint ? (
                              <div className="planning-constraint" style={{ 
                                color: daySchedule.constraint === 'MAL' ? '#dc3545' : '#666',
                                fontWeight: daySchedule.constraint === 'MAL' ? 'bold' : 'normal'
                              }}>
                                {daySchedule.constraint}
                              </div>
                            ) : (
                              <span style={{ color: '#999' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ fontWeight: 'bold' }}>
                        {employeePlanning.schedule.reduce((total, day) => {
                          return total + (day.totalHours || 0);
                        }, 0).toFixed(1)}h
                        <br />
                        <small style={{ color: '#666' }}>
                          /{employeePlanning.contractedHours}h
                        </small>
                      </td>
                      <td>
                        {employeePlanning.status === 'generated' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => markAsRealized(employeePlanning._id)}
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          >
                            ✅ Marquer comme réalisé
                          </button>
                        )}
                        {employeePlanning.status === 'realized' && (
                          <span className="badge badge-success">✅ Réalisé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Total jour</td>
                    {daysOfWeek.map(day => (
                      <td key={day}>
                        {getStaffCountByDay(planning, day)} pers /{' '}
                        {getTotalHoursByDay(planning, day).toFixed(1)}h
                      </td>
                    ))}
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;

