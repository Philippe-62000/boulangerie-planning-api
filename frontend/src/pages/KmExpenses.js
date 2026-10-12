import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './KmExpenses.css';

const KmExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [pendingCount, setPendingCount] = useState(0);
  const [showPending, setShowPending] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [edits, setEdits] = useState({});
  const [busyId, setBusyId] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/km-expenses?month=${month}&year=${year}`);
      setExpenses(response.data.employees || []);
      setParameters(response.data.parameters || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des frais KM:', error);
      toast.error('Erreur lors du chargement des frais KM');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await api.get('/km-expenses/requests/pending-count');
      setPendingCount(response.data.count || 0);
    } catch (error) {
      console.warn('Compteur KM à valider:', error.response?.status || error.message);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    setPendingLoading(true);
    try {
      const response = await api.get('/km-expenses/requests?status=pending');
      const groups = response.data.grouped || [];
      setPendingGroups(groups);
      const nextEdits = {};
      groups.forEach((group) => {
        (group.requests || []).forEach((request) => {
          nextEdits[request._id] = {
            tripDate: request.tripDate,
            parameterId: String(request.parameterId || ''),
            remark: request.remark || ''
          };
        });
      });
      setEdits(nextEdits);
      setPendingCount(response.data.count || 0);
    } catch (error) {
      console.error('❌ Erreur demandes KM à valider:', error);
      toast.error('Erreur lors du chargement des demandes KM');
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchPendingCount();
  }, [fetchExpenses, fetchPendingCount]);

  useEffect(() => {
    if (showPending) {
      fetchPendingRequests();
    }
  }, [showPending, fetchPendingRequests]);

  const handleCountChange = (employeeIndex, parameterIndex, value) => {
    const newExpenses = [...expenses];
    const employee = newExpenses[employeeIndex];
    const parameter = employee.parameterValues[parameterIndex];
    const currentParam = parameters.find(p => p._id.toString() === parameter.parameterId.toString());
    const kmValue = currentParam ? currentParam.kmValue : parameter.kmValue;

    parameter.count = parseInt(value) || 0;
    parameter.kmValue = kmValue;
    parameter.totalKm = parameter.count * kmValue;
    employee.totalKm = employee.parameterValues.reduce((total, param) => total + param.totalKm, 0);

    setExpenses(newExpenses);
  };

  const saveExpenses = async () => {
    setSaving(true);
    try {
      await api.post('/km-expenses/batch', {
        month,
        year,
        expenses: expenses.map(expense => ({
          employeeId: expense.employeeId,
          employeeName: expense.employeeName,
          parameterValues: expense.parameterValues
        }))
      });

      toast.success('Frais KM sauvegardés avec succès');
      fetchExpenses();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des frais KM');
    } finally {
      setSaving(false);
    }
  };

  const updateEdit = (id, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const payloadFor = (id) => {
    const edit = edits[id] || {};
    return {
      tripDate: edit.tripDate,
      parameterId: edit.parameterId,
      remark: edit.remark
    };
  };

  const handleValidate = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/km-expenses/requests/${id}/validate`, payloadFor(id));
      toast.success('Demande validée et reportée dans la grille');
      await fetchPendingRequests();
      await fetchExpenses();
      await fetchPendingCount();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Refuser cette demande de frais kilométriques ?')) {
      return;
    }
    setBusyId(id);
    try {
      await api.post(`/km-expenses/requests/${id}/reject`);
      toast.success('Demande refusée');
      await fetchPendingRequests();
      await fetchPendingCount();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setBusyId(null);
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1];
  };

  if (loading) {
    return (
      <div className="km-expenses fade-in">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading"></div>
            <p>Chargement des frais KM...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="km-expenses fade-in">
      <div className="page-header">
        <div className="header-left">
          <h2>🚗 Frais KM - {getMonthName(month)} {year}</h2>
          <div className="header-actions">
            <div className="date-selector">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="form-control"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="form-control"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const yearOption = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}
                    </option>
                  );
                })}
              </select>
              <button
                className="btn btn-success"
                onClick={saveExpenses}
                disabled={saving}
              >
                {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
              </button>
              <button
                type="button"
                className="btn btn-warning km-pending-btn"
                onClick={() => setShowPending(true)}
              >
                KM à valider
                {pendingCount > 0 && (
                  <span className="km-pending-badge">{pendingCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="km-expenses-table">
            <thead>
              <tr>
                <th className="employee-column">Salarié</th>
                {parameters.map((param) => (
                  <th key={param._id} className="param-column" title={`${param.displayName} (${param.kmValue} km)`}>
                    <div className="param-header">
                      <div className="param-name">{param.displayName}</div>
                      <div className="param-km">({param.kmValue} km)</div>
                    </div>
                  </th>
                ))}
                <th className="total-column">Total KM</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((employee, employeeIndex) => (
                <tr key={employee.employeeId}>
                  <td className="employee-cell">
                    <strong>{employee.employeeName}</strong>
                  </td>
                  {employee.parameterValues.map((paramValue, paramIndex) => (
                    <td key={paramValue.parameterId} className="param-cell">
                      <input
                        type="number"
                        value={paramValue.count}
                        onChange={(e) => handleCountChange(employeeIndex, paramIndex, e.target.value)}
                        min="0"
                        className="count-input"
                        placeholder="0"
                      />
                      <div className="param-total">
                        {paramValue.totalKm} km
                      </div>
                    </td>
                  ))}
                  <td className="total-cell">
                    <strong>{employee.totalKm} km</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expenses.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>👥 Aucun employé trouvé</h3>
          <p>Veuillez d'abord ajouter des employés dans la gestion des employés.</p>
        </div>
      )}

      {parameters.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>⚙️ Paramètres manquants</h3>
          <p>Veuillez d'abord configurer les paramètres dans le menu Paramètres.</p>
        </div>
      )}

      {showPending && (
        <div className="km-pending-overlay" onClick={() => setShowPending(false)}>
          <div className="km-pending-panel" onClick={(e) => e.stopPropagation()}>
            <div className="km-pending-header">
              <h3>KM à valider</h3>
              <button type="button" className="km-pending-close" onClick={() => setShowPending(false)}>
                ✕
              </button>
            </div>
            {pendingLoading ? (
              <p className="km-pending-empty">Chargement des demandes…</p>
            ) : pendingGroups.length === 0 ? (
              <p className="km-pending-empty">Aucune demande en attente.</p>
            ) : (
              pendingGroups.map((group) => (
                <section key={String(group.employeeId)} className="km-pending-group">
                  <h4>
                    {group.employeeName}
                    <span>{group.requests.length} déplacement{group.requests.length > 1 ? 's' : ''}</span>
                  </h4>
                  {(group.requests || []).map((request) => {
                    const edit = edits[request._id] || {};
                    return (
                      <div key={request._id} className="km-pending-card">
                        <div className="km-pending-fields">
                          <label>
                            Date
                            <input
                              type="date"
                              value={edit.tripDate || ''}
                              onChange={(e) => updateEdit(request._id, 'tripDate', e.target.value)}
                            />
                          </label>
                          <label>
                            Destination
                            <select
                              value={String(edit.parameterId || '')}
                              onChange={(e) => updateEdit(request._id, 'parameterId', e.target.value)}
                            >
                              {parameters.map((param) => (
                                <option key={String(param._id)} value={String(param._id)}>
                                  {param.displayName} ({param.kmValue} km)
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="km-pending-remark">
                            Remarque
                            <input
                              type="text"
                              value={edit.remark || ''}
                              onChange={(e) => updateEdit(request._id, 'remark', e.target.value)}
                              placeholder="Remarque"
                            />
                          </label>
                        </div>
                        <div className="km-pending-actions">
                          <button
                            type="button"
                            className="btn btn-success"
                            disabled={busyId === request._id}
                            onClick={() => handleValidate(request._id)}
                          >
                            Valider
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            disabled={busyId === request._id}
                            onClick={() => handleReject(request._id)}
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KmExpenses;
