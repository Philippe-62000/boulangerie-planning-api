import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import './Stocks.css';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const QUICK_FRACTIONS = ['1/2', '1/3', '1/4', '1/5', '1/6', '1/7'];
const HISTORY_PAGE_SIZE = 40;

const formatEntryDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
};

const formatEntryItemQty = (item) => {
  if (item.unit === 'pallets_and_sacks') {
    const p = Number(item.pallets) || 0;
    const s = Number(item.sacks) || 0;
    const total = item.stockSacksTotal ?? s;
    return `${p} pal. + ${s} sacs (${Number(total).toFixed(2)} sacs total)`;
  }
  const total = item.stockSacksTotal ?? item.sacks ?? 0;
  return `${Number(total).toFixed(2)} sacs`;
};

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

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ total: 0, skip: 0, hasMore: false });
  const [historyExpandedId, setHistoryExpandedId] = useState(null);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [historyDeletingId, setHistoryDeletingId] = useState(null);

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

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'historique' || tab === 'farines' || tab === 'commande') {
      setActiveTab(tab);
    }
  }, []);

  const saveFlours = async () => {
    setSaving(true);
    try {
      const items = flours.map((f) => ({
        _id: f._id,
        name: f.name,
        unit: f.unit,
        dailyConsumptionSacks: f.dailyConsumptionSacks ?? 0,
        criticalThresholdSacks: f.criticalThresholdSacks ?? 0,
        supplierType: f.supplierType || 'standard',
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

  const fetchHistory = async (skip = 0) => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/stocks/flours/entries', {
        params: { siteKey, limit: HISTORY_PAGE_SIZE, skip }
      });
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      const pag = res.data?.pagination || {};
      setHistoryEntries((prev) => (skip === 0 ? rows : [...prev, ...rows]));
      setHistoryPagination({
        total: pag.total ?? rows.length,
        skip: skip + rows.length,
        hasMore: !!pag.hasMore
      });
    } catch (e) {
      console.error(e);
      if (skip === 0) setHistoryEntries([]);
      alert('Erreur chargement historique des envois.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteHistoryEntry = async (row) => {
    const label = formatEntryDate(row.createdAt);
    const who = row.createdByName || 'salarié inconnu';
    if (
      !window.confirm(
        `Supprimer l'envoi du ${label} (${who}) ?\n\nCette action est irréversible. L'inventaire actuel n'est pas modifié.`
      )
    ) {
      return;
    }
    setHistoryDeletingId(row._id);
    try {
      const res = await api.delete(`/stocks/flours/entries/${row._id}`, { params: { siteKey } });
      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Échec suppression');
      }
      setHistoryEntries((prev) => prev.filter((e) => String(e._id) !== String(row._id)));
      setHistoryPagination((prev) => ({
        ...prev,
        total: Math.max(0, (prev.total || 0) - 1)
      }));
      if (String(historyExpandedId) === String(row._id)) {
        setHistoryExpandedId(null);
        setHistoryDetail(null);
      }
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || 'Erreur lors de la suppression.');
    } finally {
      setHistoryDeletingId(null);
    }
  };

  const loadHistoryDetail = async (entryId) => {
    if (historyExpandedId === entryId) {
      setHistoryExpandedId(null);
      setHistoryDetail(null);
      return;
    }
    setHistoryExpandedId(entryId);
    setHistoryDetail(null);
    setHistoryDetailLoading(true);
    try {
      const res = await api.get(`/stocks/flours/entries/${entryId}`, { params: { siteKey } });
      setHistoryDetail(res.data?.data || null);
    } catch (e) {
      console.error(e);
      alert('Impossible de charger le détail de cet envoi.');
      setHistoryExpandedId(null);
    } finally {
      setHistoryDetailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'historique') return;
    setHistoryExpandedId(null);
    setHistoryDetail(null);
    setHistoryEntries([]);
    setHistoryPagination({ total: 0, skip: 0, hasMore: false });
    fetchHistory(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, siteKey]);

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
        <button
          className={`stocks-tab ${activeTab === 'historique' ? 'active' : ''}`}
          onClick={() => setActiveTab('historique')}
        >
          Historique envois
        </button>
      </div>

      {activeTab === 'farines' && (
        <section className="stocks-section">
          <h2>Paramètres farines</h2>
          <p className="stocks-hint" style={{ marginBottom: '1rem', color: '#555', lineHeight: 1.4 }}>
            Le tableau de bord déduit la consommation journalière chaque jour pour afficher les jours théoriques
            restants. Un inventaire physique complet est demandé tous les 5 jours (paramètre{' '}
            <code>flourPhysicalCountIntervalDays_{siteKey}</code> dans Paramètres généraux).
          </p>

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
                    <th>Fournisseur</th>
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
                        <select
                          className="stocks-input"
                          value={f.supplierType || 'standard'}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFlours((prev) => prev.map((x) => (x === f ? { ...x, supplierType: v } : x)));
                          }}
                        >
                          <option value="standard">Standard</option>
                          <option value="next_day">Commande veille → lendemain</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                          <input
                            className="stocks-input"
                            value={String(f.dailyConsumptionSacks ?? 0)}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFlours((prev) =>
                                prev.map((x) => (x === f ? { ...x, dailyConsumptionSacks: v } : x))
                              );
                            }}
                            inputMode="decimal"
                            placeholder="ex: 0.5 ou 1/3"
                          />
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {QUICK_FRACTIONS.map((fr) => (
                              <button
                                key={fr}
                                type="button"
                                className="stocks-btn"
                                style={{ padding: '6px 10px' }}
                                onClick={() =>
                                  setFlours((prev) => prev.map((x) => (x === f ? { ...x, dailyConsumptionSacks: fr } : x)))
                                }
                              >
                                {fr}
                              </button>
                            ))}
                          </div>
                        </div>
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
                          inputMode="decimal"
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

      {activeTab === 'historique' && (
        <section className="stocks-section">
          <h2>Historique des envois (salariés)</h2>
          <p className="stocks-hint" style={{ marginBottom: '1rem' }}>
            Chaque envoi depuis la page stocks farines est enregistré. Cliquez sur une ligne pour voir le détail des
            quantités saisies.
          </p>

          {historyLoading && historyEntries.length === 0 ? (
            <p>Chargement…</p>
          ) : historyEntries.length === 0 ? (
            <p className="stocks-hint">Aucun envoi enregistré pour ce site.</p>
          ) : (
            <>
              <div className="stocks-table-wrap">
                <table className="stocks-table stocks-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Salarié</th>
                      <th>Type</th>
                      <th>Farines</th>
                      <th>Urgence</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {historyEntries.map((row) => {
                      const isOpen = historyExpandedId === row._id;
                      return (
                        <React.Fragment key={row._id}>
                          <tr className={isOpen ? 'stocks-history-row-open' : ''}>
                            <td>{formatEntryDate(row.createdAt)}</td>
                            <td>
                              <strong>{row.createdByName || '—'}</strong>
                              {row.createdByEmail ? (
                                <div className="stocks-hint">{row.createdByEmail}</div>
                              ) : null}
                            </td>
                            <td>
                              <span
                                className={`stocks-badge ${
                                  row.updateMode === 'full' ? 'stocks-badge-full' : 'stocks-badge-partial'
                                }`}
                              >
                                {row.updateMode === 'full' ? 'Complet' : 'Partiel'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>{row.itemsCount ?? '—'}</td>
                            <td>
                              {row.urgent ? (
                                <span className="stocks-badge stocks-badge-urgent" title={row.urgentReason || ''}>
                                  Urgent
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <div className="stocks-history-actions">
                                <button
                                  type="button"
                                  className="stocks-btn"
                                  disabled={!!historyDeletingId}
                                  onClick={() => loadHistoryDetail(row._id)}
                                >
                                  {isOpen ? 'Masquer' : 'Détail'}
                                </button>
                                <button
                                  type="button"
                                  className="stocks-btn stocks-btn-danger"
                                  disabled={!!historyDeletingId}
                                  onClick={() => deleteHistoryEntry(row)}
                                >
                                  {String(historyDeletingId) === String(row._id) ? '…' : 'Supprimer'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={6} className="stocks-history-detail-cell">
                                {historyDetailLoading ? (
                                  <p className="stocks-hint">Chargement du détail…</p>
                                ) : historyDetail && String(historyDetail._id) === String(row._id) ? (
                                  <div className="stocks-history-detail">
                                    {historyDetail.urgent && historyDetail.urgentReason ? (
                                      <p>
                                        <strong>Raison urgence :</strong> {historyDetail.urgentReason}
                                      </p>
                                    ) : null}
                                    <table className="stocks-table">
                                      <thead>
                                        <tr>
                                          <th>Farine</th>
                                          <th style={{ textAlign: 'right' }}>Quantité saisie</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(historyDetail.items || []).map((it) => (
                                          <tr key={String(it.flourConfigId)}>
                                            <td>{it.name}</td>
                                            <td style={{ textAlign: 'right' }}>{formatEntryItemQty(it)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="stocks-hint">Détail indisponible.</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="stocks-actions" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="stocks-hint">
                  {historyEntries.length} affiché{historyEntries.length > 1 ? 's' : ''}
                  {historyPagination.total > historyEntries.length
                    ? ` sur ${historyPagination.total}`
                    : ''}
                </span>
                {historyPagination.hasMore && (
                  <button
                    type="button"
                    className="stocks-btn"
                    disabled={historyLoading}
                    onClick={() => fetchHistory(historyEntries.length)}
                  >
                    {historyLoading ? 'Chargement…' : 'Charger plus'}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default Stocks;

