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
  const [grid, setGrid] = useState({});
  const [tollAmountTTC, setTollAmountTTC] = useState(0);
  const [tollAmountHT, setTollAmountHT] = useState(0);
  const [tauxKm, setTauxKm] = useState(0.47);
  const [daysInMonth, setDaysInMonth] = useState(31);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      toast.success(res.data?.data?.message || 'Import réussi');
      setTollAmountTTC(res.data?.data?.amountTTC || 0);
      setTollAmountHT(Math.round((res.data?.data?.amountTTC || 0) / 1.2 * 100) / 100);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur import PDF');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      if (!t.isToll) totalKm += km;
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
            {tripTypes.filter(t => !t.isToll).map(t => {
              const key = t._id.toString();
              const days = grid[key] || {};
              const count = Object.values(days).reduce((s, v) => s + (v || 0), 0);
              const km = count * (t.km || 0);
              return (
                <tr key={t._id}>
                  <td className="trip-cell">{t.displayName}</td>
                  <td className="km-cell">{t.km}</td>
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
            {tripTypes.filter(t => t.isToll).map(t => {
              const key = t._id.toString();
              const days = grid[key] || {};
              const count = Object.values(days).reduce((s, v) => s + (v || 0), 0);
              return (
                <tr key={t._id} className="toll-row">
                  <td className="trip-cell">{t.displayName}</td>
                  <td className="km-cell">–</td>
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
                  <td className="total-cell">{count} passage(s)</td>
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
