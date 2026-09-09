import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  DAYS,
  addIsoWeeks,
  cellClass,
  cellLabel,
  formatDayRange,
  formatHours,
  getISOWeekInfo
} from '../utils/staffPlanning';
import './StaffPlanning.css';

const emptyEditor = {
  kind: 'shifts',
  start1: '08:00',
  end1: '16:00',
  start2: '',
  end2: '',
  code: 'REPOS',
  volumeHours: 7
};

const StaffPlanning = () => {
  const { user, isAdmin } = useAuth();
  const current = getISOWeekInfo();
  const [weekNumber, setWeekNumber] = useState(current.weekNumber);
  const [year, setYear] = useState(current.year);
  const [week, setWeek] = useState(null);
  const [dates, setDates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState(null);

  const canEdit = isAdmin();
  const myEmployeeId = user?.employeeId || user?.id;

  const loadWeek = useCallback(async (nextWeek, nextYear) => {
    setLoading(true);
    try {
      const response = await api.get(`/staff-planning/week/${nextYear}/${nextWeek}`);
      setWeek(response.data.week);
      setDates(response.data.dates || []);
      setSettings(response.data.settings);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Impossible de charger le planning');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeek(weekNumber, year);
  }, [weekNumber, year, loadWeek]);

  const loadCounters = useCallback(async () => {
    const monday = dates[0]?.date;
    if (!monday) return;
    const [y, m] = monday.split('-');
    try {
      const response = await api.get('/staff-planning/month-counters', {
        params: { year: Number(y), month: Number(m) }
      });
      setCounters(response.data.counters || []);
    } catch (error) {
      console.error(error);
    }
  }, [dates]);

  useEffect(() => {
    loadCounters();
  }, [loadCounters, week]);

  const monthLabel = useMemo(() => {
    const monday = dates[0]?.date;
    if (!monday) return '';
    const [y, m] = monday.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [dates]);

  const goWeek = (delta) => {
    const next = addIsoWeeks(weekNumber, year, delta);
    setWeekNumber(next.weekNumber);
    setYear(next.year);
  };

  const openEditor = (row, dayName) => {
    if (!canEdit) return;
    const day = (row.days || []).find((item) => item.day === dayName);
    const shifts = day?.shifts || [];
    setEditor({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      day: dayName,
      date: day?.date,
      kind: day?.kind && day.kind !== 'empty' ? day.kind : 'shifts',
      start1: shifts[0]?.startTime || emptyEditor.start1,
      end1: shifts[0]?.endTime || emptyEditor.end1,
      start2: shifts[1]?.startTime || '',
      end2: shifts[1]?.endTime || '',
      code: day?.code || settings?.defaultCfaCode || 'REPOS',
      volumeHours: day?.volumeHours || 7
    });
  };

  const saveCell = async (payload) => {
    setSaving(true);
    try {
      const response = await api.put(`/staff-planning/week/${year}/${weekNumber}/cell`, payload);
      setWeek(response.data.week);
      setAlerts(response.data.alerts || []);
      setEditor(null);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const submitEditor = () => {
    if (!editor) return;
    let cell = { kind: 'empty' };
    if (editor.kind === 'code') {
      cell = { kind: 'code', code: editor.code };
    } else if (editor.kind === 'hours') {
      cell = { kind: 'hours', volumeHours: Number(editor.volumeHours) || 0 };
    } else {
      const shifts = [{ startTime: editor.start1, endTime: editor.end1 }];
      if (editor.start2 && editor.end2) {
        shifts.push({ startTime: editor.start2, endTime: editor.end2 });
      }
      cell = { kind: 'shifts', shifts };
    }
    saveCell({ employeeId: editor.employeeId, day: editor.day, cell });
  };

  const clearCell = () => {
    if (!editor) return;
    saveCell({ employeeId: editor.employeeId, day: editor.day, cell: { kind: 'empty' } });
  };

  const confirmAlerts = (actionLabel) => {
    if (!alerts.length) return true;
    const preview = alerts.slice(0, 8).map((item) => `${item.employeeName} (${item.day}) : ${item.message}`).join('\n');
    const extra = alerts.length > 8 ? `\n… et ${alerts.length - 8} autre(s)` : '';
    return window.confirm(
      `${alerts.length} alerte(s) sur ce planning.\n\n${preview}${extra}\n\n${actionLabel} quand même ?`
    );
  };

  const validate = async () => {
    if (!confirmAlerts('Valider')) return;
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/validate`);
      setWeek(response.data.week);
      setAlerts(response.data.alerts || []);
      toast.success('Planning validé');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Validation impossible');
    }
  };

  const send = async () => {
    if (!confirmAlerts('Envoyer')) return;
    const update = (week?.sendCount || 0) > 0;
    if (!window.confirm(update
      ? 'Renvoyer le planning modifié à tous les salariés qui ont un e-mail ?'
      : 'Envoyer ce planning à tous les salariés qui ont un e-mail ?')) {
      return;
    }
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/send`);
      setWeek(response.data.week);
      setAlerts(response.data.alerts || []);
      const failed = (response.data.results || []).filter((item) => !item.ok);
      if (failed.length) {
        toast.warn(`Envoyé à ${response.data.sent}/${response.data.total}. ${failed.length} sans e-mail ou en échec.`);
      } else {
        toast.success(`Planning envoyé à ${response.data.sent} salarié(s)`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Envoi impossible');
    }
  };

  const duplicate = async () => {
    const target = addIsoWeeks(weekNumber, year, 1);
    if (!window.confirm(`Dupliquer la semaine ${weekNumber} vers la semaine ${target.weekNumber} ? Les jours CFA et le dimanche fermé seront réappliqués.`)) {
      return;
    }
    try {
      const response = await api.post(`/staff-planning/week/${year}/${weekNumber}/duplicate`, {
        targetWeek: target.weekNumber,
        targetYear: target.year
      });
      setWeekNumber(target.weekNumber);
      setYear(target.year);
      setWeek(response.data.week);
      setDates(response.data.dates || []);
      setAlerts(response.data.alerts || []);
      toast.success(`Semaine ${target.weekNumber} créée`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Duplication impossible');
    }
  };

  const printPlanning = () => {
    window.print();
  };

  const statusLabel = week?.status === 'sent'
    ? `Envoyé${week.sendCount > 1 ? ` (${week.sendCount} fois)` : ''}`
    : week?.status === 'validated'
      ? 'Validé'
      : 'Brouillon';

  return (
    <div className="staff-planning">
      <div className="sp-toolbar no-print">
        <div>
          <h2>Planning</h2>
          <p className="sp-sub">
            Semaine {weekNumber} — {formatDayRange(dates)}
            {settings?.sundayOpen === false ? ' · Dimanche fermé' : ''}
          </p>
        </div>
        <div className="sp-week-nav">
          <button type="button" className="btn btn-secondary" onClick={() => goWeek(-1)}>◀</button>
          <label>
            Semaine
            <input
              className="form-control"
              type="number"
              min="1"
              max="53"
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value) || weekNumber)}
            />
          </label>
          <label>
            Année
            <input
              className="form-control"
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || year)}
            />
          </label>
          <button type="button" className="btn btn-secondary" onClick={() => goWeek(1)}>▶</button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const now = getISOWeekInfo();
              setWeekNumber(now.weekNumber);
              setYear(now.year);
            }}
          >
            Semaine en cours
          </button>
        </div>
      </div>

      <div className="sp-actions no-print">
        <span className={`sp-status sp-status-${week?.status || 'draft'}`}>{statusLabel}</span>
        {alerts.length > 0 && (
          <span className="sp-status sp-status-alert">{alerts.length} alerte(s) — confirmation à l’envoi</span>
        )}
        {canEdit && (
          <>
            <button type="button" className="btn btn-secondary" onClick={duplicate}>Dupliquer vers la semaine suivante</button>
            <button type="button" className="btn btn-secondary" onClick={validate}>Valider</button>
            <button type="button" className="btn btn-primary" onClick={send}>
              {(week?.sendCount || 0) > 0 ? 'Renvoyer le planning modifié' : 'Envoyer aux salariés'}
            </button>
          </>
        )}
        <button type="button" className="btn btn-secondary" onClick={printPlanning}>Imprimer (affichage magasin)</button>
      </div>

      <div className="sp-print-header">
        <h1>Planning semaine {weekNumber} — {formatDayRange(dates)}</h1>
        <p>Chaque salarié inscrit, chaque jour travaillé, l’horaire de pause réellement pris (de … à …).</p>
      </div>

      {loading ? (
        <p className="no-print">Chargement du planning…</p>
      ) : (
        <div className="sp-table-wrap">
          <table className="sp-grid">
            <thead>
              <tr>
                <th>Salarié</th>
                {DAYS.map((day, index) => (
                  <th key={day}>
                    <div>{day}</div>
                    <small>{dates[index]?.date?.slice(8, 10)}/{dates[index]?.date?.slice(5, 7)}</small>
                  </th>
                ))}
                <th>Semaine</th>
              </tr>
            </thead>
            <tbody>
              {(week?.rows || []).map((row) => {
                const mine = String(row.employeeId) === String(myEmployeeId);
                const month = counters.find((item) => String(item.employeeId) === String(row.employeeId));
                return (
                  <tr key={row.employeeId} className={mine ? 'sp-row-mine' : undefined}>
                    <td className="sp-name">
                      <strong>{row.employeeName}</strong>
                      <small>{row.contractedHours}h</small>
                    </td>
                    {DAYS.map((dayName) => {
                      const day = (row.days || []).find((item) => item.day === dayName);
                      const label = cellLabel(day);
                      return (
                        <td
                          key={dayName}
                          className={`sp-cell ${cellClass(day)} ${canEdit ? 'sp-cell-edit' : ''}`}
                          onClick={() => openEditor(row, dayName)}
                        >
                          <div className="sp-cell-label">{label || '—'}</div>
                          {day?.kind === 'shifts' && day.paidHours > 0 && (
                            <div className="sp-cell-hours">{formatHours(day.paidHours)}</div>
                          )}
                          {day?.kind === 'code' && day.paidHours > 0 && (
                            <div className="sp-cell-hours">{formatHours(day.paidHours)}</div>
                          )}
                          {day?.alerts?.length > 0 && <div className="sp-cell-flag">!</div>}
                          <div className="sp-pause-line">Pause : de ______ à ______</div>
                        </td>
                      );
                    })}
                    <td className="sp-total">
                      <strong>{formatHours(row.weeklyPaidHours)}</strong>
                      <small>/ {formatHours(row.contractedHours)}</small>
                      {row.weeklyOt25 > 0 && <small>HS 25% {formatHours(row.weeklyOt25)}</small>}
                      {row.weeklyOt50 > 0 && <small>HS 50% {formatHours(row.weeklyOt50)}</small>}
                      {row.weeklySickDays > 0 && <small>Maladie {row.weeklySickDays} j</small>}
                      {month?.sickDays > 0 && <small>Mal. {monthLabel}: {month.sickDays} j</small>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="sp-alerts no-print">
          <h3>Alertes de la semaine</h3>
          <ul>
            {alerts.map((alert, index) => (
              <li key={`${alert.employeeName}-${alert.day}-${index}`}>
                <strong>{alert.employeeName}</strong> — {alert.day} : {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {editor && (
        <div className="sp-modal-backdrop" onClick={() => !saving && setEditor(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editor.employeeName} — {editor.day}</h3>
            <div className="sp-kind-tabs">
              {['shifts', 'code', 'hours'].map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={editor.kind === kind ? 'active' : ''}
                  onClick={() => setEditor((prev) => ({ ...prev, kind }))}
                >
                  {kind === 'shifts' ? 'Horaires' : kind === 'code' ? 'Mot-code' : 'Volume'}
                </button>
              ))}
            </div>
            {editor.kind === 'shifts' && (
              <div className="sp-shift-fields">
                <label>Créneau 1
                  <div className="sp-time-row">
                    <input type="time" className="form-control" value={editor.start1} onChange={(e) => setEditor((p) => ({ ...p, start1: e.target.value }))} />
                    <input type="time" className="form-control" value={editor.end1} onChange={(e) => setEditor((p) => ({ ...p, end1: e.target.value }))} />
                  </div>
                </label>
                <label>Créneau 2 (optionnel, coupure)
                  <div className="sp-time-row">
                    <input type="time" className="form-control" value={editor.start2} onChange={(e) => setEditor((p) => ({ ...p, start2: e.target.value }))} />
                    <input type="time" className="form-control" value={editor.end2} onChange={(e) => setEditor((p) => ({ ...p, end2: e.target.value }))} />
                  </div>
                </label>
              </div>
            )}
            {editor.kind === 'code' && (
              <label>
                Mot
                <select
                  className="form-control"
                  value={editor.code}
                  onChange={(e) => setEditor((p) => ({ ...p, code: e.target.value }))}
                >
                  {(settings?.words || []).map((word) => (
                    <option key={word.code} value={word.code}>
                      {word.code} ({formatHours(word.hours)})
                    </option>
                  ))}
                </select>
              </label>
            )}
            {editor.kind === 'hours' && (
              <label>
                Volume horaire
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.5"
                  value={editor.volumeHours}
                  onChange={(e) => setEditor((p) => ({ ...p, volumeHours: Number(e.target.value) }))}
                />
              </label>
            )}
            <div className="sp-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={clearCell} disabled={saving}>Effacer</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditor(null)} disabled={saving}>Annuler</button>
              <button type="button" className="btn btn-primary" onClick={submitEditor} disabled={saving}>
                {saving ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPlanning;
