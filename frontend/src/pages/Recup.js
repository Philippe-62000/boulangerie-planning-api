import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Recup.css';

const getMonday = (date) => {
  const ref = new Date(date);
  const day = ref.getDay() || 7;
  if (day !== 1) {
    ref.setDate(ref.getDate() - (day - 1));
  }
  ref.setHours(0, 0, 0, 0);
  return ref;
};

const formatDateForInput = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

const parseInputDate = (value) => {
  if (!value) {
    return getMonday(new Date());
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return getMonday(new Date());
  }
  return getMonday(parsed);
};

const formatWeekLabel = (date) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return formatter.format(date);
};

const formatWeekRange = (weekStartValue) => {
  if (!weekStartValue) {
    return '';
  }
  const start = new Date(weekStartValue);
  if (Number.isNaN(start.getTime())) {
    return '';
  }
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const dayFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return `${dayFormatter.format(start)} → ${dayFormatter.format(end)}`;
};

const formatHours = (value) => {
  const numberValue = Number.parseFloat(value) || 0;
  const rounded = Math.round(numberValue * 100) / 100;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toFixed(2)} h`;
};

const getWeekNumber = (date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
};

const Recup = () => {
  const { isAdmin } = useAuth();
  const [weekStart, setWeekStart] = useState(() => formatDateForInput(getMonday(new Date())));
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyModal, setHistoryModal] = useState({
    open: false,
    loading: false,
    employee: null,
    entries: [],
    total: 0,
    aggregateTotal: 0
  });

  const loadRecupData = useCallback(async (weekValue) => {
    setLoading(true);
    try {
      const response = await api.get('/recup-hours', {
        params: { weekStart: weekValue }
      });

      if (response.data?.success) {
        const { data } = response.data;
        setEmployees(
          (data.employees || []).map((employee) => ({
            ...employee,
            weekHours: Number(employee.weekHours || 0),
            totalHours: Number(employee.totalHours || 0),
            comment: employee.comment || ''
          }))
        );
      } else {
        toast.error('Impossible de charger les heures de récup');
      }
    } catch (error) {
      console.error('❌ Erreur chargement heures récup:', error);
      toast.error('Erreur lors du chargement des heures de récup');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecupData(weekStart);
  }, [weekStart, loadRecupData]);

  const handleWeekChange = (event) => {
    const nextWeek = formatDateForInput(parseInputDate(event.target.value));
    setWeekStart(nextWeek);
  };

  const shiftWeek = (offset) => {
    const current = parseInputDate(weekStart);
    current.setDate(current.getDate() + offset * 7);
    setWeekStart(formatDateForInput(getMonday(current)));
  };

  const handleHoursChange = (employeeId, value) => {
    const parsed = Number.parseFloat(value);
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.employeeId === employeeId
          ? { ...employee, weekHours: Number.isNaN(parsed) ? 0 : parsed }
          : employee
      )
    );
  };

  const handleCommentChange = (employeeId, value) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.employeeId === employeeId ? { ...employee, comment: value } : employee
      )
    );
  };

  const openHistoryModal = async (employee) => {
    setHistoryModal({
      open: true,
      loading: true,
      employee,
      entries: [],
      total: 0,
      aggregateTotal: Number(employee.totalHours || 0)
    });

    try {
      const response = await api.get(`/recup-hours/${employee.employeeId}/history`);

      if (response.data?.success) {
        const { data } = response.data;
        setHistoryModal((prev) => ({
          ...prev,
          loading: false,
          entries: (data.entries || []).map((entry) => ({
            ...entry,
            hours: Number(entry.hours || 0)
          })),
          total: Number(data.totalHours || 0)
        }));
      } else {
        setHistoryModal((prev) => ({
          ...prev,
          loading: false
        }));
        toast.error('Impossible de récupérer les détails de cette personne');
      }
    } catch (error) {
      console.error('❌ Erreur historique heures récup:', error);
      setHistoryModal((prev) => ({
        ...prev,
        loading: false
      }));
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const closeHistoryModal = () => {
    setHistoryModal({
      open: false,
      loading: false,
      employee: null,
      entries: [],
      total: 0,
      aggregateTotal: 0
    });
  };

  const saveRecupHours = async () => {
    try {
      setSaving(true);
      await api.post('/recup-hours', {
        weekStart,
        entries: employees.map((employee) => ({
          employeeId: employee.employeeId,
          hours: Number(employee.weekHours) || 0,
          comment: employee.comment || ''
        }))
      });
      toast.success('Heures de récup enregistrées avec succès');
      await loadRecupData(weekStart);
    } catch (error) {
      console.error('❌ Erreur sauvegarde heures récup:', error);
      toast.error('Erreur lors de la sauvegarde des heures de récup');
    } finally {
      setSaving(false);
    }
  };

  const isAdminUser = isAdmin();

  const computedTotals = useMemo(() => {
    const weekTotal = employees.reduce((sum, employee) => sum + (Number(employee.weekHours) || 0), 0);
    const cumulativeTotal = employees.reduce(
      (sum, employee) => sum + (Number(employee.totalHours) || 0),
      0
    );
    return {
      weekTotal,
      cumulativeTotal
    };
  }, [employees]);

  const currentWeekStart = parseInputDate(weekStart);
  const weekNumber = getWeekNumber(currentWeekStart);

  return (
    <div className="recup-page fade-in">
      <div className="recup-header">
        <div className="recup-header-title">
          <h2>⏱️ Heures de récup</h2>
          <p>
            Semaine {weekNumber} · {formatWeekLabel(currentWeekStart)}
          </p>
        </div>
        <div className="recup-week-selector">
          <button
            type="button"
            className="nav-button"
            onClick={() => shiftWeek(-1)}
            disabled={loading}
            aria-label="Semaine précédente"
          >
            ◀
          </button>
          <input
            type="date"
            value={weekStart}
            onChange={handleWeekChange}
            disabled={loading}
          />
          <button
            type="button"
            className="nav-button"
            onClick={() => shiftWeek(1)}
            disabled={loading}
            aria-label="Semaine suivante"
          >
            ▶
          </button>
        </div>
        {isAdminUser && (
          <button
            type="button"
            className="btn btn-success"
            onClick={saveRecupHours}
            disabled={saving || loading}
          >
            {saving ? '💾 Sauvegarde...' : '💾 Enregistrer'}
          </button>
        )}
      </div>

      {!isAdminUser && (
        <div className="recup-info card">
          <p>Consultation des heures de récup. Contactez votre responsable pour toute modification.</p>
        </div>
      )}

      <div className="recup-summary">
        <div className="recup-summary-card">
          <span className="summary-label">Total semaine</span>
          <span className={`summary-value ${computedTotals.weekTotal >= 0 ? 'positive' : 'negative'}`}>
            {computedTotals.weekTotal > 0 ? '+' : ''}
            {computedTotals.weekTotal.toFixed(2)} h
          </span>
        </div>
        <div className="recup-summary-card">
          <span className="summary-label">Cumul global</span>
          <span
            className={`summary-value ${computedTotals.cumulativeTotal >= 0 ? 'positive' : 'negative'}`}
          >
            {computedTotals.cumulativeTotal > 0 ? '+' : ''}
            {computedTotals.cumulativeTotal.toFixed(2)} h
          </span>
        </div>
      </div>

      <div className="recup-card">
        {loading ? (
          <div className="recup-loading">
            <div className="loading-spinner" />
            <p>Chargement des heures de récup...</p>
          </div>
        ) : (
          <table className="recup-table">
            <thead>
              <tr>
                <th>Salarié</th>
                <th>Total cumulé</th>
                <th>Heures semaine</th>
                <th>Justificatif</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const cumulativeClass =
                  employee.totalHours > 0 ? 'positive' : employee.totalHours < 0 ? 'negative' : 'neutral';
                const weekClass =
                  employee.weekHours > 0 ? 'positive' : employee.weekHours < 0 ? 'negative' : 'neutral';

                return (
                  <tr key={employee.employeeId}>
                    <td>
                      <div className="employee-name">{employee.employeeName}</div>
                      <div className="employee-role">{employee.role}</div>
                      <button
                        type="button"
                        className="detail-button"
                        onClick={() => openHistoryModal(employee)}
                        disabled={
                          loading ||
                          (historyModal.loading &&
                            historyModal.employee?.employeeId === employee.employeeId)
                        }
                      >
                        Détails
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${cumulativeClass}`}>
                        {employee.totalHours > 0 ? '+' : ''}
                        {Number(employee.totalHours || 0).toFixed(2)} h
                      </span>
                    </td>
                    <td>
                      <div className="hours-input-wrapper">
                        <input
                          type="number"
                          step="0.25"
                          className={`hours-input ${weekClass}`}
                          value={employee.weekHours}
                          disabled={!isAdminUser}
                          onChange={(e) => handleHoursChange(employee.employeeId, e.target.value)}
                        />
                        <span className={`hours-helper ${weekClass}`}>
                          {employee.weekHours > 0 ? 'À récupérer' : employee.weekHours < 0 ? 'Récupéré' : 'Équilibre'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <textarea
                        className="justificatif-input"
                        rows={2}
                        value={employee.comment}
                        disabled={!isAdminUser}
                        onChange={(e) => handleCommentChange(employee.employeeId, e.target.value)}
                        placeholder="Raison du dépassement"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && employees.length === 0 && (
        <div className="recup-empty card">
          <h3>👥 Aucun salarié</h3>
          <p>Ajoutez des salariés pour commencer à suivre les heures de récup.</p>
        </div>
      )}

      {historyModal.open && (
        <div className="recup-history-backdrop" role="presentation" onClick={closeHistoryModal}>
          <div
            className="recup-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recup-history-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-header">
              <div>
                <h3 id="recup-history-title">Détails des heures</h3>
                <p className="history-employee">
                  {historyModal.employee?.employeeName}{' '}
                  <span className="history-role">{historyModal.employee?.role}</span>
                </p>
              </div>
              <button type="button" className="history-close" onClick={closeHistoryModal}>
                ✕
              </button>
            </div>

            <div className="history-summary">
              <div className="history-summary-item">
                <span className="summary-label">Total cumulé (tableau)</span>
                <span
                  className={`summary-value ${
                    historyModal.aggregateTotal >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {formatHours(historyModal.aggregateTotal)}
                </span>
              </div>
              <div className="history-summary-item">
                <span className="summary-label">Somme du détail</span>
                <span className={`summary-value ${historyModal.total >= 0 ? 'positive' : 'negative'}`}>
                  {formatHours(historyModal.total)}
                </span>
              </div>
              <div className="history-summary-item">
                <span className="summary-label">Écart</span>
                <span
                  className={`summary-value ${
                    Math.abs(historyModal.aggregateTotal - historyModal.total) < 0.01
                      ? 'neutral'
                      : 'negative'
                  }`}
                >
                  {formatHours(historyModal.aggregateTotal - historyModal.total)}
                </span>
              </div>
            </div>

            {historyModal.loading ? (
              <div className="history-loading">
                <div className="loading-spinner" />
                <p>Chargement du détail...</p>
              </div>
            ) : historyModal.entries.length === 0 ? (
              <div className="history-empty">
                <p>Aucun historique d’heures de récup enregistré pour ce salarié.</p>
              </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="recup-history-table">
                  <thead>
                    <tr>
                      <th>Semaine</th>
                      <th>Heures</th>
                      <th>Justificatif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyModal.entries.map((entry) => {
                      const weekStartDate = entry.weekStart ? new Date(entry.weekStart) : null;
                      const weekNumberLabel =
                        weekStartDate && !Number.isNaN(weekStartDate.getTime())
                          ? `Semaine ${getWeekNumber(weekStartDate)}`
                          : '';
                      return (
                        <tr key={`${entry.weekStart}-${entry.hours}`}>
                          <td>
                            <div className="history-week">
                              <span className="week-number">{weekNumberLabel}</span>
                              <span className="week-range">{formatWeekRange(entry.weekStart)}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                entry.hours > 0 ? 'positive' : entry.hours < 0 ? 'negative' : 'neutral'
                              }`}
                            >
                              {formatHours(entry.hours)}
                            </span>
                          </td>
                          <td>
                            {entry.comment ? (
                              <span className="history-comment">{entry.comment}</span>
                            ) : (
                              <span className="history-comment muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Recup;

