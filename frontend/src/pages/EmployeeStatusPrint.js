import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import HolidayStatus from '../components/HolidayStatus';
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
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    const printContent = document.querySelector('.print-content');
    
    if (printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>État des Salariés - ${getMonthName(month)} ${year}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #000;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
            }
            .print-header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            .print-header h2 {
              margin: 0 0 10px 0;
              font-size: 18px;
            }
            .print-date {
              font-size: 12px;
              color: #666;
            }
            .status-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .status-table th,
            .status-table td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            .status-table th {
              background: #f0f0f0;
              font-weight: bold;
            }
            .totals-row {
              background: #f0f0f0;
              font-weight: bold;
            }
            .print-summary {
              margin-top: 20px;
            }
            .summary-item {
              margin-bottom: 10px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .status-table tbody tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      // Fallback vers l'impression normale
      window.print();
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    // Créer un fichier CSV avec les bonnes données
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // En-têtes
    const headers = ["Salarié", "Frais Repas", "Total KM", "Total Général"];
    csvContent += headers.join(",") + "\n";
    
    // Données
    if (data.employees && data.employees.length > 0) {
      data.employees.forEach(employee => {
        const row = [
          `"${employee.name || 'N/A'}"`,
          `"${employee.mealExpenses || '0,00 €'}"`,
          `"${employee.totalKm || '0 km'}"`,
          `"${employee.totalGeneral || '0,00 €'}"`
        ];
        csvContent += row.join(",") + "\n";
      });
      
      // Ajouter les totaux si disponibles
      if (data.totals) {
        csvContent += `"TOTAUX","${data.totals.mealExpenses || '0,00 €'}","${data.totals.totalKm || '0 km'}","${data.totals.totalGeneral || '0,00 €'}"\n`;
      }
    } else {
      // Données par défaut si pas de données
      csvContent += `"Aucune donnée disponible","","",""\n`;
    }
    
    // Télécharger le fichier
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `etat_salaries_${getMonthName(month)}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <button
            className="btn btn-info"
            onClick={handleExportExcel}
            disabled={!data}
          >
            📊 Exporter Excel
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

      {/* Section État des Congés */}
      <div style={{ marginTop: '2rem' }}>
        <HolidayStatus />
      </div>
    </div>
  );
};

export default EmployeeStatusPrint;

