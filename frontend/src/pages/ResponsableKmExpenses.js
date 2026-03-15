import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './ResponsableKmExpenses.css';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const ResponsableKmExpenses = () => {
  const site = window.location.pathname.startsWith('/lon') ? 'longuenesse' : 'arras';
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tripTypes, setTripTypes] = useState([]);
  const [editingTrip, setEditingTrip] = useState({}); // { id: { displayName?, km? } }
  const [grid, setGrid] = useState({});
  const [tollAmountTTC, setTollAmountTTC] = useState(0);
  const [tollAmountHT, setTollAmountHT] = useState(0);
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
  const [refusedIndexes, setRefusedIndexes] = useState(new Set());
  const [confirmingImport, setConfirmingImport] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseRes, tauxRes] = await Promise.all([
        api.get(`/responsable-km/expense?site=${site}&month=${month}&year=${year}`),
        api.get(`/responsable-km/taux-km?site=${site}&year=${year}`)
      ]);
      const d = expenseRes.data?.data;
      const t = tauxRes.data?.data;
      if (d) {
        setTripTypes(d.tripTypes || []);
        setEditingTrip({});
        setGrid(d.grid || {});
        setTollAmountTTC(d.tollAmountTTC || 0);
        setTollAmountHT(d.tollAmountHT || 0);
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

  useEffect(() => {
    if (showParamsModal) fetchPeageParams();
  }, [showParamsModal, fetchPeageParams]);

  const handleToggle = (tripTypeId, day) => {
    const key = tripTypeId.toString();
    setGrid(prev => {
      const next = { ...prev };
      if (!next[key]) next[key] = {};
      const current = next[key][day] || 0;
      next[key] = { ...next[key], [day]: current ? 0 : 1 };
      return next;
    });
  };

  const handleUpdateTripType = async (tripTypeId, field, value) => {
    try {
      const id = tripTypeId?.toString?.() || tripTypeId;
      const payload = field === 'displayName' ? { displayName: value } : { km: parseFloat(value) || 0 };
      await api.patch(`/responsable-km/trip-types/${id}`, payload);
      setEditingTrip(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast.success('Modification enregistrée');
      fetchData();
    } catch (e) {
      toast.error('Erreur lors de la modification');
    }
  };

  const getDisplayValue = (t, field) => {
    const key = t._id?.toString?.() || t._id;
    const ed = editingTrip[key];
    if (ed && ed[field] !== undefined) return ed[field];
    return t[field];
  };

  const setEditingValue = (tripId, field, value) => {
    const key = tripId?.toString?.() || tripId;
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
        pdfImportedDates: []
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
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('site', site);
      formData.append('month', month);
      formData.append('year', year);
      const res = await api.post('/responsable-km/import-pdf', formData);
      const data = res.data?.data;
      setImportData(data);
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

      const tollEntriesFromUnmatched = toImport.map(u => ({ day: u.day, count: 1 }));
      const tollEntriesFromRecognized = (importData.recognizedDays || []).map(r => ({ day: r.day, count: r.count || 1 }));
      const tollEntries = [...tollEntriesFromRecognized, ...tollEntriesFromUnmatched];

      const deducted = refusedUnmatched.reduce((s, u) => s + (parseFloat(u.amountTTC) || 0), 0);
      const tollAmountToSave = (importData.totalTTC || 0) - deducted;

      await api.post('/responsable-km/confirm-import-pdf', {
        site,
        month,
        year,
        tollEntries,
        tollAmountTTC: tollAmountToSave,
        refusedUnmatched
      });

      toast.success(importData.message || 'Import appliqué');
      setShowImportModal(false);
      setImportData(null);
      setTollAmountTTC(tollAmountToSave);
      setTollAmountHT(Math.round(tollAmountToSave / 1.2 * 100) / 100);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'application');
    } finally {
      setConfirmingImport(false);
    }
  };

  const computeTotals = () => {
    let totalKm = 0;
    const byType = {};
    tripTypes.forEach(t => {
      const key = t._id.toString();
      const days = grid[key] || {};
      let count = 0;
      Object.values(days).forEach(v => { count += v || 0; });
      const km = count * (t.km || 0);
      byType[key] = { count, km };
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
          <button className="btn btn-success" onClick={saveExpense} disabled={saving}>
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
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
            <div className="import-summary">
              <p><strong>Reconnus :</strong> {importData.allerCount || 0} aller, {importData.allerRetourCount || 0} aller-retour</p>
              <p><strong>Total facture :</strong> {importData.totalTTC?.toFixed(2) || '0'} €</p>
            </div>
            {importData.unmatched && importData.unmatched.length > 0 && (
              <div className="import-unmatched">
                <h4>Trajets non reconnus (entrée/sortie ≠ paramètres)</h4>
                <p className="modal-hint">Cochez "Refuser l'import" pour les déplacements personnels. Le montant sera déduit du péage total.</p>
                <table className="unmatched-table">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Entrée</th>
                      <th>Sortie</th>
                      <th>Montant</th>
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
                    Voyage(s) déduit(s) : {importData.unmatched
                      .filter((_, i) => refusedIndexes.has(i))
                      .reduce((s, u) => s + (parseFloat(u.amountTTC) || 0), 0).toFixed(2)} €
                  </p>
                )}
              </div>
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
          <label>TTC : <input type="number" step="0.01" value={tollAmountTTC} onChange={e => setTollAmountTTC(parseFloat(e.target.value) || 0)} /> €</label>
          <label>HT : <input type="number" step="0.01" value={tollAmountHT} onChange={e => setTollAmountHT(parseFloat(e.target.value) || 0)} /> €</label>
        </div>
      </div>

      <div className="table-container card">
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
              const count = Object.values(days).reduce((s, v) => s + (v || 0), 0);
              const km = count * (t.km || 0);
              return (
                <tr key={t._id} className={t.isBoulangerie ? 'boulangerie-row' : ''}>
                  <td className="trip-cell">
                    <input
                      type="text"
                      value={getDisplayValue(t, 'displayName')}
                      onChange={e => setEditingValue(t._id, 'displayName', e.target.value)}
                      onBlur={e => {
                        const v = e.target.value.trim();
                        if (v && v !== t.displayName) handleUpdateTripType(t._id, 'displayName', v);
                      }}
                      className="trip-name-input"
                    />
                  </td>
                  <td className="km-cell">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={getDisplayValue(t, 'km')}
                      onChange={e => setEditingValue(t._id, 'km', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      onBlur={e => {
                        const v = parseFloat(e.target.value) || 0;
                        if (!isNaN(v) && v !== t.km) handleUpdateTripType(t._id, 'km', v);
                      }}
                      className="km-input"
                    />
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
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
      </div>

      <div className="summary card">
        <h3>Récapitulatif</h3>
        <p><strong>Total KM :</strong> {totalKm} km</p>
        <p><strong>Montant KM :</strong> {totalEuros.toFixed(2)} € (à {tauxKm} €/km)</p>
        <p><strong>Péage TTC :</strong> {tollAmountTTC.toFixed(2)} €</p>
        <p><strong>Total à déclarer :</strong> {(totalEuros + tollAmountTTC).toFixed(2)} €</p>
      </div>
    </div>
  );
};

export default ResponsableKmExpenses;
