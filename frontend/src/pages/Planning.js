import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Planning = () => {
  const [weekNumber, setWeekNumber] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [planning, setPlanning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [affluenceLevels, setAffluenceLevels] = useState({
    Lundi: 2, Mardi: 2, Mercredi: 2, Jeudi: 2, Vendredi: 2, Samedi: 2, Dimanche: 2
  });

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
  }, [weekNumber, year]);

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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
        affluenceLevels
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

  const validatePlanning = async (planningId) => {
    try {
      await api.patch(`/planning/${planningId}/validate`);
      toast.success('Planning validé');
      fetchPlanning();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const markAsRealized = async (planningId) => {
    try {
      await api.patch(`/planning/${planningId}/realize`, {
        status: 'realized'
      });
      toast.success('Planning marqué comme réalisé');
      fetchPlanning();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const printPlanning = () => {
    window.print();
  };

  const formatTime = (timeString) => {
    return timeString.replace(':', 'h');
  };

  const getTotalHoursByDay = (plannings, day) => {
    return plannings.reduce((total, planning) => {
      const daySchedule = planning.schedule.find(s => s.day === day);
      return total + (daySchedule ? daySchedule.totalHours : 0);
    }, 0);
  };

  const getStaffCountByDay = (plannings, day) => {
    return plannings.reduce((count, planning) => {
      const daySchedule = planning.schedule.find(s => s.day === day);
      return count + (daySchedule && daySchedule.shifts.length > 0 ? 1 : 0);
    }, 0);
  };

  return (
    <div className="planning fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Génération du planning</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {planning && (
            <button className="btn btn-secondary" onClick={printPlanning}>
              🖨️ Imprimer
            </button>
          )}
        </div>
      </div>

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
            onClick={generatePlanning}
            disabled={loading}
          >
            {loading ? 'Génération...' : '🎯 Générer le planning'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => window.location.href = `/plan/constraints?week=${weekNumber}&year=${year}`}
          >
            ✏️ Modifier contraintes
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
                      <td>{affluenceLevels[day]}/4</td>
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
                    {daysOfWeek.map(day => (
                      <th key={day}>{day}</th>
                    ))}
                    <th>Total semaine</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {planning.map(employeePlanning => (
                    <tr key={employeePlanning.employeeId}>
                      <td style={{ fontWeight: 'bold' }}>
                        {employeePlanning.employeeName}
                        <br />
                        <small style={{ color: '#666' }}>
                          {employeePlanning.contractedHours}h contractuelles
                        </small>
                      </td>
                      {daysOfWeek.map(day => {
                        const daySchedule = employeePlanning.schedule.find(s => s.day === day);
                        return (
                          <td key={day}>
                            {daySchedule && daySchedule.shifts.length > 0 ? (
                              <div>
                                {daySchedule.shifts.map((shift, index) => (
                                  <div key={index} className="planning-shift">
                                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                    {shift.breakMinutes > 0 && (
                                      <small> (pause: {shift.breakMinutes}min)</small>
                                    )}
                                    <br />
                                    <small>{shift.role}</small>
                                  </div>
                                ))}
                                <small style={{ color: '#666' }}>
                                  {daySchedule.totalHours.toFixed(1)}h
                                </small>
                              </div>
                            ) : daySchedule && daySchedule.constraint ? (
                              <div className="planning-constraint">
                                {daySchedule.constraint}
                              </div>
                            ) : (
                              <span style={{ color: '#999' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ fontWeight: 'bold' }}>
                        {employeePlanning.totalWeeklyHours.toFixed(1)}h
                        <br />
                        <small style={{
                          color: employeePlanning.totalWeeklyHours >= employeePlanning.contractedHours ? '#28a745' : '#dc3545'
                        }}>
                          /{employeePlanning.contractedHours}h
                        </small>
                      </td>
                      <td>
                        {employeePlanning.status === 'generated' && (
                          <button
                            className="btn btn-success"
                            onClick={() => validatePlanning(employeePlanning._id)}
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          >
                            ✅ Valider
                          </button>
                        )}
                        {employeePlanning.status === 'validated' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => markAsRealized(employeePlanning._id)}
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          >
                            ✅ Réalisé
                          </button>
                        )}
                        {employeePlanning.status === 'realized' && (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ Réalisé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!planning && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>📅 Aucun planning trouvé</h3>
          <p>Configurez les contraintes puis générez le planning pour la semaine {weekNumber}.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = `/constraints?week=${weekNumber}&year=${year}`}
            >
              Configurer les contraintes
            </button>
            <button
              className="btn btn-success"
              onClick={generatePlanning}
            >
              Générer le planning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;

