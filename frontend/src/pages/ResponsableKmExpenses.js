import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './ResponsableKmExpenses.css';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const roundEuro = (n) => Math.round((Number(n) || 0) * 100) / 100;

const ResponsableKmExpenses = () => {
  const site = window.location.pathname.startsWith('/lon') ? 'longuenesse' : 'arras';
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tripTypes, setTripTypes] = useState([]);
  const [editingTrip, setEditingTrip] = useState({}); // { id: { displayName?, km? } }
  const [grid, setGrid] = useState({});
  const [tollAmountTTC, setTollAmountTTC] = useState(0);
  const [tollAmountHT, setTollAmountHT] = useState(0);
  const [diversComments, setDiversComments] = useState('');
  const [tauxKm, setTauxKm] = useState(0.47);
  const [daysInMonth, setDaysInMonth] = useState(31);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Modal Paramètres péage
  const [showParamsModal, setShowParamsModal] = useState(false);
  const [entreePeage, setEntreePeage] = useState('');
  const [sortiePeage, setSortiePeage] = useState('');
  const [kmBoulangerie, setKmBoulangerie] = useState(50);
  const [savingParams, setSavingParams] = useState(false);

  // Modal réconciliation import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importFile, setImportFile] = useState(null); // Fichier PDF pour stockage NAS à la confirmation
  const [importTotalTTC, setImportTotalTTC] = useState(0);
  const [refusedIndexes, setRefusedIndexes] = useState(new Set());
  const [confirmingImport, setConfirmingImport] = useState(false);

  // Facture PDF stockée (pour bouton télécharger)
  const [tollPdfPath, setTollPdfPath] = useState('');

  // Déplacements en attente (mobile)
  const [pendingDisplacements, setPendingDisplacements] = useState(0);
  const [integrating, setIntegrating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseRes, tauxRes, pendingRes] = await Promise.all([
        api.get(`/responsable-km/expense?site=${site}&month=${month}&year=${year}`),
        api.get(`/responsable-km/taux-km?site=${site}&year=${year}`),
        api.get(`/responsable-km/pending-displacements?site=${site}&month=${month}&year=${year}`).catch(() => ({ data: { data: [] } }))
      ]);
      const pending = pendingRes.data?.data || [];
      setPendingDisplacements(pending.length);
      const d = expenseRes.data?.data;
      const t = tauxRes.data?.data;
      if (d) {
        setTripTypes(d.tripTypes || []);
        setEditingTrip({});
        setGrid(d.grid || {});
        setTollAmountTTC(roundEuro(d.tollAmountTTC || 0));
        setTollAmountHT(roundEuro(d.tollAmountHT || 0));
        setDiversComments(d.diversComments || '');
        setTollPdfPath(d.tollPdfPath || '');
        setDaysInMonth(d.daysInMonth || new Date(year, month, 0).getDate());
      }
      if (t?.tauxKm !== undefined) setTauxKm(t.tauxKm);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [site, month, year]);

  const fetchPeageParams = useCallback(async () => {
    try {
      const res = await api.get(`/responsable-km/peage-params?site=${site}`);
      const d = res.data?.data;
      if (d) {
        setEntreePeage(d.entreePeage || '');
        setSortiePeage(d.sortiePeage || '');
        setKmBoulangerie(d.kmBoulangerie ?? 50);
      }
    } catch (e) {
      console.warn('Paramètres péage:', e);
    }
  }, [site]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [diversPresets, setDiversPresets] = useState([]);
  const [newDiversName, setNewDiversName] = useState('');
  const [newDiversKm, setNewDiversKm] = useState('');

  useEffect(() => {
    if (showParamsModal) {
      fetchPeageParams();
      api.get(`/responsable-km/divers-presets?site=${site}`).then(r => setDiversPresets(r.data?.data || [])).catch(() => {});
    }
  }, [showParamsModal, fetchPeageParams, site]);

  const toKey = (id) => (id && typeof id === 'object' && typeof id.toString === 'function') ? id.toString() : String(id ?? '');

  const handleToggle = (tripTypeId, day) => {
    const key = toKey(tripTypeId);
    setGrid(prev => {
      const next = { ...prev };
      if (!next[key]) next[key] = {};
      const current = next[key][day] || 0;
      next[key] = { ...next[key], [day]: current ? 0 : 1 };
      return next;
    });
  };

  const handleKmPerDayChange = (tripTypeId, day, value) => {
    const key = toKey(tripTypeId);
    const v = parseFloat(value) || 0;
    setGrid(prev => {
      const next = { ...prev };
      if (!next[key]) next[key] = {};
      next[key] = { ...next[key], [day]: v };
      return next;
    });
  };

  const handleDiversKmChange = (day, value) => {
    const diversType = tripTypes.find(t => t.name === 'divers');
    if (!diversType) return;
    handleKmPerDayChange(diversType._id, day, value);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleIntegrateDisplacements = async () => {
    if (pendingDisplacements === 0) return;
    setIntegrating(true);
    try {
      await api.post('/responsable-km/integrate-displacements', { site, month, year });
      toast.success('Déplacements intégrés');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur intégration');
    } finally {
      setIntegrating(false);
    }
  };

  const basePath = window.location.pathname.startsWith('/lon') ? '/lon' : '/plan';

  const handleUpdateTripType = async (tripTypeId, field, value) => {
    const id = toKey(tripTypeId);
    try {
      const payload = field === 'displayName' ? { displayName: String(value || '').trim() } : { km: parseFloat(value) || 0 };
      await api.patch(`/responsable-km/trip-types/${id}`, payload);
      setEditingTrip(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast.success('Modification enregistrée');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const handleDeleteTripType = async (tripTypeId) => {
    if (!window.confirm('Supprimer cette ligne à partir de ce mois ? Les données des mois passés seront conservées.')) return;
    try {
      const m = month || new Date().getMonth() + 1;
      const y = year || new Date().getFullYear();
      await api.delete(`/responsable-km/trip-types/${tripTypeId}`, { params: { month: m, year: y } });
      toast.success('Ligne supprimée à partir de ce mois');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const getDisplayValue = (t, field) => {
    const key = toKey(t._id);
    const ed = editingTrip[key];
    if (ed && ed[field] !== undefined) return ed[field];
    const val = t[field];
    return val !== undefined && val !== null ? val : (field === 'km' ? 0 : '');
  };

  const setEditingValue = (tripId, field, value) => {
    const key = toKey(tripId);
    setEditingTrip(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleTauxChange = async (value) => {
    const v = parseFloat(value) || 0.47;
    setTauxKm(v);
    try {
      await api.post('/responsable-km/taux-km', { site, year, tauxKm: v });
      toast.success('Taux km sauvegardé');
    } catch (e) {
      toast.error('Erreur sauvegarde taux');
    }
  };

  const savePeageParams = async () => {
    setSavingParams(true);
    try {
      await api.post('/responsable-km/peage-params', { site, entreePeage, sortiePeage, kmBoulangerie });
      toast.success('Paramètres péage sauvegardés');
      setShowParamsModal(false);
      fetchData();
    } catch (e) {
      toast.error('Erreur sauvegarde paramètres');
    } finally {
      setSavingParams(false);
    }
  };

  const saveDiversPreset = async (preset) => {
    try {
      await api.post('/responsable-km/divers-presets', { site, ...preset });
      toast.success('Divers enregistré');
      const r = await api.get(`/responsable-km/divers-presets?site=${site}`);
      setDiversPresets(r.data?.data || []);
    } catch (e) {
      toast.error('Erreur sauvegarde');
    }
  };

  const addNewDiversPreset = () => {
    if (!newDiversName.trim()) return;
    saveDiversPreset({ name: newDiversName.trim(), km: newDiversKm ? parseFloat(newDiversKm) : null });
    setNewDiversName('');
    setNewDiversKm('');
  };

  const saveExpense = async () => {
    setSaving(true);
    try {
      await api.post('/responsable-km/expense', {
        site,
        month,
        year,
        grid,
        tollAmountTTC,
        tollAmountHT,
        pdfImportedDates: [],
        diversComments
      });
      toast.success('Frais KM sauvegardés');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleImportPdf = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !file.name.endsWith('.pdf')) {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }
    setImporting(true);
    setImportFile(file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('site', site);
      formData.append('month', month);
      formData.append('year', year);
      const res = await api.post('/responsable-km/import-pdf', formData);
      const data = res.data?.data;
      setImportData(data);
      setImportTotalTTC(roundEuro(data?.totalTTC || 0));
      setRefusedIndexes(new Set());
      setShowImportModal(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur import PDF');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleRefuse = (idx) => {
    setRefusedIndexes(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const applyImport = async () => {
    if (!importData) return;
    setConfirmingImport(true);
    try {
      const refusedUnmatched = (importData.unmatched || [])
        .filter((_, i) => refusedIndexes.has(i))
        .map(u => ({ day: u.day, entry: u.entry, exit: u.exit, amountTTC: u.amountTTC || 0 }));

      const toImport = (importData.unmatched || [])
        .filter((_, i) => !refusedIndexes.has(i));

      const tollEntriesFromRecognized = (importData.recognizedDays || []).map(r => ({ day: r.day, count: r.count || 1 }));
      const tollEntries = tollEntriesFromRecognized;

      const deducted = refusedUnmatched.reduce((s, u) => s + (parseFloat(u.amountTTC) || 0), 0);
      const tollAmountToSave = roundEuro((importTotalTTC || importData.totalTTC || 0) - deducted);

      const formData = new FormData();
      if (importFile) formData.append('file', importFile);
      formData.append('site', site);
      formData.append('month', month);
      formData.append('year', year);
      formData.append('tollEntries', JSON.stringify(tollEntries));
      formData.append('tollAmountTTC', tollAmountToSave);
      formData.append('refusedUnmatched', JSON.stringify(refusedUnmatched));
      formData.append('unmatchedToImport', JSON.stringify(toImport.map(u => ({ day: u.day, entry: u.entry, exit: u.exit, amountTTC: u.amountTTC }))));

      const res = await api.post('/responsable-km/confirm-import-pdf', formData);

      const data = res.data?.data || {};
      toast.success(data.message || 'Import appliqué');
      if (!data.tollPdfStored && data.tollPdfError) {
        toast.warning(data.tollPdfError);
      }
      setShowImportModal(false);
      setImportData(null);
      setImportFile(null);
      setTollAmountTTC(tollAmountToSave);
      setTollAmountHT(roundEuro(tollAmountToSave / 1.2));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'application');
    } finally {
      setConfirmingImport(false);
    }
  };

  const downloadTollPdf = async () => {
    try {
      const res = await api.get(`/responsable-km/toll-pdf/${site}/${month}/${year}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-peage-${site}-${year}-${String(month).padStart(2, '0')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Facture téléchargée');
    } catch (e) {
      toast.error('Erreur téléchargement facture');
    }
  };

  const computeTotals = () => {
    let totalKm = 0;
    const byType = {};
    tripTypes.forEach(t => {
      const key = t._id.toString();
      const days = grid[key] || {};
      const isKmPerDay = t.name === 'divers' || t.isKmPerDay;
      let km;
      if (isKmPerDay) {
        km = Object.values(days).reduce((s, v) => s + (parseFloat(v) || 0), 0);
      } else {
        const count = Object.values(days).reduce((s, v) => s + (v || 0), 0);
        km = count * (t.km || 0);
      }
      byType[key] = { count: isKmPerDay ? '-' : Object.values(days).reduce((s, v) => s + (v || 0), 0), km };
      totalKm += km;
    });
    const totalEuros = totalKm * tauxKm;
    return { totalKm, totalEuros, byType };
  };

  const { totalKm, totalEuros, byType } = computeTotals();

  if (loading) {
    return (
      <div className="responsable-km fade-in">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="responsable-km fade-in">
      <div className="page-header">
        <h2>🚗 Frais KM Responsable – {site === 'longuenesse' ? 'Longuenesse' : 'Arras'}</h2>
        <span className="print-period" style={{ display: 'none' }}>
          {MONTHS[month - 1]} {year} – Taux : {tauxKm} €/km
        </span>
        <div className="header-actions">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="form-control">
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="form-control">
            {[year - 2, year - 1, year, year + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <label className="taux-km-label">
            Taux €/km :
            <input
              type="number"
              step="0.01"
              value={tauxKm}
              onChange={e => setTauxKm(parseFloat(e.target.value) || 0.47)}
              onBlur={e => handleTauxChange(e.target.value)}
              className="taux-input"
            />
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowParamsModal(true)}
          >
            ⚙️ Paramètres
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleImportPdf}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? '⏳ Import...' : '📄 Import PDF Bip&Go'}
          </button>
          {tollPdfPath ? (
            <button type="button" className="btn btn-outline" onClick={downloadTollPdf} title="Télécharger la facture PDF importée">
              📥 Télécharger facture
            </button>
          ) : (
            <span className="toll-pdf-hint" title="La facture sera disponible après un import PDF (stockage NAS)">📄 Facture : non stockée</span>
          )}
          <button className="btn btn-success" onClick={saveExpense} disabled={saving}>
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
          <button type="button" className="btn btn-outline" onClick={handlePrint}>
            🖨️ Imprimer
          </button>
          <a href={`${basePath}/deplacement-standalone.html`} className="btn btn-outline" target="_blank" rel="noopener noreferrer">
            📱 Saisie mobile
          </a>
          {pendingDisplacements > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleIntegrateDisplacements}
              disabled={integrating}
            >
              {integrating ? '⏳ Intégration...' : `📥 Intégrer (${pendingDisplacements})`}
            </button>
          )}
        </div>
      </div>

      {/* Modal Paramètres */}
      {showParamsModal && (
        <div className="modal-overlay" onClick={() => setShowParamsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>⚙️ Paramètres péage</h3>
            <p className="modal-hint">Définissez les noms des péages d'entrée et de sortie pour reconnaître les trajets professionnels. Aller = entrée→sortie, Retour = sortie→entrée. Le km définit la distance par trajet (aller ou retour).</p>
            <div className="modal-form">
              <label>
                Entrée Péage :
                <input
                  type="text"
                  value={entreePeage}
                  onChange={e => setEntreePeage(e.target.value)}
                  placeholder="ex: BETHUNE"
                />
              </label>
              <label>
                Sortie Péage :
                <input
                  type="text"
                  value={sortiePeage}
                  onChange={e => setSortiePeage(e.target.value)}
                  placeholder="ex: AIRE SUR LA LYS"
                />
              </label>
              <label>
                Km (par trajet aller/retour) :
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={kmBoulangerie}
                  onChange={e => setKmBoulangerie(parseFloat(e.target.value) || 50)}
                  placeholder="ex: 50"
                />
              </label>
            </div>
            <div className="modal-form divers-presets-section">
              <h4>Divers prédéfinis</h4>
              <p className="modal-hint">Définissez des types de déplacements divers avec leur km (ou laissez vide pour « à définir »).</p>
              {diversPresets.map(p => (
                <div key={p._id} className="divers-preset-row">
                  <input type="text" value={p.name} readOnly className="preset-name" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="km"
                    defaultValue={p.km}
                    onBlur={e => {
                      const v = e.target.value;
                      if (v !== String(p.km ?? '')) saveDiversPreset({ _id: p._id, name: p.name, km: v ? parseFloat(v) : null });
                    }}
                    className="preset-km"
                  />
                </div>
              ))}
              <div className="divers-preset-row divers-add">
                <input
                  type="text"
                  value={newDiversName}
                  onChange={e => setNewDiversName(e.target.value)}
                  placeholder="Nouveau divers"
                  className="preset-name"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newDiversKm}
                  onChange={e => setNewDiversKm(e.target.value)}
                  placeholder="km"
                  className="preset-km"
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={addNewDiversPreset}>Ajouter</button>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowParamsModal(false)}>Annuler</button>
              <button className="btn btn-success" onClick={savePeageParams} disabled={savingParams}>
                {savingParams ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Réconciliation Import */}
      {showImportModal && importData && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content modal-import" onClick={e => e.stopPropagation()}>
            <h3>📄 Réconciliation import PDF</h3>
            {importData.formatRecap && importData.message && (
              <p className="import-format-recap">{importData.message}</p>
            )}
            <div className="import-summary">
              <p><strong>Reconnus :</strong> {importData.allerCount || 0} aller, {importData.allerRetourCount || 0} aller-retour</p>
              <p>
                <strong>Total facture TTC :</strong>{' '}
                <input
                  type="number"
                  step="0.01"
                  value={importTotalTTC}
                  onChange={e => setImportTotalTTC(roundEuro(parseFloat(e.target.value) || 0))}
                  className="import-total-input"
                  title="Corrigez si le PDF n'a pas extrait le bon montant"
                />
                {' €'}
                {importData.totalTTC != null && Math.abs(roundEuro(importData.totalTTC) - importTotalTTC) > 0.01 && (
                  <span className="import-original"> (PDF: {importData.totalTTC?.toFixed(2)} €)</span>
                )}
              </p>
              {(() => {
                const totalFacture = importTotalTTC || importData.totalTTC || 0;
                const refusedAmount = (importData.unmatched || []).filter((_, i) => refusedIndexes.has(i)).reduce((s, u) => s + (parseFloat(u.amountTTC) || 0), 0);
                const netAmount = roundEuro(totalFacture - refusedAmount);
                return (
                  <>
                    {refusedIndexes.size > 0 && (
                      <p className="import-deducted"><strong>Péages refusés (TTC) :</strong> {refusedAmount.toFixed(2)} €</p>
                    )}
                    <p className="import-net"><strong>Péage à déclarer (TTC) :</strong> {netAmount.toFixed(2)} €</p>
                  </>
                );
              })()}
            </div>
            {importData.rawText && (importData.allerCount === 0 && importData.allerRetourCount === 0) && (
              <details className="import-debug">
                <summary>🔍 Texte brut extrait du PDF (debug)</summary>
                <pre className="import-raw-text">{importData.rawText}</pre>
              </details>
            )}
            {importData.unmatched && importData.unmatched.length > 0 && (
              <div className="import-unmatched">
                <h4>Trajets non reconnus (entrée/sortie ≠ paramètres)</h4>
                <p className="modal-hint">Cochez "Refuser l'import" pour les déplacements personnels. Le montant TTC sera déduit du péage total. Les trajets non refusés créeront une ligne dans le tableau pour saisir les km à la date du déplacement.</p>
                <table className="unmatched-table">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Entrée</th>
                      <th>Sortie</th>
                      <th>Montant TTC</th>
                      <th>Refuser l'import</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.unmatched.map((u, idx) => (
                      <tr key={idx}>
                        <td>{u.day}</td>
                        <td>{u.entry || '–'}</td>
                        <td>{u.exit || '–'}</td>
                        <td>{u.amountTTC ? `${u.amountTTC.toFixed(2)} €` : '–'}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={refusedIndexes.has(idx)}
                            onChange={() => toggleRefuse(idx)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {refusedIndexes.size > 0 && (
                  <p className="voyage-deducted">
                    Voyage(s) déduit(s) (TTC) : {importData.unmatched
                      .filter((_, i) => refusedIndexes.has(i))
                      .reduce((s, u) => s + (parseFloat(u.amountTTC) || 0), 0).toFixed(2)} €
                  </p>
                )}
              </div>
            )}
            {importFile ? (
              <p className="modal-hint" style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>
                📄 Fichier joint : {importFile.name} (la facture sera stockée sur le NAS)
              </p>
            ) : (
              <p className="modal-hint" style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#c00' }}>
                ⚠️ Aucun fichier PDF joint. Fermez et refaites l'import PDF pour stocker la facture.
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowImportModal(false)}>Annuler</button>
              <button className="btn btn-success" onClick={applyImport} disabled={confirmingImport}>
                {confirmingImport ? 'Application...' : 'Appliquer l\'import'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="peage-section card">
        <h3>Péage autoroute</h3>
        <div className="peage-fields">
          <label>TTC : <input type="number" step="0.01" value={roundEuro(tollAmountTTC)} onChange={e => setTollAmountTTC(roundEuro(parseFloat(e.target.value) || 0))} /> €</label>
          <label>HT : <input type="number" step="0.01" value={roundEuro(tollAmountHT)} onChange={e => setTollAmountHT(roundEuro(parseFloat(e.target.value) || 0))} /> €</label>
          {tollPdfPath && (
            <button type="button" className="btn btn-outline" onClick={downloadTollPdf} title="Télécharger la facture PDF">
              📥 Télécharger facture
            </button>
          )}
        </div>
      </div>

      <div className="table-container card" id="km-table-print">
        <table className="responsable-km-table">
          <thead>
            <tr>
              <th className="trip-col">Déplacement</th>
              <th className="km-col">Km</th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i} className="day-col">{i + 1}</th>
              ))}
              <th className="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            {tripTypes.map(t => {
              const key = t._id.toString();
              const days = grid[key] || {};
              const isKmPerDay = t.name === 'divers' || t.isKmPerDay;
              const km = isKmPerDay
                ? Object.values(days).reduce((s, v) => s + (parseFloat(v) || 0), 0)
                : Object.values(days).reduce((s, v) => s + (v || 0), 0) * (t.km || 0);
              return (
                <tr key={t._id} className={[t.isBoulangerie && 'boulangerie-row', isKmPerDay && 'divers-row', t.isKmPerDay && t.name !== 'divers' && 'peage-import-row'].filter(Boolean).join(' ')}>
                  <td className="trip-cell" onClick={e => e.stopPropagation()}>
                    <span className="trip-cell-content">
                      <input
                        type="text"
                        value={getDisplayValue(t, 'displayName')}
                        onChange={e => setEditingValue(t._id, 'displayName', e.target.value)}
                        onBlur={e => {
                          const v = e.target.value.trim();
                          if (v && v !== (t.displayName || '')) handleUpdateTripType(t._id, 'displayName', v);
                        }}
                        className="trip-name-input"
                        autoComplete="off"
                      />
                      {t.name && t.name.startsWith('peage-import-') && (
                        <button
                          type="button"
                          className="btn-delete-row"
                          onClick={() => handleDeleteTripType(t._id)}
                          title="Supprimer cette ligne"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  </td>
                  <td className="km-cell" onClick={e => e.stopPropagation()}>
                    {!isKmPerDay && (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={getDisplayValue(t, 'km')}
                        onChange={e => {
                          const raw = e.target.value;
                          setEditingValue(t._id, 'km', raw === '' ? '' : (parseFloat(raw) || 0));
                        }}
                        onBlur={e => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v) && v >= 0 && v !== (t.km ?? 0)) handleUpdateTripType(t._id, 'km', v);
                        }}
                        className="km-input"
                        autoComplete="off"
                      />
                    )}
                    {isKmPerDay && <span className="divers-km-label">–</span>}
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    if (isKmPerDay) {
                      const kmVal = days[d] || 0;
                      const isSameMonthAsImport = t.importMonth === month && t.importYear === year;
                      const isImportDay = isSameMonthAsImport && Array.isArray(t.importDays) && t.importDays.includes(d);
                      const hasValue = (parseFloat(kmVal) || 0) > 0;
                      return (
                        <td key={d} className={`day-cell ${isImportDay ? 'peage-import-day-cell' : ''} ${hasValue ? 'divers-cell-filled' : ''}`} onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={kmVal}
                            onChange={e => handleKmPerDayChange(t._id, d, e.target.value)}
                            className={`divers-day-input ${isImportDay ? 'peage-import-day-input' : ''}`}
                            placeholder="0"
                            title={isImportDay ? `Jour ${d} : passage facturé sur la feuille import` : ''}
                          />
                        </td>
                      );
                    }
                    const checked = !!(days[d]);
                    return (
                      <td key={d} className="day-cell">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggle(t._id, d)}
                        />
                      </td>
                    );
                  })}
                  <td className="total-cell">{km} km</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tripTypes.some(t => t.name === 'divers') && (
          <div className="divers-comments-section">
            <label>
              <strong>Commentaire Divers :</strong>
              <textarea
                value={diversComments}
                onChange={e => setDiversComments(e.target.value)}
                placeholder="Détail des déplacements divers (ex: jour 5 = livraison client X, jour 12 = formation...)"
                rows={3}
                className="divers-comments-input"
              />
            </label>
          </div>
        )}
      </div>

      <div className="summary card">
        <h3>Récapitulatif</h3>
        <p><strong>Total KM :</strong> {totalKm} km</p>
        <p><strong>Montant KM :</strong> {totalEuros.toFixed(2)} € (à {tauxKm} €/km)</p>
        <p><strong>Péage TTC :</strong> {roundEuro(tollAmountTTC).toFixed(2)} €</p>
        <p><strong>Total à déclarer :</strong> {roundEuro(totalEuros + tollAmountTTC).toFixed(2)} €</p>
      </div>
    </div>
  );
};

export default ResponsableKmExpenses;
