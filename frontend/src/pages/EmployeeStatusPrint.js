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
  const [advanceRequests, setAdvanceRequests] = useState([]);
const [overpayments, setOverpayments] = useState({});
const [persistedOverpayments, setPersistedOverpayments] = useState({});
const [savingOverpayment, setSavingOverpayment] = useState({});

  const fetchAdvanceRequests = async () => {
    try {
      const response = await api.get('/advance-requests');
      if (response.data.success) {
        // Filtrer les acomptes approuvés pour le mois sélectionné UNIQUEMENT
        const monthName = getMonthName(month);
        const yearStr = year.toString();
        const searchPattern = `${monthName} ${yearStr}`;
        
        console.log('🔍 Recherche acomptes pour le mois sélectionné UNIQUEMENT:', searchPattern);
        console.log('📋 Tous les acomptes récupérés:', response.data.data);
        
        const filteredRequests = response.data.data.filter(request => {
          const matchesStatus = request.status === 'approved';
          if (!matchesStatus) {
            console.log(`  ❌ ${request.employeeName}: status=${request.status} (non approuvé)`);
            return false;
          }
          
          // Chercher correspondance STRICTE avec le mois sélectionné uniquement
          if (!request.deductionMonth) {
            console.log(`  ❌ ${request.employeeName}: pas de mois de déduction`);
            return false;
          }
          
          const requestMonth = request.deductionMonth.toLowerCase().trim();
          const matches = requestMonth === searchPattern.toLowerCase();
          
          console.log(`  ${matches ? '✅' : '❌'} ${request.employeeName}: month="${request.deductionMonth}" vs recherche="${searchPattern}" → ${matches ? 'MATCH' : 'NO MATCH'}`);
          
          return matches;
        });
        
        console.log(`✅ Acomptes filtrés trouvés pour ${searchPattern}:`, filteredRequests.length, 'acompte(s)');
        console.log('📋 Détails:', filteredRequests.map(r => `${r.employeeName}: ${r.amount}€`));
        setAdvanceRequests(filteredRequests);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des acomptes:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/employee-status?month=${month}&year=${year}`);
    const employees = Array.isArray(response.data?.employees) ? response.data.employees : [];

    const sanitizedEmployees = employees.map((employee) => {
      const rawAmount = typeof employee.overpaymentAmount === 'number' ? employee.overpaymentAmount : 0;
      const normalizedAmount = Math.round(rawAmount * 100) / 100;
      return {
        ...employee,
        overpaymentAmount: normalizedAmount
      };
    });

    const initialOverpayments = {};
    const initialPersistedOverpayments = {};

    sanitizedEmployees.forEach((employee) => {
      const employeeKey = employee.employeeId?.toString?.() ?? employee.employeeId;
      if (!employeeKey) {
        return;
      }

      const normalizedValue = Number((employee.overpaymentAmount || 0).toFixed(2));
      const normalizedString = normalizedValue.toString();
      initialOverpayments[employeeKey] = normalizedString;
      initialPersistedOverpayments[employeeKey] = normalizedString;
    });

    const fallbackOverpaymentTotal = sanitizedEmployees.reduce((sum, employee) => {
      return sum + (employee.overpaymentAmount || 0);
    }, 0);

    const rawOverpaymentTotal = typeof response.data?.overpaymentTotal === 'number'
      ? response.data.overpaymentTotal
      : fallbackOverpaymentTotal;

    const normalizedOverpaymentTotal = Math.round((rawOverpaymentTotal || 0) * 100) / 100;

    setOverpayments(initialOverpayments);
    setPersistedOverpayments(initialPersistedOverpayments);
    setData({
      ...response.data,
      employees: sanitizedEmployees,
      overpaymentTotal: normalizedOverpaymentTotal
    });
      // Récupérer aussi les acomptes
      await fetchAdvanceRequests();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

const handleOverpaymentChange = (employeeId, value) => {
  if (!employeeId && employeeId !== 0) {
    return;
  }

  const employeeKey = employeeId?.toString?.() ?? employeeId;
  if (value === undefined || value === null) {
    return;
  }

  setOverpayments((prev) => ({
    ...prev,
    [employeeKey]: value
  }));
};

const handleOverpaymentBlur = async (employee) => {
  if (!employee?.employeeId) {
    return;
  }

  const employeeKey = employee.employeeId?.toString?.() ?? employee.employeeId;
  const currentValue = (overpayments[employeeKey] ?? '0').toString();
  const normalizedInput = currentValue.trim() === '' ? '0' : currentValue.replace(',', '.');
  const numericValue = parseFloat(normalizedInput);

  if (Number.isNaN(numericValue) || numericValue < 0) {
    toast.error('Montant de trop perçu invalide');
    setOverpayments((prev) => ({
      ...prev,
      [employeeKey]: persistedOverpayments[employeeKey] ?? '0'
    }));
    return;
  }

  const normalizedValueNumber = Math.round(numericValue * 100) / 100;
  const normalizedValueString = normalizedValueNumber.toString();

  setOverpayments((prev) => ({
    ...prev,
    [employeeKey]: normalizedValueString
  }));

  const previousPersistedValue = parseFloat(
    (persistedOverpayments[employeeKey] ?? '0').toString().replace(',', '.')
  );

  const previousPersistedNumber = Number.isNaN(previousPersistedValue) ? 0 : previousPersistedValue;

  if (Math.abs(previousPersistedNumber - normalizedValueNumber) < 0.005) {
    return;
  }

  try {
    setSavingOverpayment((prev) => ({
      ...prev,
      [employeeKey]: true
    }));

    await api.put('/employee-status/overpayment', {
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      month,
      year,
      amount: normalizedValueNumber
    });

    setPersistedOverpayments((prev) => ({
      ...prev,
      [employeeKey]: normalizedValueString
    }));

    setData((prev) => {
      if (!prev?.employees) {
        return prev;
      }

      const updatedEmployees = prev.employees.map((emp) => {
        const empKey = emp.employeeId?.toString?.() ?? emp.employeeId;
        if (empKey === employeeKey) {
          return {
            ...emp,
            overpaymentAmount: normalizedValueNumber
          };
        }
        return emp;
      });

      const updatedOverpaymentTotal = updatedEmployees.reduce((sum, emp) => {
        return sum + (emp.overpaymentAmount || 0);
      }, 0);

      return {
        ...prev,
        employees: updatedEmployees,
        overpaymentTotal: Math.round(updatedOverpaymentTotal * 100) / 100
      };
    });

    toast.success(`Trop perçu sauvegardé pour ${employee.employeeName}`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du trop perçu:', error);
    toast.error(`Erreur lors de la sauvegarde du trop perçu pour ${employee.employeeName}`);
    setOverpayments((prev) => ({
      ...prev,
      [employeeKey]: persistedOverpayments[employeeKey] ?? '0'
    }));
  } finally {
    setSavingOverpayment((prev) => ({
      ...prev,
      [employeeKey]: false
    }));
  }
};

const getEmployeeOverpayment = (employeeId) => {
  if (!employeeId && employeeId !== 0) {
    return 0;
  }

  const employeeKey = employeeId?.toString?.() ?? employeeId;
  const rawValue = overpayments[employeeKey];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return 0;
  }

  const numericValue = parseFloat(rawValue.toString().replace(',', '.'));

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.round(numericValue * 100) / 100;
};

const calculateTotalOverpayments = () => {
  if (!data?.employees) {
    return 0;
  }

  return data.employees.reduce((sum, employee) => {
    return sum + getEmployeeOverpayment(employee.employeeId);
  }, 0);
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
  const headers = ["Salarié", "Frais Repas", "Total KM", "Acompte", "Trop Perçu", "Total Général"];
    csvContent += headers.join(",") + "\n";
    
    // Données
    if (data.employees && data.employees.length > 0) {
      data.employees.forEach(employee => {
        const advanceAmount = getEmployeeAdvance(employee.employeeName, employee.employeeId);
      const overpaymentAmount = getEmployeeOverpayment(employee.employeeId);
      const totalGeneral = employee.mealExpense.totalAmount + advanceAmount - overpaymentAmount;
        const row = [
          `"${employee.employeeName || 'N/A'}"`,
          `"${formatCurrency(employee.mealExpense.totalAmount)}"`,
          `"${employee.kmExpense.totalKm || 0} km"`,
          `"${formatCurrency(advanceAmount)}"`,
        `"${formatCurrency(overpaymentAmount)}"`,
        `"${formatCurrency(totalGeneral)}"`
        ];
        csvContent += row.join(",") + "\n";
      });
      
      // Ajouter les totaux
      const totalMeal = data.employees.reduce((sum, emp) => sum + emp.mealExpense.totalAmount, 0);
      const totalKm = data.employees.reduce((sum, emp) => sum + emp.kmExpense.totalKm, 0);
      const totalAdvance = advanceRequests.reduce((sum, req) => sum + req.amount, 0);
    const totalOverpayment = calculateTotalOverpayments();
    const totalGeneral = totalMeal + totalAdvance - totalOverpayment;
    csvContent += `"TOTAUX","${formatCurrency(totalMeal)}","${totalKm} km","${formatCurrency(totalAdvance)}","${formatCurrency(totalOverpayment)}","${formatCurrency(totalGeneral)}"\n`;
  } else {
    // Données par défaut si pas de données
    csvContent += `"Aucune donnée disponible","","","","",""\n`;
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
  
  // Fonction pour obtenir le mois de déduction (peut être différent du mois de consultation)
  // Les acomptes sont déduits le mois suivant leur approbation généralement

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Fonction pour obtenir le montant total d'acompte d'un employé (peut avoir plusieurs acomptes)
  const getEmployeeAdvance = (employeeName, employeeId) => {
    if (!advanceRequests || advanceRequests.length === 0) {
      console.log(`💰 Aucun acompte disponible pour ${employeeName}`);
      return 0;
    }
    
    // Nettoyer le nom (enlever les suffixes comme "- Manager", "- Salarié", etc.)
    const cleanEmployeeName = employeeName.split(' - ')[0].trim().toLowerCase();
    
    console.log(`🔍 Recherche acomptes pour: "${employeeName}" (ID: ${employeeId})`);
    console.log(`📋 Acomptes disponibles:`, advanceRequests.map(r => ({ name: r.employeeName, id: r.employeeId, amount: r.amount })));
    
    // Trouver TOUS les acomptes de cet employé (pas seulement le premier)
    const matchingRequests = advanceRequests.filter(req => {
      // 1. Correspondance par ID si disponible
      if (employeeId && req.employeeId) {
        const idMatch = req.employeeId.toString() === employeeId.toString();
        if (idMatch) {
          console.log(`  ✅ Correspondance par ID: ${req.employeeId} === ${employeeId} (${req.amount}€)`);
          return true;
        }
      }
      
      // 2. Correspondance par nom exact (après nettoyage)
      if (req.employeeName) {
        const cleanRequestName = req.employeeName.split(' - ')[0].trim().toLowerCase();
        if (cleanRequestName === cleanEmployeeName) {
          console.log(`  ✅ Correspondance par nom exact: "${cleanRequestName}" === "${cleanEmployeeName}" (${req.amount}€)`);
          return true;
        }
        
        // 3. Correspondance partielle si nécessaire
        if (cleanRequestName.includes(cleanEmployeeName) || cleanEmployeeName.includes(cleanRequestName)) {
          console.log(`  ✅ Correspondance partielle: "${cleanRequestName}" contient "${cleanEmployeeName}" (${req.amount}€)`);
          return true;
        }
      }
      
      return false;
    });
    
    // Somme de tous les acomptes trouvés
    const totalAmount = matchingRequests.reduce((sum, req) => sum + req.amount, 0);
    console.log(`💰 Total acomptes trouvés pour ${employeeName}: ${matchingRequests.length} acompte(s) = ${totalAmount}€`);
    
    return totalAmount;
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

  const totalMealAmount = data?.employees?.reduce((sum, emp) => sum + (emp.mealExpense?.totalAmount || 0), 0) || 0;
  const totalKmAmount = data?.employees?.reduce((sum, emp) => sum + (emp.kmExpense?.totalKm || 0), 0) || 0;
  const totalAdvanceAmount = advanceRequests?.reduce((sum, req) => sum + (req.amount || 0), 0) || 0;
  const totalOverpaymentAmount = data?.employees ? calculateTotalOverpayments() : 0;
  const totalGeneralAmount = totalMealAmount + totalAdvanceAmount - totalOverpaymentAmount;

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
                  <th className="header-employee">Salarié</th>
                  <th className="header-meal">Frais Repas</th>
                  <th className="header-km">Total KM</th>
                  <th className="header-advance">Acompte</th>
                  <th className="header-overpayment">Trop Perçu</th>
                  <th className="header-total">Total Général</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((employee) => {
                  const advanceAmount = getEmployeeAdvance(employee.employeeName, employee.employeeId);
                  const overpaymentAmount = getEmployeeOverpayment(employee.employeeId);
                  const totalGeneral = employee.mealExpense.totalAmount + advanceAmount - overpaymentAmount;
                  const employeeKey = employee.employeeId?.toString?.() ?? employee.employeeId;
                  const inputValue = Object.prototype.hasOwnProperty.call(overpayments, employeeKey)
                    ? overpayments[employeeKey]
                    : '0';
                  return (
                    <tr key={employee.employeeId}>
                      <td className="employee-name">
                        <strong>{employee.employeeName}</strong>
                      </td>
                      <td className="meal-amount">
                        {formatCurrency(employee.mealExpense.totalAmount)}
                      </td>
                      <td className="km-amount">
                        {employee.kmExpense.totalKm || 0} km
                      </td>
                      <td className="advance-amount">
                        {formatCurrency(advanceAmount)}
                      </td>
                      <td className="overpayment-amount">
                        <div className="overpayment-input-wrapper">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="overpayment-input"
                            value={inputValue}
                            onChange={(e) => handleOverpaymentChange(employee.employeeId, e.target.value)}
                            onBlur={() => handleOverpaymentBlur(employee)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                          />
                          {savingOverpayment[employeeKey] && (
                            <span className="overpayment-saving" aria-live="polite" title="Sauvegarde en cours">
                              ⏳
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="total-amount">
                        <strong>{formatCurrency(totalGeneral)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td><strong>TOTAUX</strong></td>
                  <td><strong>{formatCurrency(totalMealAmount)}</strong></td>
                  <td><strong>{totalKmAmount} km</strong></td>
                  <td><strong>{formatCurrency(totalAdvanceAmount)}</strong></td>
                  <td><strong>{formatCurrency(totalOverpaymentAmount)}</strong></td>
                  <td><strong>{formatCurrency(totalGeneralAmount)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="print-summary">
            <div className="summary-item">
              <strong>Nombre de salariés :</strong> {data.employees.length}
            </div>
            <div className="summary-item">
              <strong>Total frais repas :</strong> {formatCurrency(totalMealAmount)}
            </div>
            <div className="summary-item">
              <strong>Total kilomètres :</strong> {totalKmAmount} km
            </div>
            <div className="summary-item">
              <strong>Total acomptes :</strong> {formatCurrency(totalAdvanceAmount)}
            </div>
            <div className="summary-item">
              <strong>Total trop perçu :</strong> {formatCurrency(totalOverpaymentAmount)}
            </div>
            <div className="summary-item">
              <strong>Total général :</strong> {formatCurrency(totalGeneralAmount)}
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

