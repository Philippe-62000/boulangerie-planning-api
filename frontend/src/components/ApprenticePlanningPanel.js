import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import { getStoredToken } from '../config/apiConfig';
import './ApprenticePlanningPanel.css';

const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];

const COLORS = [
  '#c0392b',
  '#2980b9',
  '#27ae60',
  '#8e44ad',
  '#d35400',
  '#16a085',
  '#2c3e50',
  '#e67e22'
];

function toIsoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, monthIndex, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const ApprenticePlanningPanel = ({ apprentices = [] }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [globalRows, setGlobalRows] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [planningByEmployee, setPlanningByEmployee] = useState({});

  const siteKey = getSiteKey();

  const loadListMeta = useCallback(async () => {
    try {
      const res = await api.get('/apprentice-plannings', { params: { siteKey } });
      if (res.data?.success) {
        const map = {};
        (res.data.data || []).forEach((p) => {
          const id = String(p.employeeId?._id || p.employeeId);
          map[id] = p;
        });
        setPlanningByEmployee(map);
      }
    } catch (e) {
      console.warn('apprentice-plannings list', e.message);
    }
  }, [siteKey]);

  useEffect(() => {
    loadListMeta();
  }, [loadListMeta]);

  const openGlobal = async () => {
    setShowGlobal(true);
    setLoadingGlobal(true);
    try {
      const res = await api.get('/apprentice-plannings/global', { params: { siteKey } });
      if (res.data?.success) {
        setGlobalRows(res.data.data || []);
      } else {
        toast.error(res.data?.error || 'Erreur chargement planning global');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('Sélectionnez un apprenti');
      return;
    }
    if (!file) {
      toast.error('Choisissez un fichier PDF');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('employeeId', employeeId);
      fd.append('siteKey', siteKey);
      const res = await api.post('/apprentice-plannings', fd);
      if (res.data?.success) {
        toast.success(res.data.message || 'Planning enregistré');
        setShowUpload(false);
        setFile(null);
        setEmployeeId('');
        await loadListMeta();
      } else {
        toast.error(res.data?.error || 'Erreur');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadPlanning = async (planningId, fallbackName) => {
    if (!planningId) return;
    try {
      const token = getStoredToken();
      const base = api.defaults.baseURL;
      const res = await fetch(`${base}/apprentice-plannings/${planningId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fallbackName || 'planning-apprenti.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.message || 'Téléchargement impossible');
    }
  };

  const colorByEmployee = useMemo(() => {
    const map = {};
    globalRows.forEach((r, i) => {
      map[String(r.employeeId)] = COLORS[i % COLORS.length];
    });
    return map;
  }, [globalRows]);

  const datesByDay = useMemo(() => {
    const map = {};
    globalRows.forEach((r) => {
      (r.trainingDates || []).forEach((iso) => {
        if (!map[iso]) map[iso] = [];
        map[iso].push(r);
      });
    });
    return map;
  }, [globalRows]);

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );

  return (
    <div className="apprentice-planning-panel">
      <div className="app-plan-actions">
        <button type="button" className="btn btn-primary" onClick={() => setShowUpload(true)}>
          Ajout planning
        </button>
        <button type="button" className="btn btn-secondary" onClick={openGlobal}>
          Planning global
        </button>
      </div>

      {apprentices.length > 0 && (
        <div className="app-plan-status-hint">
          {apprentices.map((emp) => {
            const p = planningByEmployee[String(emp._id)];
            return (
              <span key={emp._id} className={`app-plan-chip ${p ? 'has' : 'missing'}`}>
                {emp.name}
                {p ? ' · PDF' : ' · sans PDF'}
              </span>
            );
          })}
        </div>
      )}

      {showUpload && (
        <div className="app-plan-modal-backdrop" onClick={() => !uploading && setShowUpload(false)}>
          <div className="app-plan-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Ajouter un planning apprenti</h3>
            <form onSubmit={handleUpload}>
              <label>
                <span>Apprenti</span>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={uploading}
                  required
                >
                  <option value="">— Choisir —</option>
                  {apprentices.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Fichier PDF (planning officiel)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  required
                />
              </label>
              <p className="app-plan-help">
                Les jours de formation sont détectés automatiquement quand le PDF le permet
                (calendriers type CFA MEM). Sinon, les jours renseignés sur la fiche salarié sont
                utilisés pour le planning global.
              </p>
              <div className="app-plan-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={uploading}
                  onClick={() => setShowUpload(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Envoi…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGlobal && (
        <div className="app-plan-modal-backdrop" onClick={() => setShowGlobal(false)}>
          <div
            className="app-plan-modal app-plan-modal-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-plan-global-header">
              <h3>Planning global apprentis</h3>
              <button type="button" className="btn btn-secondary" onClick={() => setShowGlobal(false)}>
                Fermer
              </button>
            </div>

            {loadingGlobal ? (
              <p>Chargement…</p>
            ) : (
              <>
                <div className="app-plan-legend">
                  {globalRows.map((r) => (
                    <div key={r.employeeId} className="app-plan-legend-row">
                      <span
                        className="app-plan-dot"
                        style={{ background: colorByEmployee[String(r.employeeId)] }}
                      />
                      <strong>{r.name}</strong>
                      <span className="app-plan-muted">
                        {r.trainingDates?.length || 0} jour(s)
                        {r.datesSource === 'weekdays' ? ' · fiche salarié' : ''}
                        {r.datesSource === 'pdf-mem' ? ' · PDF' : ''}
                      </span>
                      {r.planningId ? (
                        <button
                          type="button"
                          className="btn btn-link"
                          onClick={() =>
                            downloadPlanning(r.planningId, r.fileName || `${r.name}.pdf`)
                          }
                        >
                          Télécharger le planning officiel
                        </button>
                      ) : (
                        <span className="app-plan-muted">Pas de PDF</span>
                      )}
                    </div>
                  ))}
                  {globalRows.length === 0 && <p>Aucun apprenti</p>}
                </div>

                <div className="app-plan-month-nav">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setCursor((c) => {
                        const d = new Date(c.year, c.month - 1, 1);
                        return { year: d.getFullYear(), month: d.getMonth() };
                      })
                    }
                  >
                    ←
                  </button>
                  <strong>
                    {MONTHS_FR[cursor.month]} {cursor.year}
                  </strong>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setCursor((c) => {
                        const d = new Date(c.year, c.month + 1, 1);
                        return { year: d.getFullYear(), month: d.getMonth() };
                      })
                    }
                  >
                    →
                  </button>
                </div>

                <div className="app-plan-calendar">
                  {WEEKDAYS_FR.map((w) => (
                    <div key={w} className="app-plan-cal-head">
                      {w}
                    </div>
                  ))}
                  {cells.map((day, idx) => {
                    if (!day) {
                      return <div key={`e-${idx}`} className="app-plan-cal-cell empty" />;
                    }
                    const iso = toIsoLocal(day);
                    const list = datesByDay[iso] || [];
                    return (
                      <div
                        key={iso}
                        className={`app-plan-cal-cell ${list.length ? 'has-training' : ''}`}
                      >
                        <div className="app-plan-day-num">{day.getDate()}</div>
                        <div className="app-plan-day-people">
                          {list.map((r) => (
                            <span
                              key={`${iso}-${r.employeeId}`}
                              className="app-plan-pill"
                              style={{ background: colorByEmployee[String(r.employeeId)] }}
                              title={r.name}
                            >
                              {r.name.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprenticePlanningPanel;
