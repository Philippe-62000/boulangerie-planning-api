import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey, getSiteBasename } from '../config/site';
import './CommandeTGT.css';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
  } catch {
    return '—';
  }
};

/** Recalcule conso côté client ; prévision = moy. 3 sem. si fournie par l’API. */
const effectiveReceivedForConso = (line) => {
  if (line.receivedQty !== '' && line.receivedQty != null) {
    return Math.max(0, Number(line.receivedQty) || 0);
  }
  if (line.lastOrderQty != null && line.lastOrderQty !== '') {
    return Math.max(0, Number(line.lastOrderQty) || 0);
  }
  return null;
};

const withMetrics = (line) => {
  const received =
    line.receivedQty === '' || line.receivedQty == null ? null : Math.max(0, Number(line.receivedQty) || 0);
  const stock = line.stockQty === '' || line.stockQty == null ? null : Math.max(0, Number(line.stockQty) || 0);
  const receivedForConso = effectiveReceivedForConso(line);
  let consumptionQty = null;
  if (receivedForConso != null && stock != null) {
    consumptionQty = Math.max(0, receivedForConso - stock);
  }
  const avg =
    line.avgConsumptionQty != null && line.avgConsumptionQty !== ''
      ? Number(line.avgConsumptionQty)
      : null;
  let suggestedOrderQty = null;
  if (avg != null && avg > 0) {
    suggestedOrderQty = Math.ceil(avg);
  } else if (consumptionQty != null) {
    suggestedOrderQty = Math.ceil(consumptionQty);
  }
  return {
    ...line,
    receivedQty: received,
    stockQty: stock,
    consumptionQty,
    avgConsumptionQty: avg,
    suggestedOrderQty
  };
};

const CMD_QTY_FIELDS = [
  'lastOrderQty',
  'prevOrderQty',
  'cmdQty3',
  'cmdQty4',
  'cmdQty5',
  'cmdQty6'
];

const formatCmdRef = (dateVal, blNum) => {
  let d = '';
  if (dateVal) {
    if (typeof dateVal === 'string' && /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(dateVal.trim())) {
      d = dateVal.trim();
    } else {
      d = formatDate(dateVal);
    }
  }
  const n = blNum ? ` BL ${blNum}` : '';
  if (d && d !== '—') return `${n ? `${d}${n}` : d}`;
  return blNum ? `BL ${blNum}` : '';
};

const cmdQtyCell = (line, field) => {
  const v = line[field];
  return v != null ? v : '—';
};

const resolveProductLocationId = (product) => {
  const raw = product?.locationId?._id ?? product?.locationId;
  if (raw == null || raw === '') return null;
  return String(raw);
};

const mergeCmdMeta = (prev, next) => ({
  ...(prev || {}),
  cmdBlNumbers: next?.cmdBlNumbers ?? prev?.cmdBlNumbers,
  cmdDates: next?.cmdDates ?? prev?.cmdDates,
  cmdFilled: next?.cmdFilled ?? prev?.cmdFilled,
  cmd1BlNumber: next?.cmd1BlNumber ?? prev?.cmd1BlNumber,
  cmd2BlNumber: next?.cmd2BlNumber ?? prev?.cmd2BlNumber,
  lastSubmittedDelivery: next?.lastSubmittedDelivery ?? prev?.lastSubmittedDelivery,
  prevSubmittedDelivery: next?.prevSubmittedDelivery ?? prev?.prevSubmittedDelivery,
  blCount: next?.blCount ?? prev?.blCount
});

const CommandeTGT = () => {
  const siteKey = getSiteKey();
  const siteLabel = siteKey === 'lon' ? 'Longuenesse' : 'Arras';

  const [tab, setTab] = useState('saisie');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [meta, setMeta] = useState(null);
  const [lines, setLines] = useState([]);
  const [orderStatus, setOrderStatus] = useState('draft');
  const [filterLocation, setFilterLocation] = useState('all');
  const [search, setSearch] = useState('');

  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [recap, setRecap] = useState([]);
  const [recapMeta, setRecapMeta] = useState(null);

  const [importText, setImportText] = useState('');
  const [printMode, setPrintMode] = useState(null);
  const pdfInputRef = React.useRef(null);
  /** Ignore les réponses GET en retard après une maj. « dernière commande ». */
  const loadSeqRef = React.useRef(0);

  const mobileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${getSiteBasename()}/commande-tgt`
      : '';

  const loadOrder = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const res = await api.get('/supplier-orders/current', { params: { siteKey } });
    if (seq !== loadSeqRef.current) return;
    const data = res.data?.data;
    setLines(Array.isArray(data?.lines) ? data.lines : []);
    setOrderStatus(data?.status || 'draft');
    setMeta(res.data?.meta || null);
  }, [siteKey]);

  const loadConfig = useCallback(async () => {
    const [locRes, prodRes] = await Promise.all([
      api.get('/supplier-orders/locations', { params: { siteKey } }),
      api.get('/supplier-orders/products', { params: { siteKey } })
    ]);
    setLocations(Array.isArray(locRes.data?.data) ? locRes.data.data : []);
    setProducts(Array.isArray(prodRes.data?.data) ? prodRes.data.data : []);
  }, [siteKey]);

  const loadRecap = useCallback(async () => {
    const res = await api.get('/supplier-orders/recap', { params: { siteKey } });
    setRecap(Array.isArray(res.data?.data) ? res.data.data : []);
    setRecapMeta(res.data?.meta || null);
  }, [siteKey]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      await Promise.all([loadOrder(), loadConfig()]);
      if (tab === 'recap') await loadRecap();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur de chargement.' });
    } finally {
      setLoading(false);
    }
  }, [loadOrder, loadConfig, loadRecap, tab]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    document.body.classList.add('page-commande-tgt');
    return () => document.body.classList.remove('page-commande-tgt');
  }, []);

  useEffect(() => {
    if (tab === 'recap') loadRecap();
  }, [tab, loadRecap]);

  const locationNames = useMemo(() => {
    const fromLocs = locations.filter((l) => l.isActive !== false).map((l) => l.name);
    const fromLines = lines.map((l) => l.locationName).filter(Boolean);
    return [...new Set([...fromLocs, ...fromLines])].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [locations, lines]);

  const groupedLines = useMemo(() => {
    let list = [...lines];
    if (filterLocation !== 'all') {
      list = list.filter((l) => (l.locationName || 'Sans emplacement') === filterLocation);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          (l.productName || '').toLowerCase().includes(q) ||
          (l.supplierCode || '').toLowerCase().includes(q)
      );
    }
    const groups = new Map();
    for (const line of list) {
      const key = line.locationName || 'Sans emplacement';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(line);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'));
  }, [lines, filterLocation, search]);

  const updateLine = (productId, field, value) => {
    setLines((prev) =>
      prev.map((l) => {
        if (String(l.productId) !== String(productId)) return l;
        if (field === 'receivedQty' || field === 'stockQty' || field === 'orderQty') {
          if (value === '' || value == null) {
            const next = {
              ...l,
              [field]: field === 'orderQty' ? 0 : null
            };
            return field === 'orderQty' ? next : withMetrics(next);
          }
          const n = Math.max(0, Number(value));
          const next = {
            ...l,
            [field]: Number.isFinite(n) ? n : field === 'orderQty' ? 0 : null
          };
          return field === 'orderQty' ? next : withMetrics(next);
        }
        return { ...l, [field]: value };
      })
    );
  };

  const computeForecast = async (apply) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post('/supplier-orders/current/compute-forecast', { siteKey, apply });
      setLines(Array.isArray(res.data?.data?.lines) ? res.data.data.lines : lines);
      setMessage({
        type: 'success',
        text: apply
          ? `Prévision appliquée (${res.data?.meta?.forecastLines ?? 0} ligne(s)).`
          : `Prévision calculée (${res.data?.meta?.forecastLines ?? 0} ligne(s), moy. 3 sem. : ${res.data?.meta?.avgFromHistoryLines ?? 0}, historique ${res.data?.meta?.rollingWeeksUsed ?? 0}/${res.data?.meta?.rollingWeeksTarget ?? 3} sem.).`
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur calcul prévision.' });
    } finally {
      setSaving(false);
    }
  };

  const importPdf = async (file) => {
    if (!file) return;
    setSaving(true);
    setMessage(null);
    const form = new FormData();
    form.append('pdf', file);
    try {
      const res = await api.post(`/supplier-orders/import-delivery-pdf?siteKey=${siteKey}`, form);
      setLines(Array.isArray(res.data?.data?.lines) ? res.data.data.lines : lines);
      if (res.data?.meta) {
        setMeta((prev) => mergeCmdMeta(prev, res.data.meta));
      }
      await loadConfig();
      const m = res.data?.meta || {};
      const blCount = m.blCount;
      const filled = Array.isArray(m.cmdFilled) ? m.cmdFilled : [];
      const filledTxt = filled.length
        ? filled.map((n, i) => `-${i + 1}:${n ?? 0}`).join(' ')
        : `-${1}:${m.lastOrderFilled ?? '—'}`;
      const blNums = (m.cmdBlNumbers || []).filter(Boolean).join(', ');
      let hint = '';
      if (typeof blCount === 'number' && blCount < CMD_QTY_FIELDS.length) {
        hint = ` Importez d’autres BL pour remplir jusqu’à Cmd -${CMD_QTY_FIELDS.length} (${blCount} BL en base).`;
      }
      setMessage({
        type: 'success',
        text: `BL importé (cmd ${m.orderNumber || '—'}) — ${m.matchedLines ?? 0} produit(s). Historique ${filledTxt}${blNums ? ` — BL : ${blNums}` : ''}.${hint}`
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: e.response?.data?.error || 'Erreur import PDF.' });
    } finally {
      setSaving(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const seedArrasCatalog = async () => {
    if (!window.confirm('Charger les 126 produits extraits des BL Arras (PDF) ?')) return;
    setSaving(true);
    try {
      const res = await api.post('/supplier-orders/seed-arras-catalog', { siteKey: 'plan' });
      await refreshAll();
      setMessage({
        type: 'success',
        text: `Catalogue Arras chargé (${res.data?.imported ?? 0} produits).`
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: e.response?.data?.error || 'Erreur chargement catalogue.' });
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    setMessage(null);
    const seq = ++loadSeqRef.current;
    try {
      const res = await api.put('/supplier-orders/current', { siteKey, lines });
      if (seq !== loadSeqRef.current) return;
      const savedLines = Array.isArray(res.data?.data?.lines) ? res.data.data.lines : lines;
      setLines(savedLines);
      setMessage({ type: 'success', text: 'Brouillon enregistré.' });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur lors de l’enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  const submitOrder = async () => {
    if (!window.confirm('Valider cette commande ? Les quantités serviront de référence pour la prochaine fois.')) return;
    setSaving(true);
    try {
      await api.put('/supplier-orders/current', { siteKey, lines });
      await api.post('/supplier-orders/current/submit', { siteKey });
      setMessage({ type: 'success', text: 'Commande validée.' });
      await refreshAll();
      setTab('recap');
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur lors de la validation.' });
    } finally {
      setSaving(false);
    }
  };

  const applyPositive = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post('/supplier-orders/current/apply-positive', { siteKey });
      setLines(Array.isArray(res.data?.data?.lines) ? res.data.data.lines : lines);
      const matched = res.data?.meta?.matchedCount ?? 0;
      setMessage({
        type: 'success',
        text: `Stocks mis à jour depuis Positive (${matched} produit(s) reconnus).`
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Impossible d’appliquer Positive.' });
    } finally {
      setSaving(false);
    }
  };

  const refreshLast = async () => {
    setSaving(true);
    setMessage(null);
    const seq = ++loadSeqRef.current;
    try {
      const res = await api.post('/supplier-orders/current/refresh-last', { siteKey });
      if (seq !== loadSeqRef.current) return;
      const newLines = Array.isArray(res.data?.data?.lines) ? res.data.data.lines : null;
      if (newLines?.length) {
        setLines(newLines);
      } else if (res.data?.success !== false) {
        setMessage({
          type: 'error',
          text: 'Réponse serveur sans lignes — vérifiez le déploiement de l’API (Render api-4).'
        });
        return;
      }
      if (res.data?.meta) {
        setMeta((m) => mergeCmdMeta(m, res.data.meta));
      }
      const filled = res.data?.meta?.cmdFilled || [];
      const filledTxt = filled.map((n, i) => `-${i + 1}:${n ?? 0}`).join(' ');
      const blCount = res.data?.meta?.blCount;
      setMessage({
        type: 'success',
        text: `Historique cmd ${filledTxt || '—'}${typeof blCount === 'number' ? ` (${blCount} BL en base)` : ''}.`
      });
    } catch (e) {
      console.error(e);
      setMessage({
        type: 'error',
        text: e.response?.data?.error || 'Erreur actualisation. Déployez l’API si le bouton vient d’être ajouté.'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveLocations = async () => {
    setSaving(true);
    try {
      const items = locations.map((l, idx) => ({
        _id: l._id,
        name: l.name,
        order: idx,
        isActive: l.isActive !== false
      }));
      const res = await api.put('/supplier-orders/locations', { siteKey, items });
      setLocations(Array.isArray(res.data?.data) ? res.data.data : locations);
      setMessage({ type: 'success', text: 'Emplacements enregistrés.' });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur emplacements.' });
    } finally {
      setSaving(false);
    }
  };

  const productToApiItem = (p, idx) => ({
    _id: p._id,
    name: p.name,
    supplierCode: p.supplierCode || '',
    locationId: resolveProductLocationId(p),
    unit: p.unit || 'pièce',
    order: Number(p.order ?? idx),
    isActive: p.isActive !== false
  });

  const setProductActive = async (idx, active) => {
    const p = products[idx];
    const name = String(p?.name || '').trim();
    if (!name) {
      setMessage({ type: 'error', text: 'Indiquez un nom de produit avant de le désactiver.' });
      return;
    }
    if (!p._id) {
      setProducts((prev) => prev.map((x, i) => (i === idx ? { ...x, isActive: active } : x)));
      setMessage({
        type: 'error',
        text: 'Enregistrez d’abord le produit (« Enregistrer produits »), puis désactivez-le.'
      });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/supplier-orders/products', {
        siteKey,
        items: [productToApiItem({ ...p, isActive: active }, idx)]
      });
      setProducts((prev) => prev.map((x, i) => (i === idx ? { ...x, isActive: active } : x)));
      await loadOrder();
      setMessage({
        type: 'success',
        text: active
          ? `${name} réactivé — il réapparaît dans la saisie.`
          : `${name} désactivé — il n’apparaît plus dans la saisie.`
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du produit.' });
    } finally {
      setSaving(false);
    }
  };

  const saveProducts = async () => {
    const missingLocationIds = locations.filter((l) => l.name && !l._id);
    if (missingLocationIds.length) {
      setMessage({
        type: 'error',
        text: 'Enregistrez d’abord les emplacements (bouton « Enregistrer emplacements »), puis assignez les produits.'
      });
      return;
    }
    setSaving(true);
    try {
      const items = products.map((p, idx) => productToApiItem(p, idx));
      const res = await api.put('/supplier-orders/products', { siteKey, items });
      setProducts(Array.isArray(res.data?.data) ? res.data.data : products);
      await Promise.all([loadOrder(), loadConfig()]);
      setMessage({ type: 'success', text: 'Produits et emplacements enregistrés.' });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur produits.' });
    } finally {
      setSaving(false);
    }
  };

  const runImport = async () => {
    let rows;
    try {
      rows = JSON.parse(importText);
      if (!Array.isArray(rows)) throw new Error('JSON doit être un tableau');
    } catch (e) {
      setMessage({ type: 'error', text: 'JSON invalide. Format : [{ "name": "Produit", "lastOrderQty": 5, "locationName": "Vente" }]' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/supplier-orders/products/import', { siteKey, products: rows });
      setProducts(Array.isArray(res.data?.data) ? res.data.data : products);
      await api.post('/supplier-orders/current/refresh-last', { siteKey });
      await loadOrder();
      setImportText('');
      setMessage({ type: 'success', text: `${res.data?.imported || rows.length} produit(s) importé(s).` });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Erreur import.' });
    } finally {
      setSaving(false);
    }
  };

  const addLocation = () => {
    setLocations((prev) => [...prev, { name: '', order: prev.length, isActive: true }]);
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      { name: '', supplierCode: '', locationId: null, unit: 'pièce', isActive: true, order: prev.length }
    ]);
  };

  useEffect(() => {
    const onAfterPrint = () => {
      setPrintMode(null);
      delete document.body.dataset.commandeTgtPrint;
    };
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  const runPrint = (mode) => {
    setPrintMode(mode);
    document.body.dataset.commandeTgtPrint = mode;
    if (mode === 'modele') setFilterLocation('all');
    window.setTimeout(() => window.print(), 280);
  };

  const printList = () => runPrint('saisie');

  const printModele = () => runPrint('modele');

  const orderedCount = lines.filter((l) => Number(l.orderQty) > 0).length;

  const cmdColumnLabels = useMemo(() => {
    return CMD_QTY_FIELDS.map((_, i) => {
      const date =
        meta?.cmdDates?.[i] ??
        (i === 0 ? meta?.lastSubmittedDelivery : i === 1 ? meta?.prevSubmittedDelivery : null);
      const bl =
        meta?.cmdBlNumbers?.[i] ??
        (i === 0 ? meta?.cmd1BlNumber : i === 1 ? meta?.cmd2BlNumber : null);
      const ref = formatCmdRef(date, bl);
      return {
        short: `Cmd -${i + 1}`,
        full: ref ? `Cmd -${i + 1} (${ref})` : `Cmd -${i + 1}`,
        bl: bl || null
      };
    });
  }, [meta]);

  const cmdBlSummary = useMemo(() => {
    const nums = meta?.cmdBlNumbers?.filter(Boolean) || [];
    if (nums.length) return nums.join(' → ');
    const legacy = [meta?.cmd1BlNumber, meta?.cmd2BlNumber].filter(Boolean);
    return legacy.length ? legacy.join(' → ') : '—';
  }, [meta]);

  return (
    <div
      className={`commande-tgt-page${printMode === 'modele' ? ' print-mode-modele' : printMode === 'saisie' ? ' print-mode-saisie' : ''}`}
    >
      <header className="commande-tgt-header no-print">
        <div>
          <h1>Commande TGT</h1>
          <p className="commande-tgt-subtitle">
            {siteLabel} — commande pour livraison du {formatDate(meta?.deliveryDate)}
          </p>
          <p className="commande-tgt-hint">
            Commande le lundi, livraison le vendredi. Historique 6 BL (récent → ancien) : {cmdBlSummary}
            {meta?.lastDeliveryBl?.orderNumber ? (
              <>
                {' '}
                — dernier BL : n°{meta.lastDeliveryBl.orderNumber} ({meta.lastDeliveryBl.orderDate})
              </>
            ) : null}
          </p>
          {mobileUrl ? (
            <p className="commande-tgt-hint commande-tgt-mobile">
              Sur téléphone : connectez-vous au planning, puis ouvrez{' '}
              <a href={mobileUrl}>{mobileUrl}</a> (saisie tactile, pas besoin d’imprimer si vous saisissez
              directement).
            </p>
          ) : null}
          <p className="commande-tgt-hint commande-tgt-formula">
            Cmd -1…-6 : quantités des 6 derniers BL (récent → ancien). Code sous le produit = référence TGT.
            Saisir le <strong>stock</strong> restant : la <strong>conso</strong> se calcule (Cmd -1 − stock, ou reçu
            BL importé − stock). Prévision = moyenne sur 3 semaines validées, sinon conso de la semaine.
            {meta?.rollingWeeksUsed != null ? (
              <> Historique : {meta.rollingWeeksUsed}/{meta.rollingWeeksTarget ?? 3} sem.</>
            ) : null}
          </p>
        </div>
        <div className="commande-tgt-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={printModele}
            title="Liste des produits par emplacement, cases vides à remplir"
          >
            Imprimer modèle
          </button>
          <button type="button" className="btn btn-secondary" onClick={printList} title="Imprimer la saisie en cours">
            Imprimer saisie
          </button>
          <button type="button" className="btn btn-primary" onClick={saveDraft} disabled={saving || loading}>
            {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      </header>

      {message && (
        <div className={`commande-tgt-alert commande-tgt-alert-${message.type} no-print`}>
          {message.text}
        </div>
      )}

      <nav className="commande-tgt-tabs no-print">
        {[
          ['saisie', 'Saisie'],
          ['recap', `Récap (${orderedCount})`],
          ['config', 'Configuration']
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`commande-tgt-tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="commande-tgt-loading">Chargement…</p>
      ) : (
        <>
          {tab === 'saisie' && (
            <section className="commande-tgt-saisie">
              <div className="commande-tgt-toolbar no-print">
                <input
                  type="search"
                  placeholder="Rechercher un produit…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                  <option value="all">Tous les emplacements</option>
                  {locationNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary" onClick={applyPositive} disabled={saving}>
                  Stocks Positive
                </button>
                <button type="button" className="btn btn-secondary" onClick={refreshLast} disabled={saving}>
                  Maj. cmd (6 BL)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => computeForecast(false)} disabled={saving}>
                  Calculer prévision
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => computeForecast(true)} disabled={saving}>
                  Appliquer prévision
                </button>
                <label className="btn btn-secondary btn-file">
                  Importer BL PDF
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden-file"
                    onChange={(e) => importPdf(e.target.files?.[0])}
                  />
                </label>
              </div>

              {orderStatus === 'submitted' && (
                <p className="commande-tgt-info no-print">Cette semaine est déjà validée. Vous pouvez encore modifier puis ré-enregistrer.</p>
              )}

              <div className="commande-tgt-print-title print-only">
                <h2>
                  {printMode === 'modele' ? 'Modèle commande TGT' : 'Commande TGT'} — {siteLabel}
                </h2>
                <p>Livraison : {formatDate(meta?.deliveryDate)}</p>
                {printMode === 'modele' ? (
                  <p className="commande-tgt-print-sub">
                    Produits par emplacement — ligne -1:-6 = historique BL. Cases <strong>S</strong> (stock) et{' '}
                    <strong>C</strong> (conso) à remplir. Cmd -1 = quantité du dernier BL reçu. Références :{' '}
                    {cmdColumnLabels.map((c) => c.full).join(', ')}.
                  </p>
                ) : null}
              </div>

              <div className="commande-tgt-modele-print print-only" aria-hidden={printMode !== 'modele'}>
                {groupedLines.map(([locName, group]) => (
                  <section key={`print-${locName}`} className="modele-print-section">
                    <h3 className="modele-print-loc">{locName}</h3>
                    <div className="modele-print-columns">
                      {group.map((line) => (
                        <div key={`p-${line.productId}`} className="modele-print-item">
                          <span className="modele-print-name">{line.productName}</span>
                          <span className="modele-print-cmd">
                            {CMD_QTY_FIELDS.map((field, i) => (
                              <span key={field} title={cmdColumnLabels[i]?.full}>
                                -{i + 1}:{cmdQtyCell(line, field)}
                              </span>
                            ))}
                          </span>
                          <span className="modele-print-boxes" title="Stock restant, Conso (Cmd -1 − stock)">
                            <i>S</i>
                            <i>C</i>
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {groupedLines.length === 0 ? (
                <p className="commande-tgt-empty">
                  Aucun produit. Importez le catalogue dans l’onglet Configuration.
                </p>
              ) : (
                groupedLines.map(([locName, group]) => (
                  <div key={locName} className="commande-tgt-group">
                    <h3 className="commande-tgt-group-title">{locName}</h3>
                    <div className="commande-tgt-table-wrap">
                      <table className="commande-tgt-table">
                        <thead>
                          <tr>
                            <th>Produit</th>
                            {cmdColumnLabels.map((col, i) => (
                              <th
                                key={CMD_QTY_FIELDS[i]}
                                className="col-num col-hist"
                                title={col.full}
                              >
                                <span className="col-hist-short">{col.short}</span>
                                {col.bl ? <span className="col-hist-bl">{col.bl}</span> : null}
                              </th>
                            ))}
                            <th className="col-num col-saisie">Stock</th>
                            <th
                              className="col-num col-conso col-screen-only"
                              title="Automatique : Cmd -1 − stock (quantité du dernier BL − stock restant)"
                            >
                              Conso
                            </th>
                            <th
                              className="col-num col-prev col-screen-only"
                              title="Moyenne 3 semaines ou conso actuelle"
                            >
                              Prév.
                            </th>
                            <th className="col-num col-order">À cmd</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.map((line) => (
                            <tr key={String(line.productId)}>
                              <td className="col-product">
                                <span className="product-name">{line.productName}</span>
                                {line.supplierCode ? (
                                  <span className="product-code">{line.supplierCode}</span>
                                ) : null}
                              </td>
                              {CMD_QTY_FIELDS.map((field) => (
                                <td key={field} className="col-num col-hist">
                                  {cmdQtyCell(line, field)}
                                </td>
                              ))}
                              <td className="col-num col-saisie">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  inputMode="numeric"
                                  className="qty-input no-print"
                                  value={line.stockQty ?? ''}
                                  placeholder="—"
                                  onChange={(e) => updateLine(line.productId, 'stockQty', e.target.value)}
                                />
                                <span className="print-only print-saisie-val">{line.stockQty ?? ''}</span>
                                <span className="print-only print-modele-cell" aria-hidden="true" />
                              </td>
                              <td className="col-num col-conso col-screen-only">
                                {line.consumptionQty != null ? (
                                  <span
                                    title={
                                      line.receivedQty != null
                                        ? `Reçu BL importé (${line.receivedQty}) − stock`
                                        : line.lastOrderQty != null
                                          ? `Cmd -1 (${line.lastOrderQty}) − stock`
                                          : ''
                                    }
                                  >
                                    {line.consumptionQty}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="col-num col-prev col-screen-only">
                                {line.suggestedOrderQty != null ? (
                                  <span
                                    className="prev-qty"
                                    title={
                                      line.avgConsumptionQty != null
                                        ? `Moy. 3 sem. : ${line.avgConsumptionQty}`
                                        : 'Conso semaine en cours'
                                    }
                                  >
                                    {line.suggestedOrderQty}
                                    {line.avgConsumptionQty != null ? '*' : ''}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="col-num col-order">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  inputMode="numeric"
                                  className="qty-input qty-input-order no-print"
                                  value={line.orderQty ?? 0}
                                  onChange={(e) => updateLine(line.productId, 'orderQty', e.target.value)}
                                />
                                <span className="print-only print-saisie-val">
                                  {line.orderQty > 0 ? line.orderQty : ''}
                                </span>
                                <span className="print-only print-modele-cell" aria-hidden="true" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}

              <footer className="commande-tgt-footer no-print">
                <button type="button" className="btn btn-secondary" onClick={saveDraft} disabled={saving}>
                  Enregistrer brouillon
                </button>
                <button type="button" className="btn btn-primary" onClick={submitOrder} disabled={saving}>
                  Valider la commande
                </button>
              </footer>
            </section>
          )}

          {tab === 'recap' && (
            <section className="commande-tgt-recap">
              <p className="commande-tgt-recap-meta">
                Livraison {formatDate(recapMeta?.deliveryDate)} — {recapMeta?.totalLines || 0} ligne(s),{' '}
                {recapMeta?.totalQty || 0} unité(s)
                {recapMeta?.status === 'submitted' ? ' — validée' : ' — brouillon'}
              </p>
              {recap.length === 0 ? (
                <p className="commande-tgt-empty">Aucune quantité à commander pour le moment.</p>
              ) : (
                <table className="commande-tgt-table commande-tgt-recap-table">
                  <thead>
                    <tr>
                      <th>Emplacement</th>
                      <th>Produit</th>
                      <th className="col-num">Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recap.map((line) => (
                      <tr key={`${line.productId}-${line.productName}`}>
                        <td>{line.locationName || '—'}</td>
                        <td>
                          {line.productName}
                          {line.supplierCode ? ` (${line.supplierCode})` : ''}
                        </td>
                        <td className="col-num">{line.orderQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button type="button" className="btn btn-secondary no-print" onClick={printList}>
                Imprimer le récap
              </button>
            </section>
          )}

          {tab === 'config' && (
            <section className="commande-tgt-config no-print">
              <div className="config-block">
                <h3>Emplacements</h3>
                <p className="commande-tgt-hint">Créez les emplacements (Positive, Vente, étagères…). Ordre = tri à l’affichage.</p>
                {locations.map((loc, idx) => (
                  <div className="config-row" key={loc._id || `new-loc-${idx}`}>
                    <input
                      value={loc.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, name: v } : x)));
                      }}
                      placeholder="Nom emplacement"
                    />
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={loc.isActive !== false}
                        onChange={(e) => {
                          const v = e.target.checked;
                          setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, isActive: v } : x)));
                        }}
                      />
                      Actif
                    </label>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary" onClick={addLocation}>
                  + Emplacement
                </button>
                <button type="button" className="btn btn-primary" onClick={saveLocations} disabled={saving}>
                  Enregistrer emplacements
                </button>
              </div>

              <div className="config-block">
                <h3>Produits & emplacements</h3>
                <p className="commande-tgt-hint">
                  Utilisez « Désactiver » pour retirer un produit arrêté de la saisie. « Réactiver » le remet dans la
                  liste.
                </p>
                {products.map((p, idx) => {
                  const isActive = p.isActive !== false;
                  return (
                    <div
                      className={`config-row config-row-product${isActive ? '' : ' config-row-product--inactive'}`}
                      key={p._id || `new-p-${idx}`}
                    >
                      <input
                        value={p.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProducts((prev) => prev.map((x, i) => (i === idx ? { ...x, name: v } : x)));
                        }}
                        placeholder="Nom produit"
                        disabled={!isActive}
                      />
                      <input
                        value={p.supplierCode || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProducts((prev) => prev.map((x, i) => (i === idx ? { ...x, supplierCode: v } : x)));
                        }}
                        placeholder="Code TGT"
                        disabled={!isActive}
                      />
                      <select
                        value={resolveProductLocationId(p) || ''}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          setProducts((prev) => prev.map((x, i) => (i === idx ? { ...x, locationId: v } : x)));
                        }}
                        disabled={!isActive}
                      >
                        <option value="">— emplacement —</option>
                        {locations
                          .filter((l) => l.isActive !== false && l.name && l._id)
                          .map((l) => (
                            <option key={String(l._id)} value={String(l._id)}>
                              {l.name}
                            </option>
                          ))}
                      </select>
                      {isActive ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-product-toggle"
                          onClick={() => setProductActive(idx, false)}
                          disabled={saving}
                          title="Retirer ce produit de la liste de saisie"
                        >
                          Désactiver
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-product-toggle"
                          onClick={() => setProductActive(idx, true)}
                          disabled={saving}
                          title="Réafficher ce produit dans la saisie"
                        >
                          Réactiver
                        </button>
                      )}
                    </div>
                  );
                })}
                <button type="button" className="btn btn-secondary" onClick={addProduct}>
                  + Produit
                </button>
                <button type="button" className="btn btn-primary" onClick={saveProducts} disabled={saving}>
                  Enregistrer produits
                </button>
              </div>

              <div className="config-block">
                <h3>Catalogue Arras (PDF analysés)</h3>
                <p className="commande-tgt-hint">126 produits extraits des 6 BL Transgourmet (avril–mai 2026).</p>
                {siteKey === 'plan' ? (
                  <button type="button" className="btn btn-primary" onClick={seedArrasCatalog} disabled={saving}>
                    Charger le catalogue Arras
                  </button>
                ) : (
                  <p className="commande-tgt-hint">Disponible sur le site Arras (/plan).</p>
                )}
              </div>

              <div className="config-block">
                <h3>Import catalogue / dernières commandes</h3>
                <p className="commande-tgt-hint">
                  Collez un JSON (ex. depuis Excel) :{' '}
                  <code>[{'{'}&quot;name&quot;:&quot;Croissant&quot;,&quot;lastOrderQty&quot;:24,&quot;locationName&quot;:&quot;Vente&quot;{'}'}]</code>
                </p>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='[{"name":"Produit A","lastOrderQty":10,"locationName":"Positive"}]'
                />
                <button type="button" className="btn btn-primary" onClick={runImport} disabled={saving}>
                  Importer
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default CommandeTGT;
