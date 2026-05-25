import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { fetchCamarisWeather, WEATHER_ICONS } from '../utils/camarisWeather.jsx';
import { CAMARIS_ZODIAC_SIGNS } from '../constants/camarisHoroscope';
import './CamarisSemaineStandalone.css';

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

/** Liste d’animations d’un jour (API v3 ou ancien format). */
const getDayAnimations = (day) => {
  if (Array.isArray(day?.animations) && day.animations.length) return day.animations;
  if (day?.hasAnimation && (day.animationTitle || day.animationBodyHtml)) {
    return [
      {
        id: 'legacy',
        title: day.animationTitle || 'Animation',
        bodyHtml: day.animationBodyHtml || ''
      }
    ];
  }
  return [];
};

/** API sur le même domaine Vercel (serverless + MongoDB), comme commande-longuenesse — pas Render. */
const getApi = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    if (/vercel\.app$/i.test(host) || host.includes('camaris')) {
      return `${window.location.origin}/api`;
    }
  }
  const override = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (override) return override;
  if (typeof window !== 'undefined') return `${window.location.origin}/api`;
  return '/api';
};

const CamarisSemaineStandalone = () => {
  const apiBase = getApi();
  const [board, setBoard] = useState(null);
  const [weather, setWeather] = useState(null);
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
  const [selectedWeekDay, setSelectedWeekDay] = useState(null);
  const [horoscopeOpen, setHoroscopeOpen] = useState(false);
  const [horoscopeSign, setHoroscopeSign] = useState(null);
  const [horoscopeData, setHoroscopeData] = useState(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);

  const loadBoard = useCallback(async () => {
    try {
      const res = await axios.get(`${apiBase}/camaris/public/board`, {
        params: { siteKey: 'lon', _v: Date.now() }
      });
      setBoard(res.data?.data || null);
      setSelectedWeekDay(null);
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
    let cancelled = false;
    (async () => {
      try {
        if (!sessionStorage.getItem('camaris_visit_sent')) {
          const v = await axios.post(`${apiBase}/camaris/public/visit`);
          sessionStorage.setItem('camaris_visit_sent', '1');
          if (!cancelled && v.data?.data?.totalVisits != null) {
            setBoard((b) => (b ? { ...b, visitCount: v.data.data.totalVisits } : null));
          }
        }
      } catch {
        /* compteur optionnel */
      }
      if (!cancelled) await loadBoard();
    })();
    const t = setInterval(loadBoard, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [apiBase, loadBoard]);

  useEffect(() => {
    fetchCamarisWeather()
      .then(setWeather)
      .catch(() => setWeather(null));
  }, []);

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
  const weatherKind = weather?.kind && WEATHER_ICONS[weather.kind] ? weather.kind : 'cloud';
  const WeatherIcon = WEATHER_ICONS[weatherKind] || WEATHER_ICONS.cloud;
  const apiStale = board && (board.apiVersion == null || board.apiVersion < 4);

  const loadHoroscope = async (signId) => {
    setHoroscopeSign(signId);
    setHoroscopeLoading(true);
    setHoroscopeData(null);
    try {
      const res = await axios.get(`${apiBase}/camaris/public/horoscope`, {
        params: { sign: signId, _v: Date.now() }
      });
      setHoroscopeData(res.data?.data || null);
    } catch {
      setHoroscopeData({
        sign: signId,
        horoscope: 'Horoscope momentanément indisponible. Réessayez dans un instant.'
      });
    } finally {
      setHoroscopeLoading(false);
    }
  };

  const horoscopeLabel = CAMARIS_ZODIAC_SIGNS.find((s) => s.id === horoscopeSign)?.label;

  return (
    <div className="camaris-page">
      {apiStale ? (
        <div className="camaris-stale-banner" role="alert">
          Nouvelle version disponible — touchez <strong>Actualiser</strong> en bas de page (ou rechargez l’onglet sur
          ordinateur : Ctrl+F5).
        </div>
      ) : null}
      <header className="camaris-header">
        <div className="camaris-brand">
          <h1>{board?.pageTitle || 'Cette Semaine à Camaris'}</h1>
          <p className="camaris-date-line">{board?.dateLabel}</p>
          {weather ? (
            <div className="camaris-weather-block">
              <div className="camaris-weather-icon">{WeatherIcon}</div>
              <p className="camaris-weather-phrase">{weather.phrase}</p>
              {weather.temperature != null ? (
                <span className="camaris-weather-temp">{Math.round(weather.temperature)} °C</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <section className="camaris-auto-strip" aria-label="Informations du jour">
        {board?.ephemeride ? (
          <div className="camaris-ephemeride-block">
            <span className="camaris-ephemeride-label">Éphéméride</span>
            <p className="camaris-ephemeride">{board.ephemeride}</p>
          </div>
        ) : null}
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
          <h3 className="camaris-animation-title">{today?.title}</h3>
          <div
            className="camaris-animation-body"
            dangerouslySetInnerHTML={{ __html: today?.bodyHtml || '' }}
          />
        </section>

        <section className="camaris-card" aria-labelledby="vue-semaine">
          <h2 id="vue-semaine">Vue semaine</h2>
          <p className="camaris-week-hint">
            Point vert = au moins une animation. Touchez un jour pour voir le détail de toutes les animations ce
            jour-là.
          </p>
          <div className="camaris-week-grid" role="list">
            {(board?.weekDays || []).map((d) => {
              const selected = selectedWeekDay === d.dayOfWeek;
              const dayAnims = getDayAnimations(d);
              const count = dayAnims.length;
              return (
                <button
                  key={d.dayOfWeek}
                  type="button"
                  role="listitem"
                  className={`camaris-week-day${d.isToday ? ' today' : ''}${count > 0 ? ' has-anim' : ''}${selected ? ' selected' : ''}`}
                  onClick={() => setSelectedWeekDay(selected ? null : d.dayOfWeek)}
                  aria-pressed={selected}
                  aria-label={`${d.label}${count > 0 ? `, ${count} animation(s)` : ', pas d animation'}`}
                >
                  <span className="camaris-day-label">{d.label}</span>
                  <span className="camaris-day-dot" aria-hidden="true" />
                  {count > 1 ? <span className="camaris-day-count">{count}</span> : null}
                </button>
              );
            })}
          </div>
          {selectedWeekDay != null ? (
            (() => {
              const detail = (board?.weekDays || []).find((d) => d.dayOfWeek === selectedWeekDay);
              if (!detail) return null;
              const anims = getDayAnimations(detail);
              return (
                <div className="camaris-week-detail" role="region" aria-live="polite">
                  <button
                    type="button"
                    className="camaris-week-detail-close"
                    onClick={() => setSelectedWeekDay(null)}
                    aria-label="Fermer le détail"
                  >
                    ×
                  </button>
                  <h3>
                    {detail.label}
                    {detail.dateISO ? ` — ${detail.dateISO}` : ''}
                    {anims.length > 1 ? ` (${anims.length} animations)` : ''}
                  </h3>
                  {anims.length > 0 ? (
                    <div className="camaris-week-detail-list">
                      {anims.map((anim, idx) => (
                        <article key={anim.id || idx} className="camaris-week-detail-item">
                          {anims.length > 1 ? (
                            <p className="camaris-week-detail-item-num">Animation {idx + 1}</p>
                          ) : null}
                          <h4 className="camaris-animation-title">{anim.title}</h4>
                          <div
                            className="camaris-animation-body"
                            dangerouslySetInnerHTML={{ __html: anim.bodyHtml || '' }}
                          />
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="camaris-week-detail-empty">Aucune animation renseignée pour ce jour.</p>
                  )}
                </div>
              );
            })()
          ) : null}
        </section>
      </div>

      <footer className="camaris-footer">
        {typeof board?.visitCount === 'number' ? (
          <p className="camaris-visit-count">
            {board.visitCount.toLocaleString('fr-FR')} visite{board.visitCount > 1 ? 's' : ''} de cette page
          </p>
        ) : null}
        <div className="camaris-footer-actions">
          <button type="button" className="camaris-btn-horoscope" onClick={() => setHoroscopeOpen(true)}>
            Horoscope
          </button>
          <button
            type="button"
            className="camaris-btn-refresh"
            onClick={() => {
              sessionStorage.clear();
              localStorage.removeItem('camaris_visit_sent');
              const u = new URL(window.location.href);
              u.searchParams.set('maj', String(Date.now()));
              window.location.replace(u.toString());
            }}
          >
            Actualiser
          </button>
          <button type="button" className="camaris-btn-manager" onClick={() => setManagerOpen(true)}>
            Espace manager
          </button>
        </div>
      </footer>

      {horoscopeOpen ? (
        <div className="camaris-overlay" role="dialog" aria-modal="true" aria-labelledby="horoscope-title">
          <div className="camaris-panel camaris-panel-wide">
            <h3 id="horoscope-title">Horoscope du jour</h3>
            <p className="camaris-horoscope-intro">Choisissez votre signe pour lire l’horoscope du jour.</p>
            <div className="camaris-zodiac-grid">
              {CAMARIS_ZODIAC_SIGNS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`camaris-zodiac-btn${horoscopeSign === s.id ? ' active' : ''}`}
                  onClick={() => loadHoroscope(s.id)}
                >
                  <span className="camaris-zodiac-emoji" aria-hidden="true">
                    {s.emoji}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>
            {horoscopeLoading ? <p className="camaris-horoscope-text">Chargement…</p> : null}
            {!horoscopeLoading && horoscopeData?.horoscope ? (
              <div className="camaris-horoscope-result">
                {horoscopeLabel ? <h4>{horoscopeLabel}</h4> : null}
                <p>{horoscopeData.horoscope}</p>
              </div>
            ) : null}
            <div className="camaris-panel-actions">
              <button type="button" className="camaris-btn-secondary" onClick={() => setHoroscopeOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
