import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './MealExpenses.css';

const MealExpenses = () => {
  const [expenses, setExpenses] = useState([]);
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
      const response = await api.get(`/meal-expenses?month=${month}&year=${year}`);
      setExpenses(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des frais repas:', error);
      toast.error('Erreur lors du chargement des frais repas');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseChange = (employeeIndex, day, value) => {
    const newExpenses = [...expenses];
    const employee = newExpenses[employeeIndex];
    
    // Trouver ou créer l'entrée pour ce jour
    let dayExpense = employee.dailyExpenses.find(exp => exp.day === day);
    if (!dayExpense) {
      dayExpense = { day, amount: 0 };
      employee.dailyExpenses.push(dayExpense);
    }
    
    dayExpense.amount = parseFloat(value) || 0;
    
    // Recalculer le total pour cet employé
    employee.totalAmount = employee.dailyExpenses.reduce((total, exp) => total + exp.amount, 0);
    
    setExpenses(newExpenses);
  };

  const saveExpenses = async () => {
    setSaving(true);
    try {
      await api.post('/meal-expenses/batch', {
        month,
        year,
        expenses: expenses.map(expense => ({
          employeeId: expense.employeeId,
          employeeName: expense.employeeName,
          dailyExpenses: expense.dailyExpenses
        }))
      });
      
      toast.success('Frais repas sauvegardés avec succès');
      fetchExpenses(); // Recharger pour avoir les IDs
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des frais repas');
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = () => {
    return new Date(year, month, 0).getDate();
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1];
  };

  const daysInMonth = getDaysInMonth();

  if (loading) {
    return (
      <div className="meal-expenses fade-in">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading"></div>
            <p>Chargement des frais repas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-expenses fade-in">
      <div className="page-header">
        <h2>🍽️ Frais Repas - {getMonthName(month)} {year}</h2>
        <div className="header-controls">
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
          <table className="meal-expenses-table">
            <thead>
              <tr>
                <th className="employee-column">Salarié</th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i + 1} className="day-column">
                    {i + 1}
                  </th>
                ))}
                <th className="total-column">Total</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((employee, employeeIndex) => (
                <tr key={employee.employeeId}>
                  <td className="employee-cell">
                    <strong>{employee.employeeName}</strong>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dayExpense = employee.dailyExpenses.find(exp => exp.day === day);
                    const value = dayExpense ? dayExpense.amount : 0;
                    
                    return (
                      <td key={day} className="day-cell">
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handleExpenseChange(employeeIndex, day, e.target.value)}
                          min="0"
                          step="0.01"
                          className="expense-input"
                          placeholder="0.00"
                        />
                      </td>
                    );
                  })}
                  <td className="total-cell">
                    <strong>{employee.totalAmount.toFixed(2)} €</strong>
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
    </div>
  );
};

export default MealExpenses;

