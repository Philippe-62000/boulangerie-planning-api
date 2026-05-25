import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './CamarisSemaineStandalone.css';

const API_LON = 'https://boulangerie-planning-api-3.onrender.com/api';
const TOKEN_KEY = 'camarisManagerToken_lon';
const DAY_LABELS = [
  { v: 1, l: 'Lun' },
  { v: 2, l: 'Mar' },
  { v: 3, l: 'Mer' },
  { v: 4, l: 'Jeu' },
  { v: 5, l: 'Ven' },
  { v: 6, l: 'Sam' },
  { v: 7, l: 'Dim' }
];

const getApi = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return API_LON;
};

const CamarisSemaineStandalone = () => {
  const apiBase = getApi();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerToken, setManagerToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [editForm, setEditForm] = useState({
    id: '',
    title: '',
    body: '',
    daysOfWeek: [],
    weekKey: ''
  });
  const [weekAnimations, setWeekAnimations] = useState([]);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadBoard = useCallback(async () => {
    try {
      const res = await axios.get(`${apiBase}/camaris/public/board`, {
        params: { siteKey: 'lon' }
      });
      setBoard(res.data?.data || null);
    } catch (e) {
      console.error(e);
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const loadManagerWeek = useCallback(
    async (token, weekKey) => {
      const res = await axios.get(`${apiBase}/camaris/manager/week`, {
        params: { weekKey: weekKey || board?.weekKey },
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeekAnimations(res.data?.data?.animations || []);
      if (res.data?.data?.weekKey) {
        setEditForm((f) => ({ ...f, weekKey: res.data.data.weekKey }));
      }
    },
    [apiBase, board?.weekKey]
  );

  useEffect(() => {
    loadBoard();
    const t = setInterval(loadBoard, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [loadBoard]);

  useEffect(() => {
    if (managerToken && managerOpen && board?.weekKey) {
      loadManagerWeek(managerToken, board.weekKey).catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setManagerToken(null);
      });
    }
  }, [managerToken, managerOpen, board?.weekKey, loadManagerWeek]);

  const managerLogin = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await axios.post(`${apiBase}/camaris/manager/login`, loginForm);
      const token = res.data?.token;
      localStorage.setItem(TOKEN_KEY, token);
      setManagerToken(token);
      setEditForm((f) => ({ ...f, weekKey: board?.weekKey || '' }));
      await loadManagerWeek(token, board?.weekKey);
      setMsg({ type: 'success', text: 'Connecté.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Connexion impossible' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setEditForm((f) => {
      const set = new Set(f.daysOfWeek);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...f, daysOfWeek: [...set].sort((a, b) => a - b) };
    });
  };

  const saveAnimation = async () => {
    if (!managerToken) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        id: editForm.id || undefined,
        weekKey: editForm.weekKey || board?.weekKey,
        title: editForm.title,
        body: editForm.body,
        daysOfWeek: editForm.daysOfWeek
      };
      const url = editForm.id
        ? `${apiBase}/camaris/manager/animations/${editForm.id}`
        : `${apiBase}/camaris/manager/animations`;
      const method = editForm.id ? 'put' : 'post';
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      setMsg({ type: 'success', text: 'Animation enregistrée.' });
      setEditForm({ id: '', title: '', body: '', daysOfWeek: [], weekKey: board?.weekKey || '' });
      await loadManagerWeek(managerToken, board?.weekKey);
      await loadBoard();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const editExisting = (anim) => {
    setEditForm({
      id: anim.id,
      title: anim.title || '',
      body: anim.body || '',
      daysOfWeek: anim.daysOfWeek || [],
      weekKey: anim.weekKey
    });
  };

  const deleteAnimation = async (id) => {
    if (!managerToken || !window.confirm('Supprimer cette animation ?')) return;
    try {
      await axios.delete(`${apiBase}/camaris/manager/animations/${id}`, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      await loadManagerWeek(managerToken, board?.weekKey);
      await loadBoard();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur suppression' });
    }
  };

  const logoutManager = () => {
    localStorage.removeItem(TOKEN_KEY);
    setManagerToken(null);
    setLoginForm({ login: '', password: '' });
  };

  const previewHtml = (text) => {
    const escape = (s) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return text
      .trim()
      .split(/\n{2,}/)
      .map((p) => {
        const inner = escape(p.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
        return `<p>${inner}</p>`;
      })
      .join('');
  };

  if (loading) {
    return (
      <div className="camaris-page">
        <p className="camaris-loading">Chargement…</p>
      </div>
    );
  }

  const today = board?.today;
  const info = board?.infoBanner;

  return (
    <div className="camaris-page">
      <header className="camaris-header">
        <div className="camaris-brand">
          <h1>{board?.pageTitle || 'Cette Semaine à Camaris'}</h1>
          <p>Boulangerie Camaris — Longuenesse</p>
        </div>
        <button type="button" className="camaris-btn-manager" onClick={() => setManagerOpen(true)}>
          Manager
        </button>
      </header>

      <section className="camaris-auto-strip" aria-label="Informations du jour">
        <div className="camaris-date-line">{board?.dateLabel}</div>
        <div className="camaris-ephemeride">{board?.ephemeride}</div>
        {info ? (
          <div className="camaris-info-banner">
            <strong>{info.title}</strong>
            <span>{info.text}</span>
          </div>
        ) : null}
      </section>

      <div className="camaris-main-grid">
        <section className="camaris-card" aria-labelledby="anim-jour">
          <h2 id="anim-jour">Animation du jour</h2>
          <span className={`camaris-badge ${today?.source === 'manager' ? 'manager' : 'auto'}`}>
            {today?.source === 'manager' ? 'Par votre équipe' : 'Suggestion du jour'}
          </span>
          <h3 className="camaris-animation-title">{today?.title}</h3>
          <div
            className="camaris-animation-body"
            dangerouslySetInnerHTML={{ __html: today?.bodyHtml || '' }}
          />
        </section>

        <section className="camaris-card" aria-labelledby="vue-semaine">
          <h2 id="vue-semaine">Vue semaine</h2>
          <div className="camaris-week-grid">
            {(board?.weekDays || []).map((d) => (
              <div
                key={d.dayOfWeek}
                className={`camaris-week-day${d.isToday ? ' today' : ''}${d.hasAnimation ? ' has-anim' : ''}`}
                title={d.preview || ''}
              >
                <span className="camaris-day-label">{d.label}</span>
                <span className="camaris-day-dot" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="camaris-week-preview">
            Les points verts indiquent un animation renseignée par le manager. Revenez demain pour une nouvelle
            surprise !
          </p>
        </section>
      </div>

      {managerOpen ? (
        <div className="camaris-overlay" role="dialog" aria-modal="true">
          <div className="camaris-panel">
            <h3>Espace manager</h3>
            {!managerToken ? (
              <form className="camaris-form" onSubmit={managerLogin}>
                <label htmlFor="mgr-login">Identifiant</label>
                <input
                  id="mgr-login"
                  value={loginForm.login}
                  onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                  autoComplete="username"
                />
                <label htmlFor="mgr-pass">Mot de passe</label>
                <input
                  id="mgr-pass"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  autoComplete="current-password"
                />
                <div className="camaris-panel-actions">
                  <button type="submit" className="camaris-btn-primary" disabled={saving}>
                    Connexion
                  </button>
                  <button type="button" className="camaris-btn-secondary" onClick={() => setManagerOpen(false)}>
                    Fermer
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Semaine <strong>{board?.weekKey}</strong> — cochez un ou plusieurs jours pour la même animation.
                </p>
                <form
                  className="camaris-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAnimation();
                  }}
                >
                  <label>Titre (court)</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Ex. Défi croissant du jeudi"
                  />
                  <label>Jours concernés</label>
                  <div className="camaris-days-row">
                    {DAY_LABELS.map((d) => (
                      <label key={d.v} className="camaris-day-chip">
                        <input
                          type="checkbox"
                          checked={editForm.daysOfWeek.includes(d.v)}
                          onChange={() => toggleDay(d.v)}
                        />
                        {d.l}
                      </label>
                    ))}
                  </div>
                  <label>Texte de l’animation</label>
                  <textarea
                    value={editForm.body}
                    onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                    placeholder="Paragraphes séparés par une ligne vide. **Gras** avec des astérisques."
                  />
                  {editForm.body ? (
                    <div className="camaris-preview-box">
                      <strong>Aperçu</strong>
                      <div
                        className="camaris-animation-body"
                        dangerouslySetInnerHTML={{ __html: previewHtml(editForm.body) }}
                      />
                    </div>
                  ) : null}
                  <div className="camaris-panel-actions">
                    <button type="submit" className="camaris-btn-primary" disabled={saving}>
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className="camaris-btn-secondary"
                      onClick={() =>
                        setEditForm({ id: '', title: '', body: '', daysOfWeek: [], weekKey: board?.weekKey || '' })
                      }
                    >
                      Nouveau
                    </button>
                    <button type="button" className="camaris-btn-secondary" onClick={logoutManager}>
                      Déconnexion
                    </button>
                    <button type="button" className="camaris-btn-secondary" onClick={() => setManagerOpen(false)}>
                      Fermer
                    </button>
                  </div>
                </form>
                {weekAnimations.length > 0 ? (
                  <ul className="camaris-anim-list">
                    {weekAnimations.map((a) => (
                      <li key={a.id}>
                        <strong>
                          {(a.daysOfWeek || []).map((d) => DAY_LABELS.find((x) => x.v === d)?.l || d).join(', ')}
                        </strong>
                        : {a.title}
                        <br />
                        <button type="button" className="camaris-btn-secondary" onClick={() => editExisting(a)}>
                          Modifier
                        </button>{' '}
                        <button type="button" className="camaris-btn-danger" onClick={() => deleteAnimation(a.id)}>
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
            {msg ? <div className={`camaris-msg ${msg.type}`}>{msg.text}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CamarisSemaineStandalone;
