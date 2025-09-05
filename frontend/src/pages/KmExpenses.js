import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchExpenses();
  }, [month, year]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/km-expenses?month=${month}&year=${year}`);
      setExpenses(response.data.employees);
      setParameters(response.data.parameters);
    } catch (error) {
      console.error('Erreur lors du chargement des frais KM:', error);
      toast.error('Erreur lors du chargement des frais KM');
    } finally {
      setLoading(false);
    }
  };

  const handleCountChange = (employeeIndex, parameterIndex, value) => {
    const newExpenses = [...expenses];
    const employee = newExpenses[employeeIndex];
    const parameter = employee.parameterValues[parameterIndex];
    
    parameter.count = parseInt(value) || 0;
    parameter.totalKm = parameter.count * parameter.kmValue;
    
    // Recalculer le total pour cet employé
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
      fetchExpenses(); // Recharger pour avoir les IDs
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des frais KM');
    } finally {
      setSaving(false);
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
          </div>
          <button
            className="btn btn-success"
            onClick={saveExpenses}
            disabled={saving}
          >
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
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
    </div>
  );
};

export default KmExpenses;
