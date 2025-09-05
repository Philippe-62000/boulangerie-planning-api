import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './EmployeeStatusPrint.css';

const EmployeeStatusPrint = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/employee-status?month=${month}&year=${year}`);
      setData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="employee-status-print fade-in">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading"></div>
            <p>Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-status-print fade-in">
      <div className="page-header">
        <h2>📄 État des Salariés - {getMonthName(month)} {year}</h2>
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
            className="btn btn-primary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? '🔄 Chargement...' : '🔄 Actualiser'}
          </button>
          <button
            className="btn btn-success"
            onClick={handlePrint}
            disabled={!data}
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {data && (
        <div className="print-content">
          <div className="print-header">
            <h1>État des Salariés</h1>
            <h2>{getMonthName(data.month)} {data.year}</h2>
            <div className="print-date">
              Généré le {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>

          <div className="print-table">
            <table className="status-table">
              <thead>
                <tr>
                  <th>Salarié</th>
                  <th>Frais Repas</th>
                  <th>Total KM</th>
                  <th>Total Général</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((employee) => (
                  <tr key={employee.employeeId}>
                    <td className="employee-name">
                      <strong>{employee.employeeName}</strong>
                    </td>
                    <td className="meal-amount">
                      {formatCurrency(employee.mealExpense.totalAmount)}
                    </td>
                    <td className="km-amount">
                      {employee.kmExpense.totalKm} km
                    </td>
                    <td className="total-amount">
                      <strong>{formatCurrency(employee.mealExpense.totalAmount)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td><strong>TOTAUX</strong></td>
                  <td><strong>{formatCurrency(data.employees.reduce((sum, emp) => sum + emp.mealExpense.totalAmount, 0))}</strong></td>
                  <td><strong>{data.employees.reduce((sum, emp) => sum + emp.kmExpense.totalKm, 0)} km</strong></td>
                  <td><strong>{formatCurrency(data.employees.reduce((sum, emp) => sum + emp.mealExpense.totalAmount, 0))}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="print-summary">
            <div className="summary-item">
              <strong>Nombre de salariés :</strong> {data.employees.length}
            </div>
            <div className="summary-item">
              <strong>Total frais repas :</strong> {formatCurrency(data.employees.reduce((sum, emp) => sum + emp.mealExpense.totalAmount, 0))}
            </div>
            <div className="summary-item">
              <strong>Total kilomètres :</strong> {data.employees.reduce((sum, emp) => sum + emp.kmExpense.totalKm, 0)} km
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>📄 Aucune donnée</h3>
          <p>Cliquez sur "Actualiser" pour charger les données du mois sélectionné.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeStatusPrint;

