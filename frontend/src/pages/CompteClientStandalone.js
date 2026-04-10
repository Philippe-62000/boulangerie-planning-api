import React, { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl, getStoredToken } from '../config/apiConfig';
import './CompteClientStandalone.css';

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
    if (e) e.preventDefault();
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
  const siteLabel = site === 'longuenesse' ? 'Longuenesse' : 'Arras';
  const apiBase = getApiUrl();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [amount, setAmount] = useState('25');
  const [tpeAuthNumber, setTpeAuthNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const pad = useSignaturePad();

  const token = getStoredToken();
  const loginPath = site === 'longuenesse' ? '/lon/login' : '/plan/login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('Connexion requise. Ouvrez d’abord la page de connexion du planning dans ce navigateur.');
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
          tpeAuthNumber: tpeAuthNumber.trim(),
          signatureImage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Dépôt enregistré. Le client conserve son ticket TPE ; la signature atteste le bon compte.');
      setMessageType('success');
      setFirstName('');
      setLastName('');
      setAmount('25');
      setTpeAuthNumber('');
      pad.clear();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erreur enregistrement';
      setMessage(msg);
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
          <p>
            {siteLabel} — après paiement TPE, saisie et <strong>signature du client</strong> pour valider le compte à
            créditer.
          </p>
        </div>

        {!token && (
          <div className="compte-client-warning">
            <p>
              Vous devez être connecté(e) au planning (même navigateur).{' '}
              <a href={loginPath}>Se connecter</a>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="compte-client-form">
          <div className="form-group">
            <label htmlFor="ccf-prenom">Prénom du client</label>
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
            <label htmlFor="ccf-nom">Nom du client</label>
            <input
              id="ccf-nom"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
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
            />
          </div>
          <div className="form-group">
            <label htmlFor="ccf-auto">N° autorisation TPE (optionnel)</label>
            <input
              id="ccf-auto"
              className="form-control"
              value={tpeAuthNumber}
              onChange={(e) => setTpeAuthNumber(e.target.value)}
              placeholder="Ex. NO AUTO sur le ticket"
              maxLength={32}
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
            <p className="signature-hint">Le client signe ici pour confirmer que le compte à créditer est le bon.</p>
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
