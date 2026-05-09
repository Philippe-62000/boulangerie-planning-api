import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import './StocksFarinesStandalone.css';

const StocksFarinesStandalone = () => {
  const siteKey = getSiteKey();
  const siteLabel = siteKey === 'lon' ? 'Longuenesse' : 'Arras';

  const [employees, setEmployees] = useState([]);
  const [flours, setFlours] = useState([]);
  const [selectedName, setSelectedName] = useState('');

  const [values, setValues] = useState({});
  const [urgent, setUrgent] = useState(false);
  const [urgentReason, setUrgentReason] = useState('');
  const [message, setMessage] = useState(null);
  const [sending, setSending] = useState(false);
  const [lastSend, setLastSend] = useState({ at: null, byName: '' });

  const activeFlours = useMemo(() => flours.filter((f) => f.isActive !== false), [flours]);

  const fetchInventoryMeta = async () => {
    try {
      const invRes = await api.get('/stocks/flours/inventory', { params: { siteKey } });
      const inv = invRes.data?.data || {};
      const at = inv.lastEntryAt || inv.updatedAt || null;
      setLastSend({ at, byName: String(inv.updatedByName || '').trim() });
    } catch (e) {
      console.error(e);
      setLastSend({ at: null, byName: '' });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, cfgRes] = await Promise.all([
          api.get('/employees'),
          api.get('/stocks/flours/config', { params: { siteKey } })
        ]);
        await fetchInventoryMeta();

        const empData = empRes.data?.data || empRes.data;
        setEmployees(Array.isArray(empData) ? empData : []);
        setFlours(Array.isArray(cfgRes.data?.data) ? cfgRes.data.data : []);
      } catch (e) {
        console.error(e);
        setEmployees([]);
        setFlours([]);
      }
    };
    load();
  }, [siteKey]);

  const setField = (flourId, field, v) => {
    setValues((prev) => ({
      ...prev,
      [flourId]: {
        sacks: 0,
        pallets: 0,
        ...(prev[flourId] || {}),
        [field]: v
      }
    }));
  };

  const submit = async () => {
    if (!selectedName.trim()) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner votre nom.' });
      return;
    }
    if (urgent && !urgentReason.trim()) {
      setMessage({ type: 'error', text: 'Merci de préciser la raison de l’urgence.' });
      return;
    }

    const items = activeFlours.map((f) => ({
      flourConfigId: f._id,
      sacks: Math.max(0, Number(values[f._id]?.sacks || 0)),
      pallets: Math.max(0, Number(values[f._id]?.pallets || 0))
    }));

    setSending(true);
    setMessage(null);
    try {
      const res = await api.post('/stocks/flours/entry', {
        siteKey,
        createdByName: selectedName.trim(),
        createdByEmail: '',
        urgent,
        urgentReason: urgentReason.trim(),
        items
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Stocks envoyés avec succès.' });
        setValues({});
        setUrgent(false);
        setUrgentReason('');
        await fetchInventoryMeta();
      } else {
        setMessage({ type: 'error', text: res.data?.error || 'Erreur lors de l’envoi.' });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur réseau lors de l’envoi.' });
    } finally {
      setSending(false);
    }
  };

  const lastSendLine = () => {
    const iso = lastSend.at;
    const byName = lastSend.byName;
    if (!iso) return 'Dernier envoi : aucun pour l’instant.';
    const d = new Date(iso);
    const label = Number.isNaN(d.getTime())
      ? String(iso)
      : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const dayMs = 86400000;
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const t = new Date();
    const b = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    const days = Math.round((b - a) / dayMs);
    const jourTxt = days <= 0 ? "aujourd'hui" : days === 1 ? 'hier' : `il y a ${days} jours`;
    const par = byName && String(byName).trim() ? ` — par ${String(byName).trim()}` : '';
    return `Dernier envoi : ${label} (${jourTxt})${par}`;
  };

  return (
    <div className="stocks-standalone">
      <div className="stocks-standalone-card">
        <h1>📦 Stocks Farines</h1>
        <p className="subtitle">Site: {siteLabel}</p>
        <p className="last-send-line">{lastSendLine()}</p>

        {message && <div className={`msg ${message.type}`}>{message.text}</div>}

        <div className="block">
          <label>Nom *</label>
          <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)}>
            <option value="">Sélectionnez votre nom</option>
            {employees
              .filter((e) => e && e.name)
              .sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'))
              .map((e) => (
                <option key={e._id || e.name} value={e.name}>
                  {e.name}
                </option>
              ))}
          </select>
        </div>

        <div className="block">
          <div className="urgentRow">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            <span>Urgence</span>
          </div>
          {urgent && (
            <div style={{ marginTop: 10 }}>
              <label>Pourquoi ? *</label>
              <textarea value={urgentReason} onChange={(e) => setUrgentReason(e.target.value)} />
            </div>
          )}
        </div>

        <div className="block">
          <div className="hint">
            Saisissez les sacs. Pour <strong>FARINE BLANCHE</strong>, saisissez palettes + sacs.
          </div>
          {activeFlours.map((f) => (
            <div className="flourRow" key={f._id}>
              <div>
                <div className="flourName">{f.name}</div>
                <div className="muted">{f.unit === 'pallets_and_sacks' ? 'Palettes + sacs' : 'Sacs'}</div>
              </div>
              <div className="inputs">
                {f.unit === 'pallets_and_sacks' && (
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Palettes"
                    value={values[f._id]?.pallets ?? ''}
                    onChange={(e) => setField(f._id, 'pallets', e.target.value)}
                  />
                )}
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Sacs"
                  value={values[f._id]?.sacks ?? ''}
                  onChange={(e) => setField(f._id, 'sacks', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="submit" onClick={submit} disabled={sending}>
          {sending ? 'Envoi…' : 'Envoyer les stocks'}
        </button>
      </div>
    </div>
  );
};

export default StocksFarinesStandalone;

