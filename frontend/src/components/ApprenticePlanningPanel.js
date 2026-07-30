import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, monthIndex, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isActiveApprentice(emp) {
  if (!emp) return false;
  if (emp.isActive === false) return false;
  if (!emp.contractEndDate) return true;
  const end = new Date(emp.contractEndDate);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end >= today;
}

const ApprenticePlanningPanel = ({ apprentices = [] }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [uploadMode, setUploadMode] = useState('pdf'); // pdf | manual
  const [employeeId, setEmployeeId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [globalRows, setGlobalRows] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [manualCursor, setManualCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [manualDates, setManualDates] = useState(() => new Set());
  const [manualPlanningId, setManualPlanningId] = useState(null);
  const [savingManual, setSavingManual] = useState(false);
  const [planningByEmployee, setPlanningByEmployee] = useState({});

  const siteKey = getSiteKey();

  const activeApprentices = useMemo(
    () => (apprentices || []).filter(isActiveApprentice),
    [apprentices]
  );

  const loadListMeta = useCallback(async () => {
    try {
      const res = await api.get('/apprentice-plannings', { params: { siteKey } });
      if (res.data?.success) {
        const map = {};
        (res.data.data || []).forEach((p) => {
          const emp = p.employeeId;
          if (emp && !isActiveApprentice(emp)) return;
          const id = String(emp?._id || p.employeeId);
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

  const openManualEditor = (opts = {}) => {
    const empId = opts.employeeId || employeeId || '';
    const dates = new Set(opts.trainingDates || []);
    setEmployeeId(empId);
    setManualPlanningId(opts.planningId || null);
    setManualDates(dates);
    setShowUpload(false);
    setShowManual(true);
  };

  const toggleManualDay = (iso) => {
    setManualDates((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  };

  const handleUploadPdf = async (e) => {
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
        await loadListMeta();
        setFile(null);
        if (res.data.needsManualDates) {
          openManualEditor({
            employeeId,
            planningId: res.data.data?._id,
            trainingDates: res.data.data?.trainingDates || []
          });
        } else {
          setShowUpload(false);
          setEmployeeId('');
        }
      } else {
        toast.error(res.data?.error || 'Erreur');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('Sélectionnez un apprenti');
      return;
    }
    const dates = [...manualDates].sort();
    if (dates.length === 0) {
      toast.error('Cliquez sur les jours de formation dans le calendrier');
      return;
    }
    setSavingManual(true);
    try {
      let res;
      if (manualPlanningId) {
        res = await api.put(`/apprentice-plannings/${manualPlanningId}/dates`, {
          trainingDates: dates
        });
      } else {
        res = await api.post('/apprentice-plannings/manual', {
          employeeId,
          siteKey,
          trainingDates: dates
        });
      }
      if (res.data?.success) {
        toast.success(res.data.message || 'Jours enregistrés');
        setShowManual(false);
        setEmployeeId('');
        setManualDates(new Set());
        setManualPlanningId(null);
        await loadListMeta();
      } else {
        toast.error(res.data?.error || 'Erreur');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSavingManual(false);
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

  const manualCells = useMemo(
    () => buildMonthCells(manualCursor.year, manualCursor.month),
    [manualCursor.year, manualCursor.month]
  );

  const closeOnBackdrop = (setter) => (e) => {
    if (e.target === e.currentTarget) setter(false);
  };

  const uploadModal = showUpload
    ? createPortal(
        <div className="app-plan-modal-backdrop" onMouseDown={closeOnBackdrop(setShowUpload)}>
          <div className="app-plan-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Ajouter un planning apprenti</h3>
            <div className="app-plan-tabs">
              <button
                type="button"
                className={uploadMode === 'pdf' ? 'active' : ''}
                onClick={() => setUploadMode('pdf')}
              >
                Importer PDF
              </button>
              <button
                type="button"
                className={uploadMode === 'manual' ? 'active' : ''}
                onClick={() => {
                  setUploadMode('manual');
                  setShowUpload(false);
                  openManualEditor({ employeeId });
                }}
              >
                Saisie manuelle des jours
              </button>
            </div>

            {uploadMode === 'pdf' && (
              <form onSubmit={handleUploadPdf}>
                <label>
                  <span>Apprenti</span>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={uploading}
                    required
                  >
                    <option value="">— Choisir —</option>
                    {activeApprentices.map((emp) => (
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
                  Si le PDF ne permet pas de détecter les jours (ex. calendriers Altern&apos;Emploi),
                  la saisie manuelle s&apos;ouvrira automatiquement après l&apos;import.
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
                    {uploading ? 'Envoi…' : 'Enregistrer le PDF'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  const manualModal = showManual
    ? createPortal(
        <div className="app-plan-modal-backdrop" onMouseDown={closeOnBackdrop(setShowManual)}>
          <div
            className="app-plan-modal app-plan-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="app-plan-global-header">
              <h3>Saisie manuelle des jours de formation</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowManual(false)}
              >
                Fermer
              </button>
            </div>
            <form onSubmit={handleSaveManual}>
              <label>
                <span>Apprenti</span>
                <select
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setManualPlanningId(
                      planningByEmployee[e.target.value]?._id || null
                    );
                    const existing = planningByEmployee[e.target.value]?.trainingDates || [];
                    setManualDates(new Set(existing));
                  }}
                  disabled={savingManual}
                  required
                >
                  <option value="">— Choisir —</option>
                  {activeApprentices.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </label>

              <p className="app-plan-help">
                Cliquez sur chaque jour de formation pour l&apos;ajouter ou le retirer.{' '}
                <strong>{manualDates.size}</strong> jour(s) sélectionné(s).
              </p>

              <div className="app-plan-month-nav">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setManualCursor((c) => {
                      const d = new Date(c.year, c.month - 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })
                  }
                >
                  ←
                </button>
                <strong>
                  {MONTHS_FR[manualCursor.month]} {manualCursor.year}
                </strong>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setManualCursor((c) => {
                      const d = new Date(c.year, c.month + 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })
                  }
                >
                  →
                </button>
              </div>

              <div className="app-plan-calendar app-plan-calendar-pick">
                {WEEKDAYS_FR.map((w) => (
                  <div key={w} className="app-plan-cal-head">
                    {w}
                  </div>
                ))}
                {manualCells.map((day, idx) => {
                  if (!day) {
                    return <div key={`me-${idx}`} className="app-plan-cal-cell empty" />;
                  }
                  const iso = toIsoLocal(day);
                  const selected = manualDates.has(iso);
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`app-plan-cal-cell pick ${selected ? 'selected' : ''}`}
                      onClick={() => toggleManualDay(iso)}
                    >
                      <div className="app-plan-day-num">{day.getDate()}</div>
                    </button>
                  );
                })}
              </div>

              <div className="app-plan-modal-actions" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={savingManual}
                  onClick={() => setShowManual(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingManual}>
                  {savingManual ? 'Enregistrement…' : 'Enregistrer les jours'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;

  const globalModal = showGlobal
    ? createPortal(
        <div className="app-plan-modal-backdrop" onMouseDown={closeOnBackdrop(setShowGlobal)}>
          <div
            className="app-plan-modal app-plan-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="app-plan-global-header">
              <h3>Planning global apprentis</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowGlobal(false)}
              >
                Fermer
              </button>
            </div>

            {loadingGlobal && globalRows.length === 0 ? (
              <p>Chargement…</p>
            ) : (
              <>
                <div className="app-plan-legend">
                  {globalRows.map((r) => (
                    <div key={String(r.employeeId)} className="app-plan-legend-row">
                      <span
                        className="app-plan-dot"
                        style={{ background: colorByEmployee[String(r.employeeId)] }}
                      />
                      <strong>{r.name}</strong>
                      <span className="app-plan-muted">
                        {r.trainingDates?.length || 0} jour(s)
                        {r.datesSource === 'manual' ? ' · saisie manuelle' : ''}
                        {r.datesSource === 'pdf-mem' ? ' · PDF' : ''}
                      </span>
                      {r.hasFile ? (
                        <button
                          type="button"
                          className="btn btn-link"
                          onClick={() =>
                            downloadPlanning(r.planningId, r.fileName || `${r.name}.pdf`)
                          }
                        >
                          Télécharger le PDF
                        </button>
                      ) : (
                        <span className="app-plan-muted">Pas de PDF</span>
                      )}
                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={() =>
                          openManualEditor({
                            employeeId: r.employeeId,
                            planningId: r.planningId,
                            trainingDates: r.trainingDates || []
                          })
                        }
                      >
                        Modifier les jours
                      </button>
                    </div>
                  ))}
                  {globalRows.length === 0 && (
                    <p>
                      Aucun planning intégré pour un apprenti en cours. Utilisez « Ajout planning »
                      puis importez un PDF ou saisissez les jours manuellement.
                    </p>
                  )}
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
        </div>,
        document.body
      )
    : null;

  return (
    <div className="apprentice-planning-panel">
      <div className="app-plan-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setUploadMode('pdf');
            setShowUpload(true);
          }}
        >
          Ajout planning
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => openManualEditor({})}
        >
          Saisie manuelle
        </button>
        <button type="button" className="btn btn-secondary" onClick={openGlobal}>
          Planning global
        </button>
      </div>

      {activeApprentices.length > 0 && (
        <div className="app-plan-status-hint">
          {activeApprentices.map((emp) => {
            const p = planningByEmployee[String(emp._id)];
            return (
              <span key={emp._id} className={`app-plan-chip ${p ? 'has' : 'missing'}`}>
                {emp.name}
                {p ? ' · intégré' : ' · sans planning'}
              </span>
            );
          })}
        </div>
      )}

      {uploadModal}
      {manualModal}
      {globalModal}
    </div>
  );
};

export default ApprenticePlanningPanel;
