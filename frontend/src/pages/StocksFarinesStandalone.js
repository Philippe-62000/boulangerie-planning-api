import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import { buildFlourStocksStatusClient } from '../utils/flourStockStatus';
import './StocksFarinesStandalone.css';

const StocksFarinesStandalone = () => {
  const siteKey = getSiteKey();
  const siteLabel = siteKey === 'lon' ? 'Longuenesse' : 'Arras';

  const [employees, setEmployees] = useState([]);
  const [flours, setFlours] = useState([]);
  const [selectedName, setSelectedName] = useState('');

  const [values, setValues] = useState({});
  /** Farines dont au moins un champ a été saisi (mise à jour partielle). */
  const [touchedFlourIds, setTouchedFlourIds] = useState(() => new Set());
  /** partial = seules les farines saisies ; full = toutes les farines (non saisies → 0). */
  const [updateMode, setUpdateMode] = useState('partial');
  const [urgent, setUrgent] = useState(false);
  const [urgentReason, setUrgentReason] = useState('');
  const [message, setMessage] = useState(null);
  const [sending, setSending] = useState(false);
  const [lastSend, setLastSend] = useState({ at: null, byName: '', fullAt: null });
  const [stockMeta, setStockMeta] = useState({
    physicalCountDue: false,
    physicalCountIntervalDays: 5,
    daysSinceFullCount: null,
    daysUntilCountDue: null
  });

  const activeFlours = useMemo(() => flours.filter((f) => f.isActive !== false), [flours]);

  const applyStockMeta = (meta) => {
    const at = meta.lastEntryAt || null;
    const fullAt = meta.lastFullCountAt || null;
    setLastSend({ at, fullAt, byName: String(meta.updatedByName || '').trim() });
    setStockMeta({
      physicalCountDue: meta.physicalCountDue === true,
      physicalCountIntervalDays: meta.physicalCountIntervalDays ?? 5,
      daysSinceFullCount: meta.daysSinceFullCount ?? null,
      daysUntilCountDue: meta.daysUntilCountDue ?? null
    });
    if (meta.physicalCountDue) {
      setUpdateMode('full');
    }
  };

  const fetchStockStatus = async () => {
    try {
      const res = await api.get('/stocks/flours/status', { params: { siteKey } });
      applyStockMeta(res.data?.meta || {});
    } catch (e) {
      const status = e.response?.status;
      if (status !== 404 && status !== 405) {
        console.warn('Status farines indisponible, repli inventaire', status || e.message);
      }
      try {
        const [cfgRes, invRes] = await Promise.all([
          api.get('/stocks/flours/config', { params: { siteKey } }),
          api.get('/stocks/flours/inventory', { params: { siteKey } })
        ]);
        const inventory = invRes.data?.data || { items: [] };
        if (invRes.data?.meta) {
          applyStockMeta(invRes.data.meta);
          return;
        }
        const configs = Array.isArray(cfgRes.data?.data) ? cfgRes.data.data : [];
        const built = buildFlourStocksStatusClient({ configs, inventory });
        applyStockMeta(built.meta);
      } catch (e2) {
        console.error(e2);
        setLastSend({ at: null, fullAt: null, byName: '' });
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, cfgRes] = await Promise.all([
          api.get('/employees'),
          api.get('/stocks/flours/config', { params: { siteKey } })
        ]);
        await fetchStockStatus();

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
    setTouchedFlourIds((prev) => {
      const next = new Set(prev);
      next.add(String(flourId));
      return next;
    });
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

  const buildItemsPayload = () => {
    const mapFlour = (f, touched = false) => ({
      flourConfigId: f._id,
      sacks: Math.max(0, Number(values[f._id]?.sacks || 0)),
      pallets: Math.max(0, Number(values[f._id]?.pallets || 0)),
      ...(touched ? { touched: true } : {})
    });
    if (updateMode === 'full') {
      return activeFlours.map(mapFlour);
    }
    return activeFlours
      .filter((f) => touchedFlourIds.has(String(f._id)))
      .map((f) => mapFlour(f, true));
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

    const items = buildItemsPayload();
    if (updateMode === 'partial' && items.length === 0) {
      setMessage({
        type: 'error',
        text: 'Mise à jour partielle : saisissez au moins une farine, ou choisissez « Envoi complet ».'
      });
      return;
    }

    setSending(true);
    setMessage(null);
    try {
      const res = await api.post('/stocks/flours/entry', {
        siteKey,
        createdByName: selectedName.trim(),
        createdByEmail: '',
        urgent,
        urgentReason: urgentReason.trim(),
        updateMode,
        items
      });
      if (res.data?.success) {
        const n = res.data?.data?.itemsUpdated ?? items.length;
        const modeLabel =
          updateMode === 'full' ? 'envoi complet' : `mise à jour partielle (${n} farine${n > 1 ? 's' : ''})`;
        setMessage({ type: 'success', text: `Stocks enregistrés (${modeLabel}).` });
        setValues({});
        setTouchedFlourIds(new Set());
        setUrgent(false);
        setUrgentReason('');
        await fetchStockStatus();
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
    const iso = lastSend.fullAt || lastSend.at;
    const byName = lastSend.byName;
    if (!iso) return 'Dernier inventaire complet : aucun pour l’instant.';
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
    return `Dernier inventaire complet : ${label} (${jourTxt})${par}`;
  };

  return (
    <div className="stocks-standalone">
      <div className="stocks-standalone-card">
        <h1>📦 Stocks Farines</h1>
        <p className="subtitle">Site: {siteLabel}</p>
        <p className="last-send-line">{lastSendLine()}</p>

        {message && <div className={`msg ${message.type}`}>{message.text}</div>}

        {stockMeta.physicalCountDue && (
          <div className="count-due-banner">
            <strong>Inventaire physique à faire</strong>
            {typeof stockMeta.daysSinceFullCount === 'number' ? (
              <> (dernier inventaire complet il y a {stockMeta.daysSinceFullCount} j)</>
            ) : null}
            . Remplissez <strong>toutes</strong> les farines en mode « Envoi complet » (tous les{' '}
            {stockMeta.physicalCountIntervalDays} jours).
          </div>
        )}

        {!stockMeta.physicalCountDue &&
          typeof stockMeta.daysUntilCountDue === 'number' &&
          stockMeta.daysUntilCountDue > 0 && (
            <p className="count-next-hint">
              Prochain inventaire complet dans {stockMeta.daysUntilCountDue} jour
              {stockMeta.daysUntilCountDue > 1 ? 's' : ''}. Entre deux inventaires, utilisez la mise à jour
              partielle.
            </p>
          )}

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
          <label className="blockLabel">Type d&apos;envoi</label>
          <div className="updateModeOptions">
            <label className="updateModeOption">
              <input
                type="radio"
                name="updateMode"
                value="partial"
                checked={updateMode === 'partial'}
                onChange={() => setUpdateMode('partial')}
              />
              <span>
                <strong>Mise à jour partielle</strong> — seules les farines saisies (les autres stocks sont
                conservés)
              </span>
            </label>
            <label className="updateModeOption">
              <input
                type="radio"
                name="updateMode"
                value="full"
                checked={updateMode === 'full'}
                onChange={() => setUpdateMode('full')}
              />
              <span>
                <strong>Envoi complet</strong> — toutes les farines : les champs vides comptent comme 0
              </span>
            </label>
          </div>
        </div>

        <div className="block">
          <div className="hint">
            Saisissez les sacs. Pour <strong>FARINE BLANCHE</strong>, saisissez palettes + sacs.
            {updateMode === 'partial' ? (
              <> En mode partiel, ne remplissez que les farines à corriger ou à ajouter.</>
            ) : null}
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
