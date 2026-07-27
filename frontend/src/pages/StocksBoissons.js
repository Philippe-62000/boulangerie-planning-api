import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import './Stocks.css';
import './StocksBoissons.css';

const DEFAULT_MARGIN = 10;

function computeToOrder(consumedQty, stockQty, marginPercent) {
  const consumed = Math.max(0, Number(consumedQty) || 0);
  const stock = Math.max(0, Number(stockQty) || 0);
  const margin = Math.max(0, Number(marginPercent) || 0);
  const need = Math.ceil(consumed * (1 + margin / 100));
  return Math.max(0, need - stock);
}

const StocksBoissons = () => {
  const siteKey = getSiteKey() === 'lon' ? 'lon' : 'plan';
  const siteLabel = siteKey === 'lon' ? 'Longuenesse' : 'Arras';

  const [marginPercent, setMarginPercent] = useState(DEFAULT_MARGIN);
  const [periodLabel, setPeriodLabel] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const loadHistory = async () => {
    try {
      const res = await api.get('/beverage-orders', { params: { siteKey, limit: 15 } });
      setHistory(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [siteKey]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (filterCategory === 'all') return products;
    return products.filter((p) => p.category === filterCategory);
  }, [products, filterCategory]);

  const totals = useMemo(() => {
    const consumed = products.reduce((s, p) => s + (Number(p.consumedQty) || 0), 0);
    const toOrder = products.reduce((s, p) => s + (Number(p.toOrderQty) || 0), 0);
    const lines = products.filter((p) => (Number(p.toOrderQty) || 0) > 0).length;
    return { consumed, toOrder, lines };
  }, [products]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('marginPercent', String(marginPercent));
      const res = await api.post('/beverage-orders/parse', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data?.data;
      setProducts(data?.products || []);
      setSourceFileName(data?.sourceFileName || file.name);
      setPeriodLabel(data?.periodHint || '');
      setFilterCategory('all');
      setMessage({
        type: 'ok',
        text: `${(data?.products || []).length} référence(s) extraites (${(data?.categories || []).length} familles). Saisissez les stocks restants.`
      });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err.response?.data?.error || 'Erreur lors de l’analyse du PDF'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStock = (name, category, raw) => {
    const stockQty = Math.max(0, parseInt(String(raw).replace(/\D/g, ''), 10) || 0);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.name !== name || p.category !== category) return p;
        const margin = p.marginPercent != null ? p.marginPercent : marginPercent;
        return {
          ...p,
          stockQty,
          toOrderQty: computeToOrder(p.consumedQty, stockQty, margin)
        };
      })
    );
  };

  const applyMarginToAll = (value) => {
    const margin = Math.max(0, Number(value) || 0);
    setMarginPercent(margin);
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        marginPercent: margin,
        toOrderQty: computeToOrder(p.consumedQty, p.stockQty, margin)
      }))
    );
  };

  const save = async () => {
    if (!products.length) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/beverage-orders', {
        siteKey,
        periodLabel,
        sourceFileName,
        marginPercent,
        products
      });
      setMessage({ type: 'ok', text: 'Proposition de commande enregistrée.' });
      await loadHistory();
    } catch (err) {
      setMessage({
        type: 'err',
        text: err.response?.data?.error || 'Erreur enregistrement'
      });
    } finally {
      setSaving(false);
    }
  };

  const loadProposal = async (id) => {
    try {
      const res = await api.get(`/beverage-orders/${id}`, { params: { siteKey } });
      const doc = res.data?.data;
      if (!doc) return;
      setProducts(doc.products || []);
      setPeriodLabel(doc.periodLabel || '');
      setSourceFileName(doc.sourceFileName || '');
      setMarginPercent(doc.marginPercent ?? DEFAULT_MARGIN);
      setFilterCategory('all');
      setMessage({ type: 'ok', text: 'Proposition rechargée.' });
    } catch (err) {
      setMessage({ type: 'err', text: err.response?.data?.error || 'Erreur chargement' });
    }
  };

  const removeProposal = async (id) => {
    if (!window.confirm('Supprimer cette proposition ?')) return;
    try {
      await api.delete(`/beverage-orders/${id}`, { params: { siteKey } });
      await loadHistory();
    } catch (err) {
      setMessage({ type: 'err', text: err.response?.data?.error || 'Erreur suppression' });
    }
  };

  const printOrder = () => {
    const rows = products.filter((p) => (Number(p.toOrderQty) || 0) > 0);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Commande boissons</title>
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#222}
        h1{margin:0 0 8px} .meta{color:#555;margin-bottom:16px}
        table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
        th{background:#f5f5f5} .num{text-align:right}
      </style></head><body>
      <h1>Commande boissons & emballages — ${siteLabel}</h1>
      <div class="meta">Période : ${periodLabel || '—'} · Marge ${marginPercent}% · Fichier : ${sourceFileName || '—'}<br/>
      Commande le jeudi pour livraison le mardi</div>
      <table><thead><tr><th>Famille</th><th>Référence</th><th class="num">Conso</th><th class="num">Stock</th><th class="num">À commander</th></tr></thead>
      <tbody>
      ${rows
        .map(
          (p) =>
            `<tr><td>${p.category}</td><td>${p.name}</td><td class="num">${p.consumedQty}</td><td class="num">${p.stockQty}</td><td class="num"><b>${p.toOrderQty}</b></td></tr>`
        )
        .join('')}
      </tbody></table>
      <p><b>Total à commander :</b> ${rows.reduce((s, p) => s + (p.toOrderQty || 0), 0)} unités (${rows.length} références)</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
      alert('Autorisez les pop-ups pour imprimer.');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 250);
  };

  return (
    <div className="stocks-page bev-page">
      <header className="stocks-header">
        <div>
          <h1>Boisson & Emballages</h1>
          <div className="stocks-subtitle">
            Site : {siteLabel} — Importez la synthèse Crisalid de la semaine passée
          </div>
        </div>
      </header>

      <section className="stocks-card">
        <h2>1. Importer le PDF de la semaine</h2>
        <p className="stocks-hint">
          Fichier type <code>SYNTHESEInvendus…pdf</code>. Familles lues : Boissons 33cl / 50cl,
          Eaux, Boissons Premium, Eaux aromatisées 50cl, Emballages. Consommation = ventes +
          offerts. Commande le <b>jeudi</b> pour livraison le <b>mardi</b>.
        </p>
        <div className="bev-toolbar">
          <label className="stocks-btn primary bev-file-btn">
            {loading ? 'Analyse…' : 'Choisir le PDF'}
            <input type="file" accept="application/pdf,.pdf" hidden disabled={loading} onChange={onUpload} />
          </label>
          <label className="bev-field">
            Marge d&apos;erreur (%)
            <input
              type="number"
              min="0"
              max="100"
              className="stocks-input"
              value={marginPercent}
              onChange={(e) => applyMarginToAll(e.target.value)}
            />
          </label>
          <label className="bev-field grow">
            Libellé période
            <input
              type="text"
              className="stocks-input"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="ex. semaine du 20/07 au 26/07"
            />
          </label>
        </div>
        {sourceFileName && (
          <div className="stocks-hint" style={{ marginTop: 8 }}>
            Fichier : {sourceFileName}
          </div>
        )}
      </section>

      {message && (
        <div className={`bev-msg ${message.type === 'ok' ? 'ok' : 'err'}`}>{message.text}</div>
      )}

      {products.length > 0 && (
        <section className="stocks-card">
          <div className="bev-summary">
            <div>
              <b>{products.length}</b> références · conso semaine <b>{totals.consumed}</b> · à
              commander <b>{totals.toOrder}</b> ({totals.lines} lignes)
            </div>
            <div className="bev-actions">
              <select
                className="stocks-input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'Toutes les familles' : c}
                  </option>
                ))}
              </select>
              <button type="button" className="stocks-btn" onClick={printOrder}>
                Imprimer la commande
              </button>
              <button type="button" className="stocks-btn primary" disabled={saving} onClick={save}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>

          <div className="bev-table-wrap">
            <table className="bev-table">
              <thead>
                <tr>
                  <th>Famille</th>
                  <th>Référence</th>
                  <th>Ventes</th>
                  <th>Offerts</th>
                  <th>Conso</th>
                  <th>Stock restant</th>
                  <th>À commander</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((p) => (
                  <tr key={`${p.category}-${p.name}`}>
                    <td>{p.category}</td>
                    <td>{p.name}</td>
                    <td className="num">{p.ventesQty}</td>
                    <td className="num">{p.offertsQty}</td>
                    <td className="num">{p.consumedQty}</td>
                    <td className="num">
                      <input
                        type="number"
                        min="0"
                        className="stocks-input bev-stock-input"
                        value={p.stockQty ?? 0}
                        onChange={(e) => updateStock(p.name, p.category, e.target.value)}
                      />
                    </td>
                    <td className="num order">{p.toOrderQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="stocks-hint">
            Formule : à commander = plafond(conso × (1 + marge%)) − stock restant (minimum 0).
          </p>
        </section>
      )}

      <section className="stocks-card">
        <h2>Historique</h2>
        {history.length === 0 ? (
          <p className="stocks-hint">Aucune proposition enregistrée pour ce site.</p>
        ) : (
          <ul className="bev-history">
            {history.map((h) => (
              <li key={h._id}>
                <div>
                  <b>{new Date(h.createdAt).toLocaleString('fr-FR')}</b>
                  {h.periodLabel ? ` — ${h.periodLabel}` : ''}
                  <span className="stocks-hint">
                    {' '}
                    · {(h.products || []).length} réf. · marge {h.marginPercent}%
                  </span>
                </div>
                <div className="bev-actions">
                  <button type="button" className="stocks-btn" onClick={() => loadProposal(h._id)}>
                    Ouvrir
                  </button>
                  <button type="button" className="stocks-btn" onClick={() => removeProposal(h._id)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default StocksBoissons;
