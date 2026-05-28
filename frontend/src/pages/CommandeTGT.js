import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey, getSiteBasename } from '../config/site';
import { getOrderChannel } from '../config/orderChannels';
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
  return v != null && v !== '' ? v : '—';
};

/** Historique BL pour l’impression modèle (-1 à -6), lisible à l’œil (évite -1:1 confondu avec 11). */
const ModelePrintHistory = ({ line, cmdColumnLabels }) => (
  <span className="modele-print-cmd">
    {CMD_QTY_FIELDS.map((field, i) => (
      <span key={field} className="modele-print-week" title={cmdColumnLabels[i]?.full}>
        <span className="modele-print-week-lbl">-{i + 1}</span>
        <span className="modele-print-week-sep">:</span>
        <span className="modele-print-week-qty">{cmdQtyCell(line, field)}</span>
      </span>
    ))}
  </span>
);

const resolveProductLocationId = (product) => {
  const raw = product?.locationId?._id ?? product?.locationId;
  if (raw == null || raw === '') return null;
  return String(raw);
};

const resolveProductLocationName = (product, locationsList) => {
  if (product?.locationName) return String(product.locationName).trim();
  if (product?.locationId?.name) return String(product.locationId.name).trim();
  const id = resolveProductLocationId(product);
  if (id && locationsList?.length) {
    const loc = locationsList.find((l) => String(l._id) === String(id));
    if (loc?.name) return loc.name;
  }
  return '';
};

/** Placeholder affiché quand aucun emplacement réel n’est choisi (select ou données importées). */
const isPlaceholderLocationName = (name) => {
  const n = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (!n) return true;
  if (n === 'sans emplacement') return true;
  if (/^[-—–\s]*(emplacement|sans emplacement)[-—–\s]*$/.test(n)) return true;
  if (/^—\s*emplacement\s*—$/.test(String(name || '').trim())) return true;
  return false;
};

const hasProductLocation = (product, locationsList) => {
  const id = resolveProductLocationId(product);
  if (id) {
    const loc = locationsList?.find((l) => String(l._id) === String(id));
    if (loc?.name && !isPlaceholderLocationName(loc.name)) return true;
  }
  const name = resolveProductLocationName(product, locationsList);
  return Boolean(name) && !isPlaceholderLocationName(name);
};

const displayLocationKey = (name) =>
  isPlaceholderLocationName(name) ? 'Sans emplacement' : (name && String(name).trim()) || 'Sans emplacement';

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

const CommandeTGT = ({ channelKey = 'TGT' }) => {
  const channel = getOrderChannel(channelKey);
  const supplier = channel.supplier;
  const siteKey = getSiteKey();
  const siteLabel = siteKey === 'lon' ? 'Longuenesse' : 'Arras';
  const apiQ = useCallback((extra = {}) => ({ siteKey, supplier, ...extra }), [siteKey, supplier]);

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
  const [tgtStockSubmissionDays, setTgtStockSubmissionDays] = useState([]);
  const TGT_STOCK_DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const [printMode, setPrintMode] = useState(null);
  const [stockImportModalOpen, setStockImportModalOpen] = useState(false);
  const [stockImportEntries, setStockImportEntries] = useState([]);
  const [stockImportLoading, setStockImportLoading] = useState(false);
  const [selectedStockEntryIds, setSelectedStockEntryIds] = useState([]);
  const pdfInputRef = React.useRef(null);
  /** Ignore les réponses GET en retard après une maj. « dernière commande ». */
  const loadSeqRef = React.useRef(0);

  const mobileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${getSiteBasename()}${channel.commandePath}`
      : '';

  const loadOrder = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const res = await api.get('/supplier-orders/current', { params: apiQ() });
    if (seq !== loadSeqRef.current) return;
    const data = res.data?.data;
    setLines(Array.isArray(data?.lines) ? data.lines : []);
    setOrderStatus(data?.status || 'draft');
    setMeta(res.data?.meta || null);
  }, [siteKey, apiQ]);

  const loadConfig = useCallback(async () => {
    const [locRes, prodRes, tgtCfgRes] = await Promise.all([
      api.get('/supplier-orders/locations', { params: apiQ() }),
      api.get('/supplier-orders/products', { params: apiQ() }),
      api.get('/tgt-stocks/config', { params: apiQ() }).catch(() => ({ data: { data: { submissionDays: [] } } }))
    ]);
    setLocations(Array.isArray(locRes.data?.data) ? locRes.data.data : []);
    setProducts(Array.isArray(prodRes.data?.data) ? prodRes.data.data : []);
    const days = tgtCfgRes.data?.data?.submissionDays;
    setTgtStockSubmissionDays(Array.isArray(days) ? days : []);
  }, [siteKey, apiQ]);

  const toggleTgtStockDay = (dayNum) => {
    setTgtStockSubmissionDays((prev) => {
      const set = new Set(prev);
      if (set.has(dayNum)) set.delete(dayNum);
      else set.add(dayNum);
      return [...set].sort((a, b) => a - b);
    });
  };

  const saveTgtStockSchedule = async () => {
    setSaving(true);
    try {
      await api.put('/tgt-stocks/config', {
        siteKey,
        supplier,
        submissionDays: tgtStockSubmissionDays
      });
      setMessage({
        type: 'success',
        text: `Jours de saisie ${channel.stockScheduleMenuLabel} enregistrés.`
      });
    } catch (e) {
      console.error(e);
      setMessage({
        type: 'error',
        text: `Erreur enregistrement jours stocks ${channel.stockScheduleMenuLabel}.`
      });
    } finally {
      setSaving(false);
    }
  };

  const loadRecap = useCallback(async () => {
    const res = await api.get('/supplier-orders/recap', { params: apiQ() });
    setRecap(Array.isArray(res.data?.data) ? res.data.data : []);
    setRecapMeta(res.data?.meta || null);
  }, [siteKey, apiQ]);

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
    const fromLines = lines.map((l) => displayLocationKey(l.locationName));
    return [...new Set([...fromLocs, ...fromLines])].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [locations, lines]);

  const configProductsSorted = useMemo(
    () =>
      products
        .map((p, idx) => ({ p, idx }))
        .sort((a, b) => {
          const aActive = a.p.isActive !== false;
          const bActive = b.p.isActive !== false;
          const aNo = aActive && !hasProductLocation(a.p, locations);
          const bNo = bActive && !hasProductLocation(b.p, locations);
          if (aNo !== bNo) return aNo ? -1 : 1;
          return (Number(a.p.order) || a.idx * 10) - (Number(b.p.order) || b.idx * 10);
        }),
    [products, locations]
  );

  const configNoLocationCount = useMemo(
    () => products.filter((p) => p.isActive !== false && !hasProductLocation(p, locations)).length,
    [products, locations]
  );

  const groupedLines = useMemo(() => {
    let list = [...lines];
    if (filterLocation !== 'all') {
      list = list.filter((l) => displayLocationKey(l.locationName) === filterLocation);
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
      const key = displayLocationKey(line.locationName);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(line);
    }
    const sortGroup = (group) =>
      [...group].sort((a, b) => {
        const oa = a.productOrder ?? a.order ?? 0;
        const ob = b.productOrder ?? b.order ?? 0;
        if (oa !== ob) return oa - ob;
        return (a.productName || '').localeCompare(b.productName || '', 'fr');
      });
    return [...groups.entries()]
      .filter(([, group]) => group.length > 0)
      .sort(([a], [b]) => a.localeCompare(b, 'fr'))
      .map(([loc, group]) => [loc, sortGroup(group)]);
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
      const res = await api.post('/supplier-orders/current/compute-forecast', apiQ({ apply }));
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
      const res = await api.post(
        `/supplier-orders/import-delivery-pdf?siteKey=${siteKey}&supplier=${supplier}`,
        form
      );
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
      const res = await api.put('/supplier-orders/current', apiQ({ lines }));
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
      await api.put('/supplier-orders/current', apiQ({ lines }));
      await api.post('/supplier-orders/current/submit', apiQ());
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
      const res = await api.post('/supplier-orders/current/apply-positive', apiQ());
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

  const employeeStockImports = meta?.employeeStockImports || [];

  const openEmployeeStockImport = async () => {
    setStockImportModalOpen(true);
    setStockImportLoading(true);
    try {
      const res = await api.get('/tgt-stocks/entries', { params: apiQ({ limit: 100 }) });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setStockImportEntries(list);
      const preselected = (employeeStockImports || []).map((i) => String(i.entryId)).filter(Boolean);
      setSelectedStockEntryIds(preselected.length ? preselected : []);
    } catch (e) {
      console.error(e);
      setMessage({
        type: 'error',
        text: `Impossible de charger la liste des imports ${channel.stockScheduleMenuLabel}.`
      });
      setStockImportModalOpen(false);
    } finally {
      setStockImportLoading(false);
    }
  };

  const toggleStockEntrySelection = (entryId) => {
    const id = String(entryId);
    setSelectedStockEntryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyEmployeeStocks = async () => {
    if (!selectedStockEntryIds.length) {
      setMessage({ type: 'error', text: 'Sélectionnez au moins un import.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post('/supplier-orders/current/apply-employee-stocks', apiQ({
        entryIds: selectedStockEntryIds
      }));
      setLines(Array.isArray(res.data?.data?.lines) ? res.data.data.lines : lines);
      if (res.data?.meta) {
        setMeta((m) => ({
          ...m,
          employeeStockImports: res.data.meta.employeeStockImports || []
        }));
      }
      const matched = res.data?.meta?.matchedProducts ?? 0;
      const count = res.data?.meta?.importCount ?? selectedStockEntryIds.length;
      setMessage({
        type: 'success',
        text: `Stocks salariés importés (remplacement) : ${count} import(s), ${matched} produit(s) renseignés.`
      });
      setStockImportModalOpen(false);
    } catch (e) {
      console.error(e);
      setMessage({
        type: 'error',
        text: e.response?.data?.error || 'Erreur import stocks salariés.'
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshLast = async () => {
    setSaving(true);
    setMessage(null);
    const seq = ++loadSeqRef.current;
    try {
      const res = await api.post('/supplier-orders/current/refresh-last', apiQ());
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
      const res = await api.put('/supplier-orders/locations', apiQ({ items }));
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
    locationName: resolveProductLocationName(p, locations),
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
      await api.put('/supplier-orders/products', apiQ({
        items: [productToApiItem({ ...p, isActive: active }, idx)]
      }));
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
      const res = await api.put('/supplier-orders/products', apiQ({ items }));
      if (Array.isArray(res.data?.data)) {
        setProducts(res.data.data);
      }
      await loadOrder();
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
      const res = await api.post('/supplier-orders/products/import', apiQ({ products: rows }));
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
      { name: '', supplierCode: '', locationId: null, unit: 'pièce', isActive: true, order: prev.length * 10 }
    ]);
  };

  const moveProduct = (idx, direction) => {
    setProducts((prev) => {
      const next = [...prev];
      const j = idx + direction;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((p, i) => ({ ...p, order: i * 10 }));
    });
  };

  const seedMillangeCatalog = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post('/supplier-orders/seed-millange-catalog', { siteKey: 'plan' });
      await loadConfig();
      await loadOrder();
      setMessage({
        type: 'success',
        text: `Catalogue Mill'Ange chargé (${res.data?.productCount ?? 0} produits).`
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: e.response?.data?.error || 'Erreur chargement catalogue Mill\'Ange.' });
    } finally {
      setSaving(false);
    }
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
          <h1>{channel.title}</h1>
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
            Cmd -1…-6 : quantités <strong>uniquement si le produit figure sur ce BL</strong> (sinon « — »).
            Après import PDF, Cmd -1 = colonne COMMANDE du BL le plus récent pour les lignes reconnues.
            Saisir le <strong>stock</strong> : conso = Cmd -1 − stock (ou quantité reçue du BL importé − stock).
            Colonne <strong>À cmd</strong> = ce que vous commandez cette semaine (0 si rien à commander).
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
                {channel.showPositive ? (
                  <button type="button" className="btn btn-secondary" onClick={applyPositive} disabled={saving}>
                    Stocks Positive
                  </button>
                ) : null}
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={openEmployeeStockImport}
                  disabled={saving}
                >
                  Importer stocks salarié
                </button>
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
                    Produits par emplacement — historique BL (Cmd -1 à -6). Quatre cases vides à droite : stock
                    constaté en magasin sur 4 semaines consécutives. Cmd -1 = quantité du dernier BL reçu.
                    Références : {cmdColumnLabels.map((c) => c.full).join(', ')}.
                  </p>
                ) : null}
              </div>

              <div
                className={`commande-tgt-modele-print print-only${printMode === 'modele' ? '' : ' commande-tgt-modele-print--hidden'}`}
                aria-hidden={printMode !== 'modele'}
              >
                {groupedLines.map(([locName, group]) => (
                  <section key={`print-${locName}`} className="modele-print-section">
                    <h3 className="modele-print-loc">{locName}</h3>
                    <div className="modele-print-columns">
                      {group.map((line) => (
                        <div key={`p-${line.productId}`} className="modele-print-item">
                          <span className="modele-print-name">{line.productName}</span>
                          <ModelePrintHistory line={line} cmdColumnLabels={cmdColumnLabels} />
                          <span className="modele-print-boxes" title="Stock magasin — 4 semaines">
                            {[0, 1, 2, 3].map((n) => (
                              <span key={n} className="modele-print-stock-box" aria-hidden="true" />
                            ))}
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
                              <td className="col-num col-saisie col-stock">
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
                                {employeeStockImports.length > 0 ? (
                                  <div
                                    className="stock-import-dates no-print"
                                    title="Imports stocks salariés cumulés"
                                  >
                                    {employeeStockImports.map((imp) => imp.dateLabel).join(' · ')}
                                  </div>
                                ) : null}
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
                  liste. Les lignes en <strong className="config-no-location-label">rouge</strong> n’ont pas
                  d’emplacement défini (y compris « — emplacement — » ou « -Emplacement- ») — elles sont listées en
                  premier.
                  {configNoLocationCount > 0 ? (
                    <>
                      {' '}
                      <strong>{configNoLocationCount}</strong> produit
                      {configNoLocationCount > 1 ? 's' : ''} à compléter.
                    </>
                  ) : null}
                </p>
                {configProductsSorted.map(({ p, idx }) => {
                  const isActive = p.isActive !== false;
                  const locationSelectValue =
                    resolveProductLocationId(p) ||
                    (p.locationName && !isPlaceholderLocationName(p.locationName)
                      ? locations.find((l) => l.name === p.locationName)?._id
                      : null) ||
                    '';
                  const hasNoLocation = isActive && !hasProductLocation(p, locations);
                  return (
                    <div
                      className={`config-row config-row-product${isActive ? '' : ' config-row-product--inactive'}${
                        hasNoLocation ? ' config-row-product--no-location' : ''
                      }`}
                      key={p._id || `new-p-${idx}`}
                    >
                      {channel.showProductOrderControls ? (
                        <div className="config-order-btns">
                          <button
                            type="button"
                            className="btn btn-secondary btn-order-move"
                            title="Monter"
                            disabled={idx === 0}
                            onClick={() => moveProduct(idx, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-order-move"
                            title="Descendre"
                            disabled={idx >= products.length - 1}
                            onClick={() => moveProduct(idx, 1)}
                          >
                            ↓
                          </button>
                        </div>
                      ) : null}
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
                        value={locationSelectValue ? String(locationSelectValue) : ''}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          const loc = locations.find((l) => v && String(l._id) === String(v));
                          setProducts((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, locationId: v, locationName: loc?.name || '' }
                                : x
                            )
                          );
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

              {channel.showSeedArras ? (
                <div className="config-block">
                  <h3>Catalogue Arras (PDF analysés)</h3>
                  <p className="commande-tgt-hint">126 produits extraits des 6 BL Transgourmet (avril–mai 2026).</p>
                  {siteKey === 'plan' ? (
                    <button type="button" className="btn btn-primary" onClick={seedArrasCatalog} disabled={saving}>
                      Charger le catalogue TGT Arras
                    </button>
                  ) : (
                    <p className="commande-tgt-hint">Disponible sur le site Arras (/plan).</p>
                  )}
                </div>
              ) : null}

              {channelKey === 'MILLANGE' && siteKey === 'plan' ? (
                <div className="config-block">
                  <h3>Catalogue Mill&apos;Ange</h3>
                  <p className="commande-tgt-hint">
                    37 produits issus des 4 derniers BL (mai 2026). Utilisez les flèches pour définir l&apos;ordre
                    d&apos;affichage, puis « Enregistrer produits ».
                  </p>
                  <button type="button" className="btn btn-primary" onClick={seedMillangeCatalog} disabled={saving}>
                    Charger le catalogue Mill&apos;Ange
                  </button>
                </div>
              ) : null}

              <div className="config-block">
                <h3>Saisie stocks {channel.stockScheduleMenuLabel} — jours obligatoires</h3>
                <p className="commande-tgt-hint">
                  Jours où les salariés doivent envoyer les stocks magasin (menu {channel.stockScheduleMenuLabel}).
                  Le tableau de bord affiche la dernière saisie en vert si elle est à jour, en rouge dès qu’une
                  saisie est attendue. Configuration enregistrée pour le fournisseur {supplier}.
                </p>
                <div className="tgt-stock-days-grid">
                  {TGT_STOCK_DAY_LABELS.map((label, dayNum) => (
                    <label key={label} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={tgtStockSubmissionDays.includes(dayNum)}
                        onChange={() => toggleTgtStockDay(dayNum)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <button type="button" className="btn btn-primary" onClick={saveTgtStockSchedule} disabled={saving}>
                  Enregistrer les jours de saisie
                </button>
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

      {stockImportModalOpen && (
        <div
          className="commande-tgt-modal-overlay no-print"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stock-import-modal-title"
          onClick={() => !saving && setStockImportModalOpen(false)}
        >
          <div className="commande-tgt-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="stock-import-modal-title">Importer stocks salarié</h3>
            <p className="commande-tgt-hint">
              Cochez un ou plusieurs envois depuis le menu {channel.stockScheduleMenuLabel}. Les quantités sont
              cumulées (ex. 0 puis 1 = 1).
            </p>
            {stockImportLoading ? (
              <p>Chargement des imports…</p>
            ) : stockImportEntries.length === 0 ? (
              <p className="commande-tgt-hint">
                Aucun import {channel.stockScheduleMenuLabel} enregistré pour le moment.
              </p>
            ) : (
              <ul className="stock-import-list">
                {stockImportEntries.map((entry) => {
                  const id = String(entry._id);
                  return (
                    <li key={id}>
                      <label className="stock-import-item">
                        <input
                          type="checkbox"
                          checked={selectedStockEntryIds.includes(id)}
                          onChange={() => toggleStockEntrySelection(id)}
                          disabled={saving}
                        />
                        <span>
                          <strong>{formatDate(entry.createdAt)}</strong>
                          {' — '}
                          {entry.employeeName || 'Salarié'}
                          {' · '}
                          {entry.itemsCount ?? 0} produit(s)
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="commande-tgt-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStockImportModalOpen(false)}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={applyEmployeeStocks}
                disabled={saving || stockImportLoading || !selectedStockEntryIds.length}
              >
                {saving ? 'Application…' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandeTGT;
