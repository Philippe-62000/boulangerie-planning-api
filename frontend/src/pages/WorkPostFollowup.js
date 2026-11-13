import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './WorkPostFollowup.css';

function todayIsoParis() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function shiftIso(isoDate, days) {
  const [year, month, day] = String(isoDate || todayIsoParis()).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function formatLongDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(new Date(value));
}

function blocksOf(tasks) {
  const blocks = [];
  tasks.forEach((task) => {
    const key = task.group || '';
    const last = blocks[blocks.length - 1];
    if (!last || last.key !== key) {
      blocks.push({ key, label: task.groupLabel || '', tasks: [task] });
    } else {
      last.tasks.push(task);
    }
  });
  return blocks;
}

function localSummary(postes, tasks) {
  const selected = (tasks || []).filter((task) => postes.includes(task.phase));
  const pending = selected.filter((task) => task.status !== 'done' && task.status !== 'not_done' && task.status !== 'skipped');
  const notDone = selected.filter((task) => task.status === 'not_done');
  const skipped = selected.filter((task) => task.status === 'skipped');
  const missingReason = [...notDone, ...skipped].filter((task) => !String(task.reason || '').trim());
  return {
    required: selected.length,
    done: selected.filter((task) => task.status === 'done').length,
    pending,
    notDone,
    skipped,
    missingReason
  };
}

function apiErrorMessage(error, fallback) {
  if (error?.response?.status === 404) {
    return 'Le suivi n’est pas encore en ligne sur le serveur. Il faut déployer la mise à jour de l’API.';
  }
  return error?.response?.data?.error || fallback;
}

const WorkPostFollowup = () => {
  const { isAdmin } = useAuth();
  if (isAdmin()) return <WorkPostAdmin />;
  return <WorkPostEmployee />;
};

const WorkPostEmployee = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [eligible, setEligible] = useState(true);
  const [ineligibleReason, setIneligibleReason] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [dateIso, setDateIso] = useState(todayIsoParis());
  const [phases, setPhases] = useState([]);
  const [postes, setPostes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [locked, setLocked] = useState(false);
  const [validatedAt, setValidatedAt] = useState(null);
  const [activePhase, setActivePhase] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [problemIds, setProblemIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acting, setActing] = useState(false);

  const postesRef = useRef([]);
  const tasksRef = useRef([]);
  const lockedRef = useRef(false);
  const readyRef = useRef(false);
  const jobRef = useRef(0);
  const chainRef = useRef(Promise.resolve());
  const timerRef = useRef(null);

  const applySheet = useCallback((data) => {
    const nextPostes = Array.isArray(data.postes) ? data.postes : [];
    const nextTasks = Array.isArray(data.tasks) ? data.tasks : [];
    const nextLocked = Boolean(data.locked);
    postesRef.current = nextPostes;
    tasksRef.current = nextTasks;
    lockedRef.current = nextLocked;
    setEmployeeName(data.employeeName || '');
    setDateIso(data.date || todayIsoParis());
    setPhases(Array.isArray(data.phases) ? data.phases : []);
    setPostes(nextPostes);
    setTasks(nextTasks);
    setLocked(nextLocked);
    setValidatedAt(data.validatedAt || null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.get('/work-posts/today');
      const data = response.data || {};
      if (!data.eligible) {
        setEligible(false);
        setIneligibleReason(data.reason || 'role');
        return;
      }
      setEligible(true);
      applySheet(data);
      readyRef.current = true;
    } catch (error) {
      setLoadError(apiErrorMessage(error, 'Impossible de charger votre suivi.'));
    } finally {
      setLoading(false);
    }
  }, [applySheet]);

  useEffect(() => {
    load();
    return () => clearTimeout(timerRef.current);
  }, [load]);

  const persist = useCallback(() => {
    const mine = ++jobRef.current;
    chainRef.current = chainRef.current.catch(() => {}).then(async () => {
      if (mine !== jobRef.current || !readyRef.current || lockedRef.current) return;
      setSaving(true);
      setSaveError('');
      try {
        await api.put('/work-posts/today', {
          postes: postesRef.current,
          answers: tasksRef.current.map((task) => ({
            taskId: task.id,
            status: task.status,
            reason: task.reason
          }))
        });
        if (mine !== jobRef.current) return;
        setSaved(true);
      } catch (error) {
        if (mine !== jobRef.current) return;
        setSaved(false);
        if (error.response?.status === 409 && error.response.data?.tasks) {
          applySheet(error.response.data);
        }
        setSaveError(apiErrorMessage(error, 'Enregistrement impossible.'));
      } finally {
        if (mine === jobRef.current) setSaving(false);
      }
    });
  }, [applySheet]);

  const scheduleSave = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persist, 450);
  }, [persist]);

  const summary = useMemo(() => localSummary(postes, tasks), [postes, tasks]);
  const visiblePhases = phases.filter((phase) => postes.includes(phase.id));
  const currentPhase = visiblePhases.some((phase) => phase.id === activePhase)
    ? activePhase
    : (visiblePhases[0]?.id || '');
  const currentTasks = tasks.filter((task) => task.phase === currentPhase);
  const phaseCounts = (phaseId) => {
    const mine = tasks.filter((task) => task.phase === phaseId && postes.includes(phaseId));
    return {
      notDone: mine.filter((task) => task.status === 'not_done').length,
      pending: mine.filter((task) => task.status === 'pending').length
    };
  };

  const togglePoste = (phaseId) => {
    if (lockedRef.current) return;
    setPostes((prev) => {
      const next = prev.includes(phaseId) ? prev.filter((id) => id !== phaseId) : [...prev, phaseId];
      postesRef.current = next;
      return next;
    });
    setActivePhase(phaseId);
    clearTimeout(timerRef.current);
    persist();
  };

  const setStatus = (task, status) => {
    if (lockedRef.current) return;
    setTasks((prev) => {
      const next = prev.map((item) => (
        item.id === task.id
          ? { ...item, status, reason: status === 'done' ? '' : item.reason }
          : item
      ));
      tasksRef.current = next;
      return next;
    });
    setProblemIds((prev) => prev.filter((id) => id !== task.id));
    clearTimeout(timerRef.current);
    persist();
  };

  const setReason = (task, reason) => {
    if (lockedRef.current) return;
    setTasks((prev) => {
      const next = prev.map((item) => (item.id === task.id ? { ...item, reason } : item));
      tasksRef.current = next;
      return next;
    });
    setProblemIds((prev) => prev.filter((id) => id !== task.id));
    setSaved(false);
    scheduleSave();
  };

  const focusProblem = (ids) => {
    const first = tasks.find((task) => ids.includes(task.id));
    if (first) setActivePhase(first.phase);
    setProblemIds(ids);
  };

  useEffect(() => {
    if (!problemIds.length) return;
    document.getElementById(`task-${problemIds[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [problemIds, currentPhase]);

  const askValidate = () => {
    const current = localSummary(postesRef.current, tasksRef.current);
    if (!postesRef.current.length) {
      setSaveError('Choisissez au moins un poste.');
      return;
    }
    const ids = [
      ...current.pending.map((task) => task.id),
      ...current.missingReason.map((task) => task.id)
    ];
    if (ids.length) {
      setSaveError(current.pending.length
        ? 'Il reste des tâches à cocher avant de valider la journée.'
        : 'Indiquez la raison de chaque tâche non faite.');
      focusProblem(ids);
      return;
    }
    setSaveError('');
    setConfirmOpen(true);
  };

  const confirmValidate = async () => {
    setActing(true);
    clearTimeout(timerRef.current);
    try {
      const response = await new Promise((resolve, reject) => {
        chainRef.current = chainRef.current.catch(() => {}).then(async () => {
          try {
            const result = await api.post('/work-posts/today/validate', {
              postes: postesRef.current,
              answers: tasksRef.current.map((task) => ({
                taskId: task.id,
                status: task.status,
                reason: task.reason
              }))
            });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
      applySheet(response.data);
      setConfirmOpen(false);
      setProblemIds([]);
      setSaveError('');
      setSaved(true);
    } catch (error) {
      const data = error.response?.data;
      if (data?.tasks) applySheet(data);
      const ids = [
        ...(data?.summary?.pendingIds || []),
        ...(data?.summary?.missingReasonIds || [])
      ];
      setConfirmOpen(false);
      setSaveError(apiErrorMessage(error, 'Validation impossible.'));
      if (ids.length) focusProblem(ids);
    } finally {
      setActing(false);
    }
  };

  const reopen = async () => {
    setActing(true);
    try {
      const response = await api.post('/work-posts/today/reopen');
      applySheet(response.data);
      setSaved(false);
      setSaveError('');
    } catch (error) {
      setSaveError(apiErrorMessage(error, 'Impossible de reprendre la checklist.'));
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <div className="wpf-page"><p className="wpf-muted">Chargement du suivi…</p></div>;
  }

  if (loadError) {
    return (
      <div className="wpf-page">
        <header className="wpf-header">
          <h2>Suivi poste de travail</h2>
        </header>
        <p className="wpf-banner is-error">{loadError}</p>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="wpf-page">
        <header className="wpf-header">
          <h2>Suivi poste de travail</h2>
        </header>
        <section className="wpf-card">
          <p>
            {ineligibleReason === 'account'
              ? 'Pour remplir votre checklist, connectez-vous avec votre code vendeuse à 3 chiffres.'
              : 'Cette checklist concerne pour l’instant les vendeuses. Les autres postes seront ajoutés plus tard.'}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="wpf-page">
      <header className="wpf-header">
        <div>
          <h2>Suivi poste de travail</h2>
          <p>
            {employeeName ? `${employeeName} · ` : ''}
            {formatLongDate(dateIso)}
          </p>
        </div>
        <p className={`wpf-save ${saveError ? 'is-error' : ''}`}>
          {saveError || (saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Cochez au fur et à mesure')}
        </p>
      </header>

      <section className="wpf-card">
        <h3>Poste du jour</h3>
        <p className="wpf-muted">Cochez le ou les postes que vous tenez aujourd’hui. Seules ces tâches seront demandées en fin de poste.</p>
        <div className="wpf-postes">
          {phases.map((phase) => {
            const on = postes.includes(phase.id);
            return (
              <button
                key={phase.id}
                type="button"
                className={`wpf-poste ${on ? 'is-on' : ''}`}
                aria-pressed={on}
                disabled={locked}
                onClick={() => togglePoste(phase.id)}
              >
                <strong>{phase.label}</strong>
                <span>{phase.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      {locked && (
        <p className="wpf-banner is-ok">
          Journée validée{validatedAt ? ` à ${formatTime(validatedAt)}` : ''}.
          {' '}Vous pouvez encore consulter ce qui a été fait et ce qui ne l’a pas été.
        </p>
      )}

      {!visiblePhases.length && (
        <section className="wpf-card">
          <p>Choisissez un poste pour afficher sa checklist.</p>
        </section>
      )}

      {visiblePhases.length > 0 && (
        <>
          <div className="wpf-tabs" role="tablist">
            {visiblePhases.map((phase) => {
              const counts = phaseCounts(phase.id);
              return (
                <button
                  key={phase.id}
                  type="button"
                  role="tab"
                  aria-selected={phase.id === currentPhase}
                  className={`wpf-tab ${phase.id === currentPhase ? 'is-on' : ''}`}
                  onClick={() => setActivePhase(phase.id)}
                >
                  {phase.label}
                  {counts.notDone > 0 && <em className="is-bad">{counts.notDone}</em>}
                  {counts.pending > 0 && <em className="is-wait">{counts.pending}</em>}
                </button>
              );
            })}
          </div>

          <div className="wpf-tasks">
            {blocksOf(currentTasks).map((block) => (
              <div key={block.key || 'main'}>
                {block.label && (
                  <h3 className="wpf-group">{block.label}</h3>
                )}
                {block.tasks.map((task) => (
                  <article
                    key={task.id}
                    id={`task-${task.id}`}
                    className={`wpf-task is-${task.status} ${problemIds.includes(task.id) ? 'is-problem' : ''}`}
                  >
                    <div>
                      <h3>{task.label}</h3>
                      {task.detail && <p>{task.detail}</p>}
                    </div>
                    <div className="wpf-actions">
                      <button
                        type="button"
                        className={task.status === 'done' ? 'is-done' : ''}
                        disabled={locked}
                        onClick={() => setStatus(task, 'done')}
                      >
                        Fait
                      </button>
                      <button
                        type="button"
                        className={task.status === 'not_done' ? 'is-missed' : ''}
                        disabled={locked}
                        onClick={() => setStatus(task, 'not_done')}
                      >
                        Non fait
                      </button>
                      {task.weekly && (
                        <button
                          type="button"
                          className={task.status === 'skipped' ? 'is-skip' : ''}
                          disabled={locked}
                          onClick={() => setStatus(task, 'skipped')}
                        >
                          Pas aujourd’hui
                        </button>
                      )}
                    </div>
                    {(task.status === 'not_done' || task.status === 'skipped') && (
                      <label className="wpf-reason">
                        {task.status === 'skipped' ? 'Précisez quand cela a été fait' : 'Pourquoi ce n’est pas fait ?'}
                        <textarea
                          value={task.reason}
                          maxLength={500}
                          disabled={locked}
                          placeholder={task.status === 'skipped' ? 'Ex. fait mardi' : 'Indiquez la raison'}
                          onChange={(event) => setReason(task, event.target.value)}
                        />
                      </label>
                    )}
                  </article>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      <section className="wpf-end">
        <h3>Fin de poste</h3>
        {!postes.length && <p>Sélectionnez votre poste pour faire le point.</p>}
        {postes.length > 0 && (
          <>
            <p>
              {summary.done} faite{summary.done === 1 ? '' : 's'}
              {' · '}
              {summary.notDone.length} non faite{summary.notDone.length === 1 ? '' : 's'}
              {' · '}
              {summary.pending.length} à traiter
              {summary.skipped.length > 0 ? ` · ${summary.skipped.length} pas aujourd’hui` : ''}
            </p>
            {summary.notDone.length > 0 && (
              <ul className="wpf-recap">
                {summary.notDone.map((task) => (
                  <li key={task.id}>
                    <button type="button" onClick={() => focusProblem([task.id])}>{task.label}</button>
                    <span>{task.reason?.trim() ? task.reason : 'Raison à préciser'}</span>
                  </li>
                ))}
              </ul>
            )}
            {summary.pending.length > 0 && (
              <p className="wpf-muted">
                Encore {summary.pending.length} tâche{summary.pending.length > 1 ? 's' : ''} sans réponse
                {' '}({summary.pending.slice(0, 3).map((task) => task.label).join(' · ')}
                {summary.pending.length > 3 ? '…' : ''}).
              </p>
            )}
          </>
        )}
        {!locked && (
          <button type="button" className="wpf-primary" onClick={askValidate} disabled={acting || !postes.length}>
            Valider ma journée
          </button>
        )}
        {locked && (
          <button type="button" className="wpf-secondary" onClick={reopen} disabled={acting}>
            Reprendre la checklist
          </button>
        )}
      </section>

      {confirmOpen && (
        <div className="wpf-modal-backdrop" onClick={() => !acting && setConfirmOpen(false)}>
          <div className="wpf-modal" role="dialog" aria-modal="true" aria-labelledby="wpf-confirm-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="wpf-confirm-title">Valider la journée ?</h3>
            {summary.notDone.length === 0 ? (
              <p>Toutes les tâches de vos postes sont faites.</p>
            ) : (
              <>
                <p>Ces tâches restent non faites. Elles seront visibles dans le suivi Filmara.</p>
                <ul>
                  {summary.notDone.map((task) => (
                    <li key={task.id}><strong>{task.label}</strong> — {task.reason}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="wpf-modal-actions">
              <button type="button" className="wpf-secondary" disabled={acting} onClick={() => setConfirmOpen(false)}>Annuler</button>
              <button type="button" className="wpf-primary" disabled={acting} onClick={confirmValidate}>
                {acting ? 'Validation…' : 'Valider ma journée'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const STATUS_LABEL = {
  done: 'Fait',
  not_done: 'Non fait',
  skipped: 'Pas aujourd’hui',
  pending: 'Non renseigné'
};

const WorkPostAdmin = () => {
  const [dateIso, setDateIso] = useState(todayIsoParis());
  const [phases, setPhases] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState({});

  const load = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/work-posts/admin', { params: { date } });
      const data = response.data || {};
      const nextSheets = Array.isArray(data.sheets) ? data.sheets : [];
      setDateIso(data.date || date);
      setPhases(Array.isArray(data.phases) ? data.phases : []);
      setSheets(nextSheets);
      setOpenIds(Object.fromEntries(nextSheets.map((sheet) => [sheet.id, (sheet.summary?.notDone || 0) > 0])));
    } catch (err) {
      setError(apiErrorMessage(err, 'Impossible de charger le suivi.'));
      setSheets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(dateIso);
  }, [load, dateIso]);

  const phaseName = (id) => phases.find((phase) => phase.id === id)?.label || id;
  const totals = sheets.reduce((acc, sheet) => {
    acc.done += sheet.summary?.done || 0;
    acc.notDone += sheet.summary?.notDone || 0;
    acc.pending += sheet.summary?.pending || 0;
    acc.skipped += sheet.summary?.skipped || 0;
    if (sheet.locked) acc.validated += 1;
    return acc;
  }, { done: 0, notDone: 0, pending: 0, skipped: 0, validated: 0 });

  const visible = sheets.filter((sheet) => {
    if (filter === 'issues' && !(sheet.summary?.notDone > 0)) return false;
    if (filter === 'open' && sheet.locked) return false;
    if (query.trim() && !String(sheet.employeeName || '').toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="wpf-page is-admin">
      <header className="wpf-header">
        <div>
          <h2>Suivi poste de travail</h2>
          <p>Tâches des vendeuses : faites, non faites, et journées validées.</p>
        </div>
      </header>

      <section className="wpf-card wpf-toolbar">
        <div className="wpf-datebar">
          <button type="button" className="wpf-secondary" onClick={() => setDateIso((value) => shiftIso(value, -1))}>Jour précédent</button>
          <label>
            Date
            <input type="date" value={dateIso} onChange={(event) => setDateIso(event.target.value)} />
          </label>
          <button type="button" className="wpf-secondary" onClick={() => setDateIso((value) => shiftIso(value, 1))}>Jour suivant</button>
        </div>
        <p className="wpf-daytitle">{formatLongDate(dateIso)}</p>
        <div className="wpf-stats">
          <span>{sheets.length} saisie{sheets.length > 1 ? 's' : ''}</span>
          <span className="is-ok">{totals.done} faites</span>
          <span className="is-bad">{totals.notDone} non faite{totals.notDone === 1 ? '' : 's'}</span>
          <span>{totals.pending} non renseignées</span>
          <span>{totals.skipped} pas aujourd’hui</span>
          <span>{totals.validated} journée{totals.validated > 1 ? 's' : ''} validée{totals.validated > 1 ? 's' : ''}</span>
        </div>
        <div className="wpf-filters">
          {[
            ['all', 'Tout'],
            ['issues', 'Avec non fait'],
            ['open', 'Journée non validée']
          ].map(([id, label]) => (
            <button key={id} type="button" className={filter === id ? 'is-on' : ''} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
          <input
            type="search"
            value={query}
            placeholder="Nom de la vendeuse"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      {loading && <p className="wpf-muted">Chargement…</p>}
      {error && <p className="wpf-banner is-error">{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <section className="wpf-card">
          <p>{sheets.length === 0 ? 'Aucune vendeuse n’a encore saisi son suivi pour cette date.' : 'Aucune fiche ne correspond à ce filtre.'}</p>
        </section>
      )}

      <div className="wpf-sheets">
        {visible.map((sheet) => {
          const open = !!openIds[sheet.id];
          const doneTasks = (sheet.tasks || []).filter((task) => task.status === 'done');
          const otherTasks = (sheet.tasks || []).filter((task) => task.status !== 'done');
          return (
            <article key={sheet.id} className="wpf-sheet">
              <button
                type="button"
                className="wpf-sheet-head"
                onClick={() => setOpenIds((prev) => ({ ...prev, [sheet.id]: !prev[sheet.id] }))}
              >
                <strong>{sheet.employeeName}</strong>
                <span>{(sheet.postes || []).map(phaseName).join(' · ') || 'Aucun poste'}</span>
                <span className="is-ok">{sheet.summary?.done || 0} faites</span>
                <span className={(sheet.summary?.notDone || 0) > 0 ? 'is-bad' : ''}>{sheet.summary?.notDone || 0} non faite{(sheet.summary?.notDone || 0) === 1 ? '' : 's'}</span>
                <span>{sheet.locked ? `Validée${sheet.validatedAt ? ` à ${formatTime(sheet.validatedAt)}` : ''}` : 'En cours'}</span>
              </button>
              {open && (
                <div className="wpf-sheet-body">
                  {otherTasks.length === 0 && doneTasks.length === 0 && (
                    <p className="wpf-muted">Aucune tâche sur les postes choisis.</p>
                  )}
                  {blocksOf(otherTasks).map((block) => (
                    <div key={block.key || 'main'}>
                      {block.label && <h3 className="wpf-group">{block.label}</h3>}
                      {block.tasks.map((task) => (
                        <div key={task.id} className={`wpf-admin-task is-${task.status}`}>
                          <div>
                            <strong>{task.label}</strong>
                            <em>{phaseName(task.phase)} · {STATUS_LABEL[task.status] || task.status}</em>
                          </div>
                          {task.reason && <p>{task.reason}</p>}
                        </div>
                      ))}
                    </div>
                  ))}
                  {doneTasks.length > 0 && (
                    <details className="wpf-done">
                      <summary>Tâches faites ({doneTasks.length})</summary>
                      <ul>
                        {doneTasks.map((task) => (
                          <li key={task.id}>{task.label}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default WorkPostFollowup;
