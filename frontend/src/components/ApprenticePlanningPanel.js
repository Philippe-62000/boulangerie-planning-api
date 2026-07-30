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

const KIND_META = {
  examen: { label: "Période d'examen", color: '#5b6cff' },
  cfa: { label: 'CFA', color: '#d86dcd' },
  insitu: { label: 'In Situ Learning', color: '#2e9b59' }
};

const KIND_ORDER = ['cfa', 'insitu', 'examen'];

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

function entriesToMap(entries, dates) {
  const map = {};
  if (Array.isArray(entries) && entries.length) {
    entries.forEach((e) => {
      if (e?.date) map[e.date] = e.kind || 'cfa';
    });
    return map;
  }
  (dates || []).forEach((d) => {
    map[d] = 'cfa';
  });
  return map;
}

const ApprenticePlanningPanel = ({ apprentices = [] }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [uploadMode, setUploadMode] = useState('pdf');
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
  const [manualMap, setManualMap] = useState({});
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
      if (res.data?.success) setGlobalRows(res.data.data || []);
      else toast.error(res.data?.error || 'Erreur chargement planning global');
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const openManualEditor = (opts = {}) => {
    setEmployeeId(opts.employeeId || employeeId || '');
    setManualPlanningId(opts.planningId || null);
    setManualMap(entriesToMap(opts.trainingEntries, opts.trainingDates));
    setShowUpload(false);
    setShowGlobal(false);
    setShowManual(true);
  };

  const cycleManualDay = (iso) => {
    setManualMap((prev) => {
      const next = { ...prev };
      const cur = next[iso];
      if (!cur) next[iso] = 'cfa';
      else if (cur === 'cfa') next[iso] = 'insitu';
      else if (cur === 'insitu') next[iso] = 'examen';
      else delete next[iso];
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
            trainingEntries: res.data.data?.trainingEntries,
            trainingDates: res.data.data?.trainingDates
          });
        } else {
          setShowUpload(false);
          setEmployeeId('');
        }
      } else toast.error(res.data?.error || 'Erreur');
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
    const trainingEntries = Object.entries(manualMap)
      .map(([date, kind]) => ({ date, kind }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!trainingEntries.length) {
      toast.error('Cliquez sur les jours de formation (rose / vert / bleu)');
      return;
    }
    setSavingManual(true);
    try {
      let res;
      if (manualPlanningId) {
        res = await api.put(`/apprentice-plannings/${manualPlanningId}/dates`, {
          trainingEntries
        });
      } else {
        res = await api.post('/apprentice-plannings/manual', {
          employeeId,
          siteKey,
          trainingEntries
        });
      }
      if (res.data?.success) {
        toast.success(res.data.message || 'Jours enregistrés');
        setShowManual(false);
        setEmployeeId('');
        setManualMap({});
        setManualPlanningId(null);
        await loadListMeta();
      } else toast.error(res.data?.error || 'Erreur');
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
      const res = await fetch(
        `${api.defaults.baseURL}/apprentice-plannings/${planningId}/download`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
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

  const datesByDay = useMemo(() => {
    const map = {};
    globalRows.forEach((r) => {
      const entries =
        Array.isArray(r.trainingEntries) && r.trainingEntries.length
          ? r.trainingEntries
          : (r.trainingDates || []).map((date) => ({ date, kind: 'cfa' }));
      entries.forEach((e) => {
        if (!map[e.date]) map[e.date] = [];
        map[e.date].push({ ...r, kind: e.kind || 'cfa' });
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

  const kindLegend = (
    <div className="app-plan-kind-legend">
      {KIND_ORDER.map((k) => (
        <span key={k} className="app-plan-kind-item">
          <span className="app-plan-dot" style={{ background: KIND_META[k].color }} />
          {KIND_META[k].label}
        </span>
      ))}
    </div>
  );

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
                  openManualEditor({ employeeId });
                }}
              >
                Saisie manuelle
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
                  Les couleurs du PDF sont conservées : rose = CFA, vert = In Situ Learning, bleu =
                  période d&apos;examen. Réimportez le PDF pour corriger un ancien décalage de mois.
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
                    {uploading ? 'Analyse du PDF…' : 'Enregistrer le PDF'}
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowManual(false)}>
                Fermer
              </button>
            </div>
            <form onSubmit={handleSaveManual}>
              <label>
                <span>Apprenti</span>
                <select
                  value={employeeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setEmployeeId(id);
                    const p = planningByEmployee[id];
                    setManualPlanningId(p?._id || null);
                    setManualMap(entriesToMap(p?.trainingEntries, p?.trainingDates));
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
              {kindLegend}
              <p className="app-plan-help">
                Cliquez plusieurs fois sur un jour pour changer la couleur : rose (CFA) → vert (In
                Situ) → bleu (examen) → retirer. {Object.keys(manualMap).length} jour(s)
                sélectionné(s).
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
                  if (!day) return <div key={`me-${idx}`} className="app-plan-cal-cell empty" />;
                  const iso = toIsoLocal(day);
                  const kind = manualMap[iso];
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`app-plan-cal-cell pick ${kind ? 'selected' : ''}`}
                      style={kind ? { background: KIND_META[kind].color, borderColor: KIND_META[kind].color } : undefined}
                      onClick={() => cycleManualDay(iso)}
                      title={kind ? KIND_META[kind].label : 'Ajouter'}
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowGlobal(false)}>
                Fermer
              </button>
            </div>
            {loadingGlobal && globalRows.length === 0 ? (
              <p>Chargement…</p>
            ) : (
              <>
                {kindLegend}
                <div className="app-plan-legend">
                  {globalRows.map((r) => (
                    <div key={String(r.employeeId)} className="app-plan-legend-row">
                      <strong>{r.name}</strong>
                      <span className="app-plan-muted">{r.trainingDates?.length || 0} jour(s)</span>
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
                            trainingEntries: r.trainingEntries,
                            trainingDates: r.trainingDates
                          })
                        }
                      >
                        Modifier les jours
                      </button>
                    </div>
                  ))}
                  {globalRows.length === 0 && (
                    <p>Aucun planning intégré. Importez un PDF ou saisissez les jours manuellement.</p>
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
                    if (!day) return <div key={`e-${idx}`} className="app-plan-cal-cell empty" />;
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
                              key={`${iso}-${r.employeeId}-${r.kind}`}
                              className="app-plan-pill"
                              style={{ background: KIND_META[r.kind]?.color || '#666' }}
                              title={`${r.name} — ${KIND_META[r.kind]?.label || r.kind}`}
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
        <button type="button" className="btn btn-secondary" onClick={() => openManualEditor({})}>
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
