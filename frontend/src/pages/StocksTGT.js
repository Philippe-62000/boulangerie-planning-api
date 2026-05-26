import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import { getOrderChannel } from '../config/orderChannels';
import './StocksTGT.css';

const formatDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('fr-FR', {
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

const resolveLocationName = (name) => (name && String(name).trim()) || 'Sans emplacement';

const StocksTGT = ({ channelKey = 'TGT' }) => {
  const channel = getOrderChannel(channelKey);
  const supplier = channel.supplier;
  const siteKey = getSiteKey();
  const siteLabel = siteKey === 'lon' ? 'Longuenesse' : 'Arras';
  const apiQ = useCallback((extra = {}) => ({ siteKey, supplier, ...extra }), [siteKey, supplier]);
  const stocksBase = channel.stocksPath;
  const navigate = useNavigate();
  const location = useLocation();
  const { entryId: routeEntryId } = useParams();

  const isHistoriqueList = location.pathname.endsWith('/historique');
  const [view, setView] = useState(routeEntryId ? 'detail' : isHistoriqueList ? 'historique' : 'saisie');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [printMode, setPrintMode] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [stockValues, setStockValues] = useState({});
  const [comment, setComment] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const selectedEmployee = useMemo(
    () => employees.find((e) => String(e._id) === String(selectedEmployeeId)),
    [employees, selectedEmployeeId]
  );

  const groupedProducts = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const loc = resolveLocationName(p.locationName);
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc).push(p);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [products]);

  const loadProducts = useCallback(async () => {
    const res = await api.get('/tgt-stocks/products', { params: apiQ() });
    setProducts(Array.isArray(res.data?.data) ? res.data.data : []);
  }, [apiQ]);

  const loadEmployees = useCallback(async () => {
    const res = await api.get('/employees');
    const data = res.data?.data || res.data;
    setEmployees(Array.isArray(data) ? data : []);
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/tgt-stocks/entries', { params: apiQ({ limit: 100 }) });
      setHistory(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [apiQ]);

  const loadEntryDetail = useCallback(
    async (id) => {
      setLoading(true);
      try {
        const res = await api.get(`/tgt-stocks/entries/${id}`, { params: apiQ() });
        setDetailEntry(res.data?.data || null);
      } catch (e) {
        console.error(e);
        setDetailEntry(null);
        setMessage({ type: 'error', text: 'Saisie introuvable.' });
      } finally {
        setLoading(false);
      }
    },
    [apiQ]
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        await Promise.all([loadProducts(), loadEmployees()]);
        if (routeEntryId) {
          setView('detail');
          await loadEntryDetail(routeEntryId);
        } else if (isHistoriqueList) {
          setView('historique');
          await loadHistory();
        }
      } catch (e) {
        console.error(e);
        const status = e.response?.status;
        const errText =
          status === 404
            ? `L’API stocks (${channel.stocksTitle}) n’est pas encore déployée sur le serveur (Render api-4). Committez et redéployez le backend, puis rechargez la page.`
            : `Erreur de chargement des données ${channel.stocksTitle}.`;
        setLoadError(errText);
        setMessage({ type: 'error', text: errText });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadProducts, loadEmployees, loadEntryDetail, loadHistory, routeEntryId, isHistoriqueList]);

  useEffect(() => {
    if (isHistoriqueList && !routeEntryId) {
      setView('historique');
      loadHistory();
    }
  }, [isHistoriqueList, routeEntryId, loadHistory]);

  useEffect(() => {
    document.body.classList.add('page-stocks-tgt');
    return () => document.body.classList.remove('page-stocks-tgt');
  }, []);

  useEffect(() => {
    const onAfterPrint = () => setPrintMode(false);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  const updateStock = (productId, value) => {
    setStockValues((prev) => ({ ...prev, [String(productId)]: value }));
  };

  const runPrintModele = () => {
    setPrintMode(true);
    window.setTimeout(() => window.print(), 280);
  };

  const openHistory = async () => {
    setView('historique');
    setMessage(null);
    navigate(`${stocksBase}/historique`);
    await loadHistory();
  };

  const openDetail = (id) => {
    navigate(`${stocksBase}/historique/${id}`);
  };

  const backToSaisie = () => {
    navigate(stocksBase);
    setView('saisie');
    setDetailEntry(null);
    setMessage(null);
  };

  const submitEntry = async () => {
    const employeeName = selectedEmployee?.name || '';
    if (!employeeName) {
      setMessage({ type: 'error', text: 'Choisissez un salarié.' });
      return;
    }

    const items = products
      .map((p) => {
        const raw = stockValues[String(p.productId)];
        if (raw === '' || raw == null) return null;
        return {
          productId: p.productId,
          productName: p.productName,
          locationName: p.locationName,
          stockQty: Math.max(0, Number(raw) || 0)
        };
      })
      .filter(Boolean);

    if (!items.length) {
      setMessage({ type: 'error', text: 'Saisissez au moins un stock produit.' });
      return;
    }

    if (!window.confirm(`Envoyer la saisie ${channel.stocksTitle} pour ${employeeName} (${items.length} produit(s)) ?`)) {
      return;
    }

    setSending(true);
    setMessage(null);
    try {
      const res = await api.post('/tgt-stocks/entry', {
        ...apiQ(),
        employeeId: selectedEmployeeId,
        employeeName,
        comment: comment.trim(),
        items
      });
      setStockValues({});
      setComment('');
      setMessage({
        type: 'success',
        text: res.data?.message || 'Saisie enregistrée avec succès.'
      });
    } catch (e) {
      console.error(e);
      setMessage({
        type: 'error',
        text: e.response?.data?.error || 'Erreur lors de l’envoi.'
      });
    } finally {
      setSending(false);
    }
  };

  const detailGrouped = useMemo(() => {
    if (!detailEntry?.items) return [];
    const map = new Map();
    for (const it of detailEntry.items) {
      const loc = resolveLocationName(it.locationName);
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc).push(it);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [detailEntry]);

  if (view === 'historique') {
    return (
      <div className="stocks-tgt-page">
        <header className="stocks-tgt-header no-print">
          <div>
            <h1>Historique {channel.stocksTitle}</h1>
            <p className="stocks-tgt-subtitle">{siteLabel}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={backToSaisie}>
            ← Retour saisie
          </button>
        </header>
        {historyLoading ? (
          <p>Chargement…</p>
        ) : history.length === 0 ? (
          <p className="stocks-tgt-empty">Aucune saisie enregistrée.</p>
        ) : (
          <table className="stocks-tgt-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Salarié</th>
                <th>Produits</th>
                <th>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row._id}>
                  <td>
                    <button type="button" className="link-btn" onClick={() => openDetail(row._id)}>
                      {formatDateTime(row.createdAt)}
                    </button>
                  </td>
                  <td>{row.employeeName}</td>
                  <td className="col-num">{row.itemsCount ?? 0}</td>
                  <td className="stocks-tgt-comment-cell">{row.comment || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (view === 'detail' || routeEntryId) {
    return (
      <div className="stocks-tgt-page">
        <header className="stocks-tgt-header no-print">
          <div>
            <h1>Saisie {channel.stocksTitle}</h1>
            <p className="stocks-tgt-subtitle">
              {siteLabel} — {formatDateTime(detailEntry?.createdAt)} — {detailEntry?.employeeName || '—'}
            </p>
          </div>
          <div className="stocks-tgt-header-actions">
            <button type="button" className="btn btn-secondary" onClick={openHistory}>
              Historique
            </button>
            <button type="button" className="btn btn-secondary" onClick={backToSaisie}>
              ← Nouvelle saisie
            </button>
          </div>
        </header>
        {loading ? (
          <p>Chargement…</p>
        ) : !detailEntry ? (
          <p className="stocks-tgt-empty">Saisie introuvable.</p>
        ) : (
          <>
            {detailEntry.comment ? (
              <p className="stocks-tgt-entry-comment">
                <strong>Commentaire :</strong> {detailEntry.comment}
              </p>
            ) : null}
            {detailGrouped.map(([locName, group]) => (
            <section key={locName} className="stocks-tgt-group">
              <h3>{locName}</h3>
              <table className="stocks-tgt-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="col-num">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((it) => (
                    <tr key={`${it.productId}-${it.productName}`}>
                      <td>{it.productName}</td>
                      <td className="col-num">{it.stockQty ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`stocks-tgt-page${printMode ? ' print-mode-modele' : ''}`}>
      <header className="stocks-tgt-header no-print">
        <div>
          <h1>{channel.stocksTitle}</h1>
          <p className="stocks-tgt-subtitle">{siteLabel} — saisie des stocks magasin</p>
        </div>
        <div className="stocks-tgt-header-actions">
          <button type="button" className="btn btn-secondary" onClick={runPrintModele}>
            Imprimer modèle
          </button>
          <button type="button" className="btn btn-secondary" onClick={openHistory}>
            Historique
          </button>
        </div>
      </header>

      {message ? (
        <div className={`stocks-tgt-alert stocks-tgt-alert-${message.type} no-print`}>{message.text}</div>
      ) : null}

      <div className="stocks-tgt-toolbar no-print">
        <label>
          Salarié
          <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
            <option value="">— Choisir —</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stocks-tgt-print-title print-only">
        <h2>Modèle {channel.stocksTitle} — {siteLabel}</h2>
        <p>Emplacement, produit et case stock à remplir.</p>
      </div>

      {loading ? (
        <p className="no-print">Chargement…</p>
      ) : loadError ? (
        <p className="stocks-tgt-empty">{loadError}</p>
      ) : groupedProducts.length === 0 ? (
        <p className="stocks-tgt-empty">Aucun produit actif. {channel.emptyProductsHint}</p>
      ) : (
        <>
          <div className="stocks-tgt-saisie no-print">
            {groupedProducts.map(([locName, group]) => (
              <section key={locName} className="stocks-tgt-group">
                <h3>{locName}</h3>
                <table className="stocks-tgt-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th className="col-num">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((p) => (
                      <tr key={String(p.productId)}>
                        <td>{p.productName}</td>
                        <td className="col-num">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            className="qty-input"
                            value={stockValues[String(p.productId)] ?? ''}
                            placeholder="—"
                            onChange={(e) => updateStock(p.productId, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>

          <div className="stocks-tgt-modele-print print-only" aria-hidden={!printMode}>
            {groupedProducts.map(([locName, group]) => (
              <section key={`print-${locName}`} className="modele-print-section">
                <h3 className="modele-print-loc">{locName}</h3>
                <div className="modele-print-columns">
                  {group.map((p) => (
                    <div key={`p-${p.productId}`} className="modele-print-item">
                      <span className="modele-print-name">{p.productName}</span>
                      <span className="modele-print-stock-box" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <footer className="stocks-tgt-footer no-print">
        <label className="stocks-tgt-comment-field">
          Commentaire (optionnel)
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Remarque pour cette saisie de stocks…"
            rows={2}
            maxLength={500}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={submitEntry} disabled={sending || loading}>
          {sending ? 'Envoi…' : 'Envoyer'}
        </button>
      </footer>
    </div>
  );
};

export default StocksTGT;
