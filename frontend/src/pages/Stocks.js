import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import './Stocks.css';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const Stocks = () => {
  const siteKey = getSiteKey(); // 'lon' | 'plan'
  const siteLabel = siteKey === 'lon' ? 'Longuenesse' : 'Arras';

  const [activeTab, setActiveTab] = useState('farines');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [flours, setFlours] = useState([]);

  const [params, setParams] = useState([]);
  const paramByName = useMemo(() => new Map(params.map((p) => [p.name, p])), [params]);

  const deliveryParamName = `flourDeliveryDays_${siteKey}`;
  const sacksPerPalletName = `whiteFlourSacksPerPallet_${siteKey}`;

  const [deliveryDays, setDeliveryDays] = useState([]);
  const [sacksPerPallet, setSacksPerPallet] = useState('50');

  const [weeks, setWeeks] = useState(4);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cfgRes, paramsRes] = await Promise.all([
        api.get('/stocks/flours/config', { params: { siteKey } }),
        api.get('/parameters')
      ]);

      setFlours(Array.isArray(cfgRes.data?.data) ? cfgRes.data.data : []);

      const p = Array.isArray(paramsRes.data) ? paramsRes.data : [];
      setParams(p);

      const delivery = p.find((x) => x.name === deliveryParamName)?.stringValue || '[]';
      try {
        const parsed = JSON.parse(delivery);
        setDeliveryDays(Array.isArray(parsed) ? parsed : []);
      } catch {
        setDeliveryDays([]);
      }

      setSacksPerPallet(p.find((x) => x.name === sacksPerPalletName)?.stringValue || '50');
    } catch (e) {
      console.error(e);
      setFlours([]);
      setParams([]);
      setDeliveryDays([]);
      setSacksPerPallet('50');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  const saveFlours = async () => {
    setSaving(true);
    try {
      const items = flours.map((f) => ({
        _id: f._id,
        name: f.name,
        unit: f.unit,
        dailyConsumptionSacks: Number(f.dailyConsumptionSacks || 0),
        criticalThresholdSacks: Number(f.criticalThresholdSacks || 0),
        isActive: !!f.isActive,
        order: Number(f.order || 0)
      }));
      const res = await api.put('/stocks/flours/config', { siteKey, items });
      setFlours(Array.isArray(res.data?.data) ? res.data.data : flours);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l’enregistrement des farines.');
    } finally {
      setSaving(false);
    }
  };

  const saveParameterString = async (name, stringValue) => {
    const param = paramByName.get(name);
    if (!param?._id) {
      alert(
        `Le paramètre ${name} n’existe pas encore. Recharge la page (il est créé automatiquement au chargement de la config farines).`
      );
      return;
    }
    await api.put(`/parameters/${param._id}`, { stringValue });
    await fetchAll();
  };

  const toggleDeliveryDay = (day) => {
    setDeliveryDays((prev) => {
      const s = new Set(prev);
      if (s.has(day)) {
        s.delete(day);
        return Array.from(s);
      }
      if (s.size >= 2) return prev; // max 2
      s.add(day);
      return Array.from(s);
    });
  };

  const saveDeliveryDays = async () => {
    try {
      await saveParameterString(deliveryParamName, JSON.stringify(deliveryDays));
    } catch (e) {
      console.error(e);
      alert('Erreur sauvegarde jours de livraison.');
    }
  };

  const saveSacksPerPallet = async () => {
    const n = Number(sacksPerPallet);
    if (!Number.isFinite(n) || n <= 0 || n > 500) {
      alert('Valeur invalide (1..500).');
      return;
    }
    try {
      await saveParameterString(sacksPerPalletName, String(n));
    } catch (e) {
      console.error(e);
      alert('Erreur sauvegarde sacs par palette.');
    }
  };

  const computeOrder = async () => {
    setOrderLoading(true);
    setOrderResult(null);
    try {
      const res = await api.post('/stocks/flours/order-proposal', { siteKey, weeks: Number(weeks) });
      setOrderResult(res.data?.data || null);
    } catch (e) {
      console.error(e);
      alert('Erreur calcul commande.');
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stocks-page">
        <h1>Stocks</h1>
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="stocks-page">
      <header className="stocks-header">
        <div>
          <h1>Stocks</h1>
          <div className="stocks-subtitle">Site: {siteLabel}</div>
        </div>
      </header>

      <div className="stocks-tabs">
        <button
          className={`stocks-tab ${activeTab === 'farines' ? 'active' : ''}`}
          onClick={() => setActiveTab('farines')}
        >
          Farines
        </button>
        <button
          className={`stocks-tab ${activeTab === 'commande' ? 'active' : ''}`}
          onClick={() => setActiveTab('commande')}
        >
          Commande
        </button>
      </div>

      {activeTab === 'farines' && (
        <section className="stocks-section">
          <h2>Paramètres farines</h2>

          <div className="stocks-card">
            <h3>Livraisons (max 2 jours)</h3>
            <div className="stocks-days">
              {DAYS.map((d) => (
                <label key={d} className={`stocks-day ${deliveryDays.includes(d) ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={deliveryDays.includes(d)}
                    onChange={() => toggleDeliveryDay(d)}
                  />
                  {d}
                </label>
              ))}
            </div>
            <div className="stocks-actions">
              <button className="stocks-btn" onClick={saveDeliveryDays}>
                Enregistrer jours de livraison
              </button>
            </div>
          </div>

          <div className="stocks-card">
            <h3>Farine blanche</h3>
            <div className="stocks-form-row">
              <label>Sacs par palette</label>
              <input
                className="stocks-input"
                value={sacksPerPallet}
                onChange={(e) => setSacksPerPallet(e.target.value)}
                inputMode="numeric"
              />
              <button className="stocks-btn" onClick={saveSacksPerPallet}>
                Enregistrer
              </button>
            </div>
            <div className="stocks-hint">
              Utilisé pour convertir “palettes + sacs” en stock total (sacs).
            </div>
          </div>

          <div className="stocks-card">
            <div className="stocks-card-header">
              <h3>Liste des farines</h3>
              <button className="stocks-btn primary" disabled={saving} onClick={saveFlours}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>

            <div className="stocks-table-wrap">
              <table className="stocks-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Unité</th>
                    <th>Conso/j (sacs)</th>
                    <th>Seuil critique (sacs)</th>
                    <th>Actif</th>
                    <th>Ordre</th>
                  </tr>
                </thead>
                <tbody>
                  {flours.map((f, idx) => (
                    <tr key={f._id || idx}>
                      <td>
                        <input
                          className="stocks-input"
                          value={f.name || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFlours((prev) => prev.map((x) => (x === f ? { ...x, name: v } : x)));
                          }}
                        />
                      </td>
                      <td>{f.unit === 'pallets_and_sacks' ? 'Palettes + sacs' : 'Sacs'}</td>
                      <td>
                        <input
                          className="stocks-input"
                          value={String(f.dailyConsumptionSacks ?? 0)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFlours((prev) =>
                              prev.map((x) => (x === f ? { ...x, dailyConsumptionSacks: v } : x))
                            );
                          }}
                          inputMode="numeric"
                        />
                      </td>
                      <td>
                        <input
                          className="stocks-input"
                          value={String(f.criticalThresholdSacks ?? 0)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFlours((prev) =>
                              prev.map((x) => (x === f ? { ...x, criticalThresholdSacks: v } : x))
                            );
                          }}
                          inputMode="numeric"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!!f.isActive}
                          onChange={(e) => {
                            const v = e.target.checked;
                            setFlours((prev) => prev.map((x) => (x === f ? { ...x, isActive: v } : x)));
                          }}
                        />
                      </td>
                      <td>
                        <input
                          className="stocks-input"
                          value={String(f.order ?? 0)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFlours((prev) => prev.map((x) => (x === f ? { ...x, order: v } : x)));
                          }}
                          inputMode="numeric"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'commande' && (
        <section className="stocks-section">
          <h2>Commande farines</h2>

          <div className="stocks-card">
            <div className="stocks-form-row">
              <label>Nombre de semaines</label>
              <input
                className="stocks-input"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                inputMode="numeric"
              />
              <button className="stocks-btn primary" onClick={computeOrder} disabled={orderLoading}>
                {orderLoading ? 'Calcul…' : 'Calculer'}
              </button>
            </div>
          </div>

          {orderResult && (
            <div className="stocks-card">
              <h3>Proposition</h3>
              {Array.isArray(orderResult.proposals) && orderResult.proposals.length === 0 && (
                <p>Aucune commande suggérée (stocks suffisants ou conso=0).</p>
              )}
              {Array.isArray(orderResult.proposals) && orderResult.proposals.length > 0 && (
                <div className="stocks-table-wrap">
                  <table className="stocks-table">
                    <thead>
                      <tr>
                        <th>Farine</th>
                        <th>Stock actuel (sacs)</th>
                        <th>Conso/j (sacs)</th>
                        <th>Semaine(s)</th>
                        <th>À commander (sacs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderResult.proposals.map((p) => (
                        <tr key={p.flourConfigId}>
                          <td>{p.name}</td>
                          <td style={{ textAlign: 'right' }}>{p.currentStockSacks}</td>
                          <td style={{ textAlign: 'right' }}>{p.dailyConsumptionSacks}</td>
                          <td style={{ textAlign: 'right' }}>{p.weeks}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{p.suggestedOrderSacks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Stocks;

