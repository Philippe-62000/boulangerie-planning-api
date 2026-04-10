import React, { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl, getStoredToken, getTokenStorageSuffix } from '../config/apiConfig';
import './CompteClientStandalone.css';

const PRESETS_KEY = () => `compteClientPresets${getTokenStorageSuffix()}`;

function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY());
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

function savePresets(list) {
  try {
    const trimmed = list.slice(0, 50);
    localStorage.setItem(PRESETS_KEY(), JSON.stringify(trimmed));
  } catch {
    /* quota ou mode privé */
  }
}

function presetKey(fn, ln) {
  return `${ln.trim().toLowerCase()}|${fn.trim().toLowerCase()}`;
}

/** Expiration JWT (ms) depuis le payload, sans dépendance */
function jwtExpiresAtMs(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
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

const CompteClientStandalone = () => {
  const site = typeof window !== 'undefined' && window.location.pathname.startsWith('/lon') ? 'longuenesse' : 'arras';
  const apiBase = getApiUrl();

  const [presets, setPresets] = useState(() => loadPresets());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [amount, setAmount] = useState('25');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [sessionHint, setSessionHint] = useState('');

  const pad = useSignaturePad();

  const token = getStoredToken();
  const loginPath = site === 'longuenesse' ? '/lon/login' : '/plan/login';

  useEffect(() => {
    if (!token) {
      setSessionHint('');
      return;
    }
    const exp = jwtExpiresAtMs(token);
    if (exp != null && exp < Date.now()) {
      setSessionHint('Votre session a expiré : reconnectez-vous depuis la page de connexion.');
    } else if (exp != null && exp - Date.now() < 24 * 60 * 60 * 1000) {
      setSessionHint('Pensez à vous reconnecter bientôt : la session expire dans moins de 24 h.');
    } else {
      setSessionHint('');
    }
  }, [token]);

  const addCurrentToPresets = () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setMessage('Saisissez un prénom et un nom avant d’ajouter à la liste.');
      setMessageType('error');
      return;
    }
    const k = presetKey(fn, ln);
    const filtered = presets.filter((p) => presetKey(p.firstName, p.lastName) !== k);
    const next = [...filtered, { firstName: fn, lastName: ln }].sort((a, b) =>
      a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) ||
      a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
    );
    savePresets(next);
    setPresets(next);
    setMessage('Client ajouté à la liste sur cet appareil.');
    setMessageType('success');
  };

  const removePreset = (index) => {
    const next = presets.filter((_, i) => i !== index);
    savePresets(next);
    setPresets(next);
  };

  const presetSelectValue = (() => {
    const i = presets.findIndex(
      (p) =>
        p.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() &&
        p.lastName.trim().toLowerCase() === lastName.trim().toLowerCase()
    );
    return i >= 0 ? String(i) : '';
  })();

  const onPresetSelectChange = (e) => {
    const v = e.target.value;
    if (v === '') return;
    const i = parseInt(v, 10);
    if (!Number.isNaN(i) && presets[i]) {
      setFirstName(presets[i].firstName);
      setLastName(presets[i].lastName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentToken = getStoredToken();
    if (!currentToken) {
      setMessage('Connexion requise. Utilisez la page de connexion sur ce téléphone, puis revenez ici.');
      setMessageType('error');
      return;
    }
    const exp = jwtExpiresAtMs(currentToken);
    if (exp != null && exp < Date.now()) {
      setMessage('Session expirée. Reconnectez-vous depuis la page de connexion, puis rouvrez cette page.');
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
      pad.clear();
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;
      if (status === 401) {
        setMessage(
          'Session expirée ou non reconnue. Sur le téléphone, ouvrez d’abord la page de connexion du planning dans Safari ou Chrome (pas depuis un autre appli), connectez-vous, puis rouvrez cette page. Les jetons sont valables 7 jours après reconnexion.'
        );
      } else if (!err.response) {
        setMessage('Pas de réponse du serveur (réseau ou veille). Réessayez dans un instant.');
      } else {
        setMessage(serverMsg || err.message || 'Erreur enregistrement');
      }
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="compte-client-standalone">
      <div className="compte-client-container">
        <div className="compte-client-header">
          <h1>Crédit compte client</h1>
        </div>

        {!token && (
          <div className="compte-client-warning">
            <p>
              Connectez-vous sur <strong>ce téléphone</strong> dans le même navigateur (les identifiants ne se
              transfèrent pas depuis un ordinateur).{' '}
              <a href={loginPath}>Page de connexion</a>
            </p>
          </div>
        )}

        {token && sessionHint && (
          <div className="compte-client-session-hint">
            <p>{sessionHint}</p>
            <a href={loginPath}>Se reconnecter</a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="compte-client-form">
          <div className="form-group">
            <label htmlFor="ccf-preset">Client (liste rapide)</label>
            <select
              id="ccf-preset"
              className="form-control"
              value={presetSelectValue}
              onChange={onPresetSelectChange}
            >
              <option value="">— Choisir un client ou saisir ci-dessous —</option>
              {presets.map((p, i) => (
                <option key={`${p.lastName}-${p.firstName}-${i}`} value={i}>
                  {p.lastName.toUpperCase()} {p.firstName}
                </option>
              ))}
            </select>
            <p className="field-hint">Les clients enregistrés sont stockés sur cet appareil uniquement.</p>
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
            />
          </div>
          <div className="form-group form-group-inline">
            <button type="button" className="btn-secondary" onClick={addCurrentToPresets}>
              Enregistrer ce client dans la liste
            </button>
          </div>

          {presets.length > 0 && (
            <div className="compte-client-preset-list">
              <span className="preset-list-label">Liste ({presets.length})</span>
              <ul className="preset-chips">
                {presets.map((p, index) => (
                  <li key={`${p.lastName}-${p.firstName}-${index}`}>
                    <span>
                      {p.lastName} {p.firstName}
                    </span>
                    <button type="button" className="preset-remove" onClick={() => removePreset(index)} aria-label="Retirer">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
            <button type="button" className="btn-clear" onClick={pad.clear}>
              Effacer la signature
            </button>
          </div>

          <button type="submit" className="btn-submit" disabled={saving || !token}>
            {saving ? 'Enregistrement…' : 'Valider le dépôt'}
          </button>
        </form>

        {message && <div className={`compte-client-message ${messageType}`}>{message}</div>}
      </div>
    </div>
  );
};

export default CompteClientStandalone;
