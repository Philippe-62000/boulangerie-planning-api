import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import './Stocks.css';
import './StocksBoissons.css';

const DEFAULT_MARGIN = 10;

function normalizePackSize(raw) {
  return Number(raw) === 24 ? 24 : 12;
}

function computeUnitsNeeded(consumedQty, stockQty, marginPercent) {
  const consumed = Math.max(0, Number(consumedQty) || 0);
  const stock = Math.max(0, Number(stockQty) || 0);
  const margin = Math.max(0, Number(marginPercent) || 0);
  return Math.max(0, Math.ceil(consumed * (1 + margin / 100)) - stock);
}

function recomputeLine(p, marginPercent) {
  const packSize = normalizePackSize(p.packSize);
  const toOrderQty = computeUnitsNeeded(p.consumedQty, p.stockQty, p.marginPercent ?? marginPercent);
  const packsToOrder = toOrderQty <= 0 ? 0 : Math.ceil(toOrderQty / packSize);
  return {
    ...p,
    packSize,
    sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : 9999,
    toOrderQty,
    packsToOrder,
    orderUnits: packsToOrder * packSize
  };
}

function sortByOrder(list) {
  return [...(list || [])].sort((a, b) => {
    const oa = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 9999;
    const ob = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 9999;
    if (oa !== ob) return oa - ob;
    return String(a.name || '').localeCompare(String(b.name || ''), 'fr');
  });
}

function isEmballage(category) {
  return /emballage/i.test(String(category || ''));
}

function isIgnoredBeverage(name) {
  return /kookabarra/i.test(String(name || ''));
}

/** Tab (ou Maj+Tab) : rester dans la colonne Stock, ligne suivante / précédente. */
function onStockTabKeyDown(e) {
  if (e.key !== 'Tab') return;
  const inputs = Array.from(document.querySelectorAll('.bev-page .bev-stock-input'));
  const idx = inputs.indexOf(e.currentTarget);
  if (idx < 0) return;
  const next = inputs[idx + (e.shiftKey ? -1 : 1)];
  if (!next) return;
  e.preventDefault();
  next.focus();
  if (typeof next.select === 'function') next.select();
}

const StocksBoissons = () => {
  const siteKey = getSiteKey() === 'lon' ? 'lon' : 'plan';
  const siteLabel = siteKey === 'lon' ? 'Longuenesse' : 'Arras';

  const [mainTab, setMainTab] = useState('boissons'); // boissons | emballages | ecarts
  const [marginPercent, setMarginPercent] = useState(DEFAULT_MARGIN);
  const [periodLabel, setPeriodLabel] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');
  const [previousMeta, setPreviousMeta] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [products, setProducts] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [booting, setBooting] = useState(true);
  const [message, setMessage] = useState(null);
  const [filterFamily, setFilterFamily] = useState('all');
  const [savingOrder, setSavingOrder] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get('/beverage-orders', { params: { siteKey, limit: 15 } });
      setHistory(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, [siteKey]);

  const applyDoc = (doc, opts = {}) => {
    if (!doc) return;
    setProducts(
      sortByOrder(
        (doc.products || [])
          .filter((p) => !isIgnoredBeverage(p.name))
          .map((p) => recomputeLine(p, doc.marginPercent ?? DEFAULT_MARGIN))
      )
    );
    setPeriodLabel(doc.periodLabel || '');
    setSourceFileName(doc.sourceFileName || '');
    setMarginPercent(doc.marginPercent ?? DEFAULT_MARGIN);
    setCurrentId(doc._id || null);
    if (opts.clearComparison) setComparison([]);
    if (doc.previousPeriodLabel || doc.previousSourceFileName) {
      setPreviousMeta({
        periodLabel: doc.previousPeriodLabel || '',
        sourceFileName: doc.previousSourceFileName || ''
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBooting(true);
      try {
        const [curRes] = await Promise.all([
          api.get('/beverage-orders/current', { params: { siteKey } }),
          loadHistory()
        ]);
        if (cancelled) return;
        const doc = curRes.data?.data;
        if (doc?.products?.length) {
          applyDoc(doc, { clearComparison: true });
          setMessage({
            type: 'ok',
            text: `Ventes en mémoire : ${doc.periodLabel || doc.sourceFileName || 'dernière sauvegarde'}. Vous pouvez les garder ou uploader un nouveau PDF.`
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteKey, loadHistory]);

  const tabProducts = useMemo(() => {
    const filtered =
      mainTab === 'emballages'
        ? products.filter((p) => isEmballage(p.category))
        : mainTab === 'boissons'
          ? products.filter((p) => !isEmballage(p.category))
          : products;
    return sortByOrder(filtered);
  }, [products, mainTab]);

  const families = useMemo(() => {
    const set = new Set(tabProducts.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [tabProducts]);

  const visibleProducts = useMemo(() => {
    if (filterFamily === 'all') return tabProducts;
    return tabProducts.filter((p) => p.category === filterFamily);
  }, [tabProducts, filterFamily]);

  const comparisonForTab = useMemo(() => {
    if (mainTab === 'emballages') return comparison.filter((a) => isEmballage(a.category));
    if (mainTab === 'boissons') return comparison.filter((a) => !isEmballage(a.category));
    return comparison;
  }, [comparison, mainTab]);

  const totals = useMemo(() => {
    const list = tabProducts;
    return {
      refs: list.length,
      consumed: list.reduce((s, p) => s + (Number(p.consumedQty) || 0), 0),
      unitsNeeded: list.reduce((s, p) => s + (Number(p.toOrderQty) || 0), 0),
      packs: list.reduce((s, p) => s + (Number(p.packsToOrder) || 0), 0),
      orderUnits: list.reduce((s, p) => s + (Number(p.orderUnits) || 0), 0),
      lines: list.filter((p) => (Number(p.packsToOrder) || 0) > 0).length
    };
  }, [tabProducts]);

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
      form.append('siteKey', siteKey);
      if (currentId) form.append('previousProposalId', currentId);
      const res = await api.post('/beverage-orders/parse', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data?.data;
      const nextProducts = sortByOrder(
        (data?.products || [])
          .filter((p) => !isIgnoredBeverage(p.name))
          .map((p) => recomputeLine(p, data?.marginPercent ?? marginPercent))
      );
      setProducts(nextProducts);
      setSourceFileName(data?.sourceFileName || file.name);
      setPeriodLabel(data?.periodHint || '');
      setComparison((data?.comparison || []).filter((a) => !isIgnoredBeverage(a.name)));
      setPreviousMeta(data?.previous || null);
      setCurrentId(data?.id || null);
      setFilterFamily('all');
      await loadHistory();
      if ((data?.comparison || []).length) setMainTab('ecarts');
      setMessage({
        type: 'ok',
        text: `${nextProducts.length} référence(s) enregistrées (visibles aussi après F5 / autre PC). Stocks et colis repris si connus. ${(data?.comparison || []).length} écart(s) détecté(s).`
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

  const moveLine = (name, category, direction) => {
    setProducts((prev) => {
      const inTab = sortByOrder(
        prev.filter((p) =>
          mainTab === 'emballages' ? isEmballage(p.category) : !isEmballage(p.category)
        )
      );
      const idx = inTab.findIndex((p) => p.name === name && p.category === category);
      const swapIdx = idx + direction;
      if (idx < 0 || swapIdx < 0 || swapIdx >= inTab.length) return prev;

      const reordered = [...inTab];
      const [item] = reordered.splice(idx, 1);
      reordered.splice(swapIdx, 0, item);

      const orderMap = new Map(
        reordered.map((p, i) => [`${p.category}||${p.name}`, i])
      );

      // Les lignes de l’autre onglet gardent leur ordre relatif
      const other = sortByOrder(
        prev.filter((p) =>
          mainTab === 'emballages' ? !isEmballage(p.category) : isEmballage(p.category)
        )
      );
      const otherBase = mainTab === 'emballages' ? 0 : 1000;
      const tabBase = mainTab === 'emballages' ? 1000 : 0;

      return prev.map((p) => {
        const key = `${p.category}||${p.name}`;
        if (orderMap.has(key)) {
          return { ...p, sortOrder: tabBase + orderMap.get(key) };
        }
        const oi = other.findIndex((o) => o.name === p.name && o.category === p.category);
        if (oi >= 0) return { ...p, sortOrder: otherBase + oi };
        return p;
      });
    });
  };

  const saveLineOrder = async () => {
    if (!products.length) return;
    setSavingOrder(true);
    setMessage(null);
    try {
      const sorted = sortByOrder(products);
      const items = sorted.map((p, idx) => ({
        name: p.name,
        packSize: p.packSize,
        sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : idx
      }));
      await api.put('/beverage-orders/line-order', { siteKey, items });
      setProducts(sorted.map((p, idx) => ({ ...p, sortOrder: items[idx].sortOrder })));
      setMessage({
        type: 'ok',
        text: 'Ordre des lignes enregistré pour les prochaines commandes.'
      });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err.response?.data?.error || 'Erreur enregistrement de l’ordre'
      });
    } finally {
      setSavingOrder(false);
    }
  };

  const patchProduct = (name, category, patch) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.name !== name || p.category !== category) return p;
        return recomputeLine({ ...p, ...patch }, marginPercent);
      })
    );
  };

  const applyMarginToAll = (value) => {
    const margin = Math.max(0, Number(value) || 0);
    setMarginPercent(margin);
    setProducts((prev) =>
      prev.map((p) => recomputeLine({ ...p, marginPercent: margin }, margin))
    );
  };

  const applyPackSizeToVisible = (size) => {
    const packSize = normalizePackSize(size);
    const keys = new Set(visibleProducts.map((p) => `${p.category}||${p.name}`));
    setProducts((prev) =>
      prev.map((p) => {
        if (!keys.has(`${p.category}||${p.name}`)) return p;
        return recomputeLine({ ...p, packSize }, marginPercent);
      })
    );
  };

  const save = async () => {
    if (!products.length) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post('/beverage-orders', {
        siteKey,
        periodLabel,
        sourceFileName,
        marginPercent,
        previousPeriodLabel: previousMeta?.periodLabel || '',
        previousSourceFileName: previousMeta?.sourceFileName || '',
        products
      });
      const doc = res.data?.data;
      setCurrentId(doc?._id || null);
      setMessage({ type: 'ok', text: 'Ventes et proposition enregistrées (mémorisées pour la prochaine fois).' });
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
      applyDoc(doc, { clearComparison: true });
      setMessage({ type: 'ok', text: 'Proposition rechargée.' });
    } catch (err) {
      setMessage({ type: 'err', text: err.response?.data?.error || 'Erreur chargement' });
    }
  };

  const removeProposal = async (id) => {
    if (!window.confirm('Supprimer cette proposition ?')) return;
    try {
      await api.delete(`/beverage-orders/${id}`, { params: { siteKey } });
      if (String(currentId) === String(id)) setCurrentId(null);
      await loadHistory();
    } catch (err) {
      setMessage({ type: 'err', text: err.response?.data?.error || 'Erreur suppression' });
    }
  };

  const compareWithHistory = async (previousId) => {
    if (!currentId || !previousId) {
      setMessage({
        type: 'err',
        text: 'Enregistrez d’abord la proposition actuelle, puis choisissez une ancienne pour comparer.'
      });
      return;
    }
    try {
      const res = await api.post('/beverage-orders/compare', {
        siteKey,
        currentId,
        previousId
      });
      setComparison(res.data?.data?.comparison || []);
      setMainTab('ecarts');
      setMessage({ type: 'ok', text: 'Comparaison chargée dans l’onglet Écarts.' });
    } catch (err) {
      setMessage({ type: 'err', text: err.response?.data?.error || 'Erreur comparaison' });
    }
  };

  const printOrder = () => {
    const rows = tabProducts.filter((p) => (Number(p.packsToOrder) || 0) > 0);
    const title = mainTab === 'emballages' ? 'Emballages' : 'Boissons';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Commande ${title}</title>
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#222}
        h1{margin:0 0 8px} .meta{color:#555;margin-bottom:16px}
        table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
        th{background:#f5f5f5} .num{text-align:right}
      </style></head><body>
      <h1>Commande ${title} — ${siteLabel}</h1>
      <div class="meta">Période : ${periodLabel || '—'} · Marge ${marginPercent}% · Fichier : ${sourceFileName || '—'}<br/>
      Commande le jeudi pour livraison le mardi</div>
      <table><thead><tr>
        <th>Famille</th><th>Référence</th><th class="num">Conso</th><th class="num">Stock</th>
        <th class="num">Besoin u.</th><th class="num">/colis</th><th class="num">Colis</th><th class="num">Unités cmd</th>
      </tr></thead>
      <tbody>
      ${rows
        .map(
          (p) =>
            `<tr><td>${p.category}</td><td>${p.name}</td><td class="num">${p.consumedQty}</td><td class="num">${p.stockQty}</td><td class="num">${p.toOrderQty}</td><td class="num">${p.packSize}</td><td class="num"><b>${p.packsToOrder}</b></td><td class="num">${p.orderUnits}</td></tr>`
        )
        .join('')}
      </tbody></table>
      <p><b>Total :</b> ${rows.reduce((s, p) => s + (p.packsToOrder || 0), 0)} colis
      (${rows.reduce((s, p) => s + (p.orderUnits || 0), 0)} unités) — ${rows.length} références</p>
      </body></html>`;
    openPrintWindow(html);
  };

  const printStockSheet = () => {
    const rows = visibleProducts.length ? visibleProducts : tabProducts;
    if (!rows.length) {
      setMessage({ type: 'err', text: 'Aucune référence à imprimer.' });
      return;
    }
    const title = mainTab === 'emballages' ? 'Emballages' : 'Boissons';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Relevé stocks ${title}</title>
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;padding:20px;color:#222;font-size:13px}
        h1{margin:0 0 6px;font-size:18px} .meta{color:#555;margin-bottom:14px;font-size:12px}
        table{border-collapse:collapse;width:100%} th,td{border:1px solid #333;padding:8px 6px;text-align:left}
        th{background:#eee} .box{width:70px;height:22px} .num{text-align:right;width:64px} td:last-child{white-space:nowrap;font-weight:600}
        @media print { body{padding:0} }
      </style></head><body>
      <h1>Relevé de stocks — ${title} — ${siteLabel}</h1>
      <div class="meta">
        Date : _______________ &nbsp;&nbsp; Période ventes : ${periodLabel || '—'} &nbsp;&nbsp; Fichier : ${sourceFileName || '—'}<br/>
        Noter le stock restant à la main. Notes = format commande (ex. /12 → 12 bouteilles = 1 colis).
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:28px">N°</th>
            <th>Famille</th>
            <th>Référence</th>
            <th class="num">Conso sem.</th>
            <th>Stock restant</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
        ${rows
          .map(
            (p, i) =>
              `<tr>
                <td>${i + 1}</td>
                <td>${p.category || ''}</td>
                <td>${p.name}</td>
                <td class="num">${p.consumedQty ?? ''}</td>
                <td><div class="box"></div></td>
                <td>/${p.packSize || 12}</td>
              </tr>`
          )
          .join('')}
        </tbody>
      </table>
      <p style="margin-top:16px;font-size:12px;color:#555">${rows.length} référence(s)</p>
      </body></html>`;
    openPrintWindow(html);
  };

  const openPrintWindow = (html) => {
    const w = window.open('', '_blank');
    if (!w) {
      alert('Autorisez les pop-ups pour imprimer.');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  return (
    <div className="stocks-page bev-page">
      <header className="stocks-header">
        <div>
          <h1>Boisson & Emballages</h1>
          <div className="stocks-subtitle">
            Site : {siteLabel} — Commande le jeudi pour livraison le mardi
          </div>
        </div>
      </header>

      <section className="stocks-card">
        <h2>Ventes de la semaine</h2>
        {booting ? (
          <p className="stocks-hint">Chargement des ventes mémorisées…</p>
        ) : (
          <>
            {products.length > 0 ? (
              <div className="bev-memory">
                <div>
                  <b>Ventes en cours :</b> {periodLabel || '—'}
                  {sourceFileName ? ` · ${sourceFileName}` : ''}
                  <div className="stocks-hint">
                    Les ventes sont mémorisées dès l’import PDF (F5 / autre ordinateur). Uploader un
                    nouveau PDF pour les remplacer ; stocks et tailles de colis sont repris.
                  </div>
                </div>
              </div>
            ) : (
              <p className="stocks-hint">
                Aucune vente en mémoire. Importez un PDF Crisalid (SYNTHESEInvendus…).
              </p>
            )}
            <div className="bev-toolbar">
              <label className="stocks-btn primary bev-file-btn">
                {loading ? 'Analyse…' : products.length ? 'Mettre à jour les ventes (PDF)' : 'Importer le PDF'}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  disabled={loading}
                  onChange={onUpload}
                />
              </label>
              <label className="bev-field">
                Marge (%)
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
          </>
        )}
      </section>

      {message && (
        <div className={`bev-msg ${message.type === 'ok' ? 'ok' : 'err'}`}>{message.text}</div>
      )}

      <div className="stocks-tabs bev-main-tabs">
        <button
          type="button"
          className={`stocks-tab ${mainTab === 'boissons' ? 'active' : ''}`}
          onClick={() => {
            setMainTab('boissons');
            setFilterFamily('all');
          }}
        >
          Boissons
        </button>
        <button
          type="button"
          className={`stocks-tab ${mainTab === 'emballages' ? 'active' : ''}`}
          onClick={() => {
            setMainTab('emballages');
            setFilterFamily('all');
          }}
        >
          Emballages
        </button>
        <button
          type="button"
          className={`stocks-tab ${mainTab === 'ecarts' ? 'active' : ''}`}
          onClick={() => setMainTab('ecarts')}
        >
          Écarts {comparison.length ? `(${comparison.length})` : ''}
        </button>
      </div>

      {mainTab !== 'ecarts' && products.length > 0 && (
        <section className="stocks-card">
          <div className="bev-summary">
            <div>
              <b>{totals.refs}</b> réf. · conso <b>{totals.consumed}</b> · besoin{' '}
              <b>{totals.unitsNeeded}</b> u. · <b>{totals.packs}</b> colis ({totals.orderUnits} u.) ·{' '}
              {totals.lines} lignes
            </div>
            <div className="bev-actions">
              <select
                className="stocks-input"
                value={filterFamily}
                onChange={(e) => setFilterFamily(e.target.value)}
              >
                {families.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'Toutes les familles' : c}
                  </option>
                ))}
              </select>
              <select
                className="stocks-input"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) applyPackSizeToVisible(e.target.value);
                  e.target.value = '';
                }}
              >
                <option value="">Colis (sélection)…</option>
                <option value="12">Mettre ×12</option>
                <option value="24">Mettre ×24</option>
              </select>
              <button
                type="button"
                className="stocks-btn"
                onClick={printStockSheet}
                title="Feuille à remplir à la main pour noter les stocks"
              >
                Imprimer feuille stock
              </button>
              <button type="button" className="stocks-btn" onClick={printOrder} title="Bon de commande calculé">
                Imprimer commande
              </button>
              <button
                type="button"
                className="stocks-btn"
                disabled={savingOrder || !products.length}
                onClick={saveLineOrder}
                title="Mémoriser l’ordre des lignes pour les prochaines commandes"
              >
                {savingOrder ? 'Ordre…' : 'Enregistrer l’ordre'}
              </button>
              <button type="button" className="stocks-btn primary" disabled={saving} onClick={save}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>

          <div className="bev-table-wrap">
              <table className="bev-table">
              <colgroup>
                <col className="bev-col-order" />
                <col className="bev-col-fam" />
                <col className="bev-col-ref" />
                <col className="bev-col-num" />
                <col className="bev-col-num" />
                <col className="bev-col-num" />
                <col className="bev-col-num" />
                <col className="bev-col-stock" />
                <col className="bev-col-pack" />
                <col className="bev-col-num" />
                <col className="bev-col-num" />
                <col className="bev-col-num" />
              </colgroup>
              <thead>
                <tr>
                  <th>Ordre</th>
                  <th>Famille</th>
                  <th>Référence</th>
                  <th className="num">Ventes</th>
                  <th className="num">Offerts</th>
                  <th className="num">Conso</th>
                  <th className="num">Préc.</th>
                  <th className="num">Stock</th>
                  <th className="num">/colis</th>
                  <th className="num">Besoin u.</th>
                  <th className="num">Colis</th>
                  <th className="num">U. cmd</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((p, rowIdx) => {
                  const prev = p.previousConsumedQty;
                  const drop =
                    prev != null && Number(prev) > 0 && Number(p.consumedQty) < Number(prev) * 0.6;
                  return (
                    <tr
                      key={`${p.category}-${p.name}`}
                      className={drop ? 'bev-row-alert' : undefined}
                    >
                      <td className="bev-order-cell">
                        <button
                          type="button"
                          className="bev-order-btn"
                          tabIndex={-1}
                          disabled={rowIdx === 0 || filterFamily !== 'all'}
                          onClick={() => moveLine(p.name, p.category, -1)}
                          title="Monter"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="bev-order-btn"
                          tabIndex={-1}
                          disabled={rowIdx >= visibleProducts.length - 1 || filterFamily !== 'all'}
                          onClick={() => moveLine(p.name, p.category, 1)}
                          title="Descendre"
                        >
                          ↓
                        </button>
                      </td>
                      <td>{p.category}</td>
                      <td>{p.name}</td>
                      <td className="num">{p.ventesQty}</td>
                      <td className="num">{p.offertsQty}</td>
                      <td className="num">{p.consumedQty}</td>
                      <td className="num muted">{prev != null ? prev : '—'}</td>
                      <td className="num">
                        <input
                          type="number"
                          min="0"
                          className="stocks-input bev-stock-input"
                          value={p.stockQty ?? 0}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={onStockTabKeyDown}
                          onChange={(e) =>
                            patchProduct(p.name, p.category, {
                              stockQty: Math.max(0, parseInt(e.target.value, 10) || 0)
                            })
                          }
                        />
                      </td>
                      <td className="num">
                        <select
                          className="stocks-input bev-pack-select"
                          tabIndex={-1}
                          value={normalizePackSize(p.packSize)}
                          onChange={(e) =>
                            patchProduct(p.name, p.category, {
                              packSize: normalizePackSize(e.target.value)
                            })
                          }
                        >
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                        </select>
                      </td>
                      <td className="num">{p.toOrderQty}</td>
                      <td className="num order">{p.packsToOrder}</td>
                      <td className="num">{p.orderUnits}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="stocks-hint">
            Utilisez ↑ ↓ pour classer les lignes comme sur votre bon de commande, puis{' '}
            <b>Enregistrer l’ordre</b> (filtre « Toutes les familles » requis pour déplacer).
            Exemple colis : conso 60, stock 5 → besoin 55 → colis de 12 → <b>5 colis</b>.
          </p>
        </section>
      )}

      {mainTab === 'ecarts' && (
        <section className="stocks-card">
          <h2>Écarts entre deux périodes</h2>
          <p className="stocks-hint">
            Utile pour repérer une rupture : si un produit ne s’est presque plus vendu alors qu’il
            partait bien avant, les ventes du dernier fichier sous-estiment le besoin.
            {previousMeta
              ? ` Comparaison avec : ${previousMeta.periodLabel || previousMeta.sourceFileName || 'période précédente'}.`
              : ''}
          </p>
          {comparisonForTab.length === 0 ? (
            <p className="stocks-hint">
              Aucun écart notable. Uploadez un nouveau PDF alors que des ventes sont déjà en mémoire,
              ou comparez deux enregistrements dans l’historique.
            </p>
          ) : (
            <div className="bev-table-wrap">
              <table className="bev-table">
                <thead>
                  <tr>
                    <th>Alerte</th>
                    <th>Référence</th>
                    <th>Famille</th>
                    <th className="num">Avant</th>
                    <th className="num">Maintenant</th>
                    <th className="num">Écart</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonForTab.map((a) => (
                    <tr key={`${a.type}-${a.name}`} className={`bev-sev-${a.severity}`}>
                      <td>{a.severity === 'alert' ? '⚠' : a.severity === 'warn' ? '!' : 'i'}</td>
                      <td>{a.name}</td>
                      <td>{a.category}</td>
                      <td className="num">{a.previousQty}</td>
                      <td className="num">{a.currentQty}</td>
                      <td className="num">{a.delta > 0 ? `+${a.delta}` : a.delta}</td>
                      <td>{a.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                  {h.isCurrent ? ' · courante' : ''}
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
                  <button
                    type="button"
                    className="stocks-btn"
                    onClick={() => compareWithHistory(h._id)}
                    disabled={!currentId || String(currentId) === String(h._id)}
                    title="Comparer la proposition courante enregistrée avec celle-ci"
                  >
                    Comparer
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
