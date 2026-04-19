import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  getApiUrl,
  getStoredToken,
  getTokenStorageSuffix,
  setStoredEmployeeToken,
  clearStoredTokens
} from '../config/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import './CompteClientStandalone.css';

const LEGACY_PRESETS_KEY = () => `compteClientPresets${getTokenStorageSuffix()}`;

function loadLegacyPresets() {
  try {
    const raw = localStorage.getItem(LEGACY_PRESETS_KEY());
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((p) => p && typeof p.firstName === 'string' && typeof p.lastName === 'string')
      .map((p) => ({ firstName: p.firstName.trim(), lastName: p.lastName.trim() }))
      .filter((p) => p.firstName && p.lastName);
  } catch {
    return [];
  }
}

function parseJwtIdentity(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return {
      name: typeof payload.name === 'string' ? payload.name : '',
      saleCode: typeof payload.saleCode === 'string' ? payload.saleCode : '',
      role: payload.role,
      exp: typeof payload.exp === 'number' ? payload.exp * 1000 : null
    };
  } catch {
    return null;
  }
}

function useSignaturePad() {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const getCtx = () => {
    const c = canvasRef.current;
    if (!c) return null;
    return c.getContext('2d');
  };

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w < 10 || h < 10) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasInk(false);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => initCanvas(), 80);
    const onResize = () => initCanvas();
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [initCanvas]);

  const pos = (e) => {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const start = (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* */
    }
    drawing.current = true;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };

  const end = (e) => {
    if (e) {
      e.preventDefault();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* */
      }
    }
    drawing.current = false;
  };

  const clear = () => {
    initCanvas();
  };

  const toDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  return { canvasRef, hasInk, start, move, end, clear, toDataUrl, initCanvas };
}

const DEFAULT_PERMS = [
  'view_planning',
  'view_absences',
  'view_sales_stats',
  'view_meal_expenses',
  'view_km_expenses'
];

const CompteClientStandalone = () => {
  const site = typeof window !== 'undefined' && window.location.pathname.startsWith('/lon') ? 'longuenesse' : 'arras';
  const apiBase = getApiUrl();
  const { login, logout } = useAuth();

  const [sessionRefresh, setSessionRefresh] = useState(0);
  const token = useMemo(() => getStoredToken(), [sessionRefresh]);
  const identity = useMemo(() => (token ? parseJwtIdentity(token) : null), [token]);

  const [saleCodeInput, setSaleCodeInput] = useState('');
  const [identBusy, setIdentBusy] = useState(false);

  const [presets, setPresets] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [amount, setAmount] = useState('25');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [sessionHint, setSessionHint] = useState('');

  const [remiseLoading, setRemiseLoading] = useState(false);
  const [remiseSummary, setRemiseSummary] = useState(null);
  const [remiseError, setRemiseError] = useState('');
  const [declaredTicketCount, setDeclaredTicketCount] = useState('');
  const [finishingRemise, setFinishingRemise] = useState(false);
  const [resumingRemise, setResumingRemise] = useState(false);

  const pad = useSignaturePad();

  const loginPath = site === 'longuenesse' ? '/lon/login' : '/plan/login';
  const returnUrlParam = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
  );
  const loginWithReturn = `${loginPath}?returnUrl=${returnUrlParam}`;

  const authHeaders = (t) => (t ? { Authorization: `Bearer ${t}` } : {});

  const sessionValid =
    token &&
    identity &&
    identity.exp != null &&
    identity.exp > Date.now() &&
    (identity.role === 'employee' || identity.role === 'admin');

  const fetchPresets = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setPresets([]);
      return;
    }
    try {
      const { data } = await axios.get(`${apiBase}/account-client-presets`, {
        params: { site },
        headers: authHeaders(t),
        timeout: 60000
      });
      let list = Array.isArray(data?.data) ? data.data : [];

      if (list.length === 0) {
        const legacy = loadLegacyPresets();
        if (legacy.length > 0) {
          for (const p of legacy) {
            try {
              await axios.post(
                `${apiBase}/account-client-presets`,
                { site, firstName: p.firstName, lastName: p.lastName },
                { headers: authHeaders(t), timeout: 30000 }
              );
            } catch {
              /* */
            }
          }
          try {
            localStorage.removeItem(LEGACY_PRESETS_KEY());
          } catch {
            /* */
          }
          const { data: again } = await axios.get(`${apiBase}/account-client-presets`, {
            params: { site },
            headers: authHeaders(t)
          });
          list = Array.isArray(again?.data) ? again.data : [];
        }
      }
      setPresets(list);
    } catch {
      setPresets([]);
    }
  }, [apiBase, site]);

  const loadRemiseSummary = useCallback(async () => {
    const t = getStoredToken();
    if (!t || !sessionValid) {
      setRemiseSummary(null);
      return;
    }
    setRemiseLoading(true);
    setRemiseError('');
    try {
      const { data } = await axios.get(`${apiBase}/account-deposit-remises/dashboard`, {
        params: { site },
        headers: authHeaders(t),
        timeout: 60000
      });
      const s = data?.data || null;
      setRemiseSummary(s);
      const todayRemise = s?.todayRemise;
      if (todayRemise && typeof todayRemise.declaredTicketCount === 'number') {
        setDeclaredTicketCount(String(todayRemise.declaredTicketCount));
      }
    } catch (e) {
      setRemiseError(e.response?.data?.error || 'Impossible de charger la remise');
      setRemiseSummary(null);
    } finally {
      setRemiseLoading(false);
    }
  }, [apiBase, site, sessionValid]);

  useEffect(() => {
    if (sessionValid) {
      fetchPresets();
      loadRemiseSummary();
    } else {
      setPresets([]);
      setRemiseSummary(null);
    }
  }, [sessionValid, fetchPresets, loadRemiseSummary]);

  useEffect(() => {
    if (!token || !identity) {
      setSessionHint('');
      return;
    }
    const exp = identity.exp;
    if (exp != null && exp < Date.now()) {
      setSessionHint('Votre session a expiré : reconnectez-vous.');
    } else if (exp != null && exp - Date.now() < 24 * 60 * 60 * 1000) {
      setSessionHint('Session courte : moins de 24 h avant expiration.');
    } else {
      setSessionHint('');
    }
  }, [token, identity]);

  const handleSaleCodeConnect = async (e) => {
    e.preventDefault();
    const digits = String(saleCodeInput).replace(/\D/g, '').slice(0, 3);
    if (digits.length !== 3) {
      setMessage('Saisissez les 3 chiffres du code vendeuse.');
      setMessageType('error');
      return;
    }
    setIdentBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${apiBase}/auth/login-by-sale-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleCode: digits.padStart(3, '0') })
      });
      const data = await response.json();
      if (data.success && data.token) {
        setStoredEmployeeToken(data.token);
        login({
          role: data.user.role,
          name: data.user.name,
          permissions: data.user.permissions || DEFAULT_PERMS
        });
        setSaleCodeInput('');
        setSessionRefresh((x) => x + 1);
        setMessage('Identifiée. Vous pouvez enchaîner les encaissements sans resaisir le code.');
        setMessageType('success');
      } else {
        setMessage(data.error || 'Code incorrect');
        setMessageType('error');
      }
    } catch {
      setMessage('Erreur réseau');
      setMessageType('error');
    } finally {
      setIdentBusy(false);
    }
  };

  const handleChangeVendeuse = () => {
    clearStoredTokens();
    logout();
    setSessionRefresh((x) => x + 1);
    setMessage('');
  };

  const clearClientFields = () => {
    setFirstName('');
    setLastName('');
  };

  const addCurrentToPresets = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setMessage('Saisissez un prénom et un nom avant d’ajouter à la liste.');
      setMessageType('error');
      return;
    }
    const t = getStoredToken();
    if (!t || !sessionValid) {
      setMessage('Identifiez-vous avec le code vendeuse ci-dessus.');
      setMessageType('error');
      return;
    }
    try {
      await axios.post(
        `${apiBase}/account-client-presets`,
        { site, firstName: fn, lastName: ln },
        { headers: authHeaders(t) }
      );
      await fetchPresets();
      setMessage('Client enregistré dans la liste.');
      setMessageType('success');
      clearClientFields();
    } catch (e) {
      setMessage(e.response?.data?.error || 'Impossible d’enregistrer');
      setMessageType('error');
    }
  };

  const matchedPresetId =
    presets.find(
      (p) =>
        p.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() &&
        p.lastName.trim().toLowerCase() === lastName.trim().toLowerCase()
    )?._id || '';

  const onPresetSelectChange = (e) => {
    const v = e.target.value;
    if (!v) return;
    const p = presets.find((x) => x._id === v);
    if (p) {
      setFirstName(p.firstName);
      setLastName(p.lastName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentToken = getStoredToken();
    if (!currentToken || !sessionValid) {
      setMessage('Identifiez-vous avec votre code vendeuse (3 chiffres) en haut de page.');
      setMessageType('error');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setMessage('Saisissez le prénom et le nom du client.');
      setMessageType('error');
      return;
    }
    const amt = parseFloat(String(amount).replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      setMessage('Montant invalide.');
      setMessageType('error');
      return;
    }
    if (!pad.hasInk) {
      setMessage('Le client doit signer pour confirmer le nom et le montant.');
      setMessageType('error');
      return;
    }

    const signatureImage = pad.toDataUrl();
    if (!signatureImage || signatureImage.length < 100) {
      setMessage('Signature invalide, réessayez.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await axios.post(
        `${apiBase}/account-deposits`,
        {
          site,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          amount: amt,
          tpeAuthNumber: '',
          signatureImage
        },
        {
          headers: { Authorization: `Bearer ${currentToken}` },
          timeout: 90000
        }
      );
      setMessage('Dépôt enregistré.');
      setMessageType('success');
      setAmount('25');
      clearClientFields();
      pad.clear();
      // Mettre à jour l'encart remise du jour (compteur + liste)
      loadRemiseSummary();
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;
      if (status === 401) {
        setMessage('Session expirée. Identifiez-vous à nouveau avec le code vendeuse.');
      } else if (!err.response) {
        setMessage('Pas de réponse du serveur. Réessayez dans un instant.');
      } else {
        setMessage(serverMsg || err.message || 'Erreur enregistrement');
      }
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const todayDepositsCount = remiseSummary?.todayDeposits?.depositsCount ?? 0;
  const todayDepositsTotal = remiseSummary?.todayDeposits?.depositsTotal ?? 0;
  const todayDepositsSnapshot = remiseSummary?.todayDeposits?.snapshot || [];
  const todayRemise = remiseSummary?.todayRemise || null;
  const isFinished = todayRemise?.status === 'finished';

  const normalizedTickets =
    declaredTicketCount === '' ? null : Math.max(0, Math.floor(Number(declaredTicketCount)));
  const mismatch =
    normalizedTickets != null && Number.isFinite(normalizedTickets)
      ? normalizedTickets !== (isFinished ? todayRemise?.depositsCount : todayDepositsCount)
      : false;

  const saveDraftTicketCount = async () => {
    const t = getStoredToken();
    if (!t || !sessionValid) return;
    try {
      await axios.put(
        `${apiBase}/account-deposit-remises/today/draft`,
        { site, declaredTicketCount: declaredTicketCount === '' ? null : Number(declaredTicketCount) },
        { headers: authHeaders(t), timeout: 30000 }
      );
      await loadRemiseSummary();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur enregistrement');
    }
  };

  const finishRemise = async () => {
    const t = getStoredToken();
    if (!t || !sessionValid) return;
    if (!window.confirm('Terminer la remise du jour ?')) return;
    setFinishingRemise(true);
    try {
      await axios.post(
        `${apiBase}/account-deposit-remises/today/finish`,
        { site, declaredTicketCount: declaredTicketCount === '' ? null : Number(declaredTicketCount) },
        { headers: authHeaders(t), timeout: 60000 }
      );
      await loadRemiseSummary();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    } finally {
      setFinishingRemise(false);
    }
  };

  const resumeRemise = async () => {
    const t = getStoredToken();
    if (!t || !sessionValid) return;
    if (!window.confirm('Reprendre la remise du jour ?')) return;
    setResumingRemise(true);
    try {
      await axios.post(
        `${apiBase}/account-deposit-remises/today/resume`,
        { site },
        { headers: authHeaders(t), timeout: 30000 }
      );
      await loadRemiseSummary();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    } finally {
      setResumingRemise(false);
    }
  };

  return (
    <div className="compte-client-standalone">
      <div className="compte-client-container">
        <div className="compte-client-header">
          <h1>Crédit compte client</h1>
        </div>

        <div className="compte-client-identity">
          {!sessionValid ? (
            <form className="identity-form" onSubmit={handleSaleCodeConnect}>
              <p className="identity-title">Qui encaisse ?</p>
              <p className="identity-desc">
                Saisissez une fois votre <strong>code vendeuse à 3 chiffres</strong>. La session reste active pour
                plusieurs clients d’affilée (jusqu’à 7 jours).
              </p>
              <div className="identity-row">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="ex. 042"
                  maxLength={3}
                  className="form-control identity-code-input"
                  value={saleCodeInput}
                  onChange={(e) => setSaleCodeInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                />
                <button type="submit" className="btn-identity-ok" disabled={identBusy || saleCodeInput.replace(/\D/g, '').length !== 3}>
                  {identBusy ? '…' : 'Valider'}
                </button>
              </div>
              <p className="identity-alt">
                <a href={loginWithReturn}>Autre connexion (admin / mot de passe salarié)</a>
              </p>
            </form>
          ) : (
            <div className="identity-banner">
              <div className="identity-banner-text">
                <strong>{identity.name || 'Utilisateur'}</strong>
                {identity.role === 'admin' ? (
                  <span className="identity-code-pill muted">Compte admin</span>
                ) : identity.saleCode ? (
                  <span className="identity-code-pill">Code {identity.saleCode}</span>
                ) : (
                  <span className="identity-code-pill muted">Sans code vendeuse (connexion salarié)</span>
                )}
              </div>
              <button type="button" className="btn-identity-change" onClick={handleChangeVendeuse}>
                Changer de vendeuse
              </button>
            </div>
          )}
        </div>

        {sessionValid && sessionHint && (
          <div className="compte-client-session-hint">
            <p>{sessionHint}</p>
            <a href={loginWithReturn}>Se reconnecter (page complète)</a>
          </div>
        )}

        {sessionValid && (
          <div className="cc-remise-card">
            <div className="cc-remise-head">
              <strong>Remise du jour</strong>
              <button type="button" className="cc-remise-refresh" onClick={loadRemiseSummary} disabled={remiseLoading}>
                {remiseLoading ? '…' : 'Actualiser'}
              </button>
            </div>

            {remiseError && <div className="cc-remise-error">{remiseError}</div>}

            <div className="cc-remise-metrics">
              <div className="cc-remise-metric">
                <span>Personnes</span>
                <strong>{isFinished ? (todayRemise?.depositsCount ?? 0) : todayDepositsCount}</strong>
              </div>
              <div className="cc-remise-metric">
                <span>Total</span>
                <strong>{Number(isFinished ? (todayRemise?.depositsTotal ?? 0) : todayDepositsTotal).toFixed(2)} €</strong>
              </div>
            </div>

            <div className="cc-remise-list">
              <div className="cc-remise-list-title">Noms et montants (sauvegardés)</div>
              {(isFinished ? todayRemise?.depositsSnapshot : todayDepositsSnapshot).length === 0 ? (
                <div className="cc-remise-muted">Aucun dépôt aujourd’hui.</div>
              ) : (
                <ul>
                  {(isFinished ? todayRemise?.depositsSnapshot : todayDepositsSnapshot).map((x) => (
                    <li key={String(x.depositId || `${x.lastName}-${x.firstName}-${x.amount}`)}>
                      <strong>{String(x.lastName || '').toUpperCase()} {x.firstName}</strong> — {Number(x.amount || 0).toFixed(2)} €
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="compte-client-form">
          <div className="form-group">
            <label htmlFor="ccf-preset">Client (liste rapide)</label>
            <select
              id="ccf-preset"
              className="form-control"
              value={matchedPresetId}
              onChange={onPresetSelectChange}
              disabled={!sessionValid}
            >
              <option value="">— Choisir un client ou saisir ci-dessous —</option>
              {presets.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.lastName.toUpperCase()} {p.firstName}
                </option>
              ))}
            </select>
            <p className="field-hint">Liste partagée (serveur).</p>
          </div>

          <div className="form-group">
            <label htmlFor="ccf-prenom">Prénom</label>
            <input
              id="ccf-prenom"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
              disabled={!sessionValid}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ccf-nom">Nom</label>
            <input
              id="ccf-nom"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
              disabled={!sessionValid}
            />
          </div>
          <div className="form-group form-group-inline">
            <button type="button" className="btn-secondary" onClick={addCurrentToPresets} disabled={!sessionValid}>
              Enregistrer ce client dans la liste
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="ccf-montant">Montant (€)</label>
            <input
              id="ccf-montant"
              type="number"
              step="0.01"
              min="0.01"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={!sessionValid}
            />
          </div>

          <div className="compte-client-recap">
            <p className="recap-label">Vérification par le client</p>
            <p className="recap-name">
              {lastName || '…'} {firstName || '…'}
            </p>
            <p className="recap-amount">{amount ? `${amount} €` : '… €'}</p>
          </div>

          <div className="form-group signature-block">
            <label>Signature du client</label>
            <div className="signature-wrap">
              <canvas
                ref={pad.canvasRef}
                className="signature-canvas"
                onPointerDown={pad.start}
                onPointerMove={pad.move}
                onPointerUp={pad.end}
                onPointerLeave={pad.end}
              />
            </div>
            <button type="button" className="btn-clear" onClick={pad.clear} disabled={!sessionValid}>
              Effacer la signature
            </button>
          </div>

          <button type="submit" className="btn-submit" disabled={saving || !sessionValid}>
            {saving ? 'Enregistrement…' : 'Valider le dépôt'}
          </button>
        </form>

        {sessionValid && (
          <div className="cc-remise-footer">
            <div className="cc-remise-footer-title">
              Fin de tournée — remise TPE
            </div>
            <p className="cc-remise-footer-desc">
              À faire une fois que tous les dépôts de la journée sont saisis.
            </p>

            <label className="cc-remise-ticket">
              Nombre de tickets TPE (pour comparer)
              <input
                type="number"
                min={0}
                value={declaredTicketCount}
                onChange={(e) => setDeclaredTicketCount(e.target.value)}
                onBlur={saveDraftTicketCount}
                disabled={isFinished}
              />
            </label>

            {mismatch && (
              <div className="cc-remise-warn">
                Attention : tickets ({normalizedTickets}) ≠ personnes ({isFinished ? todayRemise?.depositsCount : todayDepositsCount})
              </div>
            )}

            <div className="cc-remise-buttons">
              {!isFinished ? (
                <button
                  type="button"
                  className="cc-remise-finish"
                  onClick={finishRemise}
                  disabled={finishingRemise || todayDepositsCount === 0}
                >
                  {finishingRemise ? '…' : 'Terminer la remise du jour'}
                </button>
              ) : (
                <button type="button" className="cc-remise-resume" onClick={resumeRemise} disabled={resumingRemise}>
                  {resumingRemise ? '…' : 'Reprendre la remise (erreur)'}
                </button>
              )}
            </div>
          </div>
        )}

        {message && <div className={`compte-client-message ${messageType}`}>{message}</div>}
      </div>
    </div>
  );
};

export default CompteClientStandalone;
