import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Primes.css';

const Primes = () => {
  const { isAdmin } = useAuth();
  const [primes, setPrimes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState({}); // { employeeId: { primeId: true/false } }
  const [calculations, setCalculations] = useState({}); // { employeeId_primeId: { month, year, level, amount } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // État pour la partie 1 : Définition des Primes
  const [newPrime, setNewPrime] = useState({
    name: '',
    frequency: 'mensuelle',
    amountLevel0: 0,
    amountLevel1: 0,
    amountLevel2: 0
  });
  const [editingPrime, setEditingPrime] = useState(null);
  
  // État pour la partie 3 : Calcul Mensuel
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isAdmin()) {
      loadData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin() && selectedMonth && selectedYear) {
      loadCalculations();
    }
  }, [selectedMonth, selectedYear, isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [primesRes, employeesRes, assignmentsRes] = await Promise.all([
        api.get('/primes'),
        api.get('/employees'),
        api.get('/primes/assignments')
      ]);

      if (primesRes.data.success) {
        setPrimes(primesRes.data.data);
      }

      if (employeesRes.data.success && employeesRes.data.data) {
        setEmployees(employeesRes.data.data);
      }

      if (assignmentsRes.data.success) {
        const assignmentsMap = {};
        assignmentsRes.data.data.forEach(assignment => {
          if (!assignmentsMap[assignment.employeeId._id]) {
            assignmentsMap[assignment.employeeId._id] = {};
          }
          assignmentsMap[assignment.employeeId._id][assignment.primeId._id] = assignment.isActive;
        });
        setAssignments(assignmentsMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadCalculations = async () => {
    try {
      const response = await api.get(`/primes/calculations?month=${selectedMonth}&year=${selectedYear}`);
      if (response.data.success) {
        const calculationsMap = {};
        response.data.data.forEach(calc => {
          const key = `${calc.employeeId._id}_${calc.primeId._id}`;
          calculationsMap[key] = {
            level: calc.level,
            amount: calc.amount
          };
        });
        setCalculations(calculationsMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des calculs:', error);
    }
  };

  // Partie 1 : Définition des Primes
  const handleCreatePrime = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/primes', newPrime);
      if (response.data.success) {
        toast.success('Prime créée avec succès');
        setNewPrime({
          name: '',
          frequency: 'mensuelle',
          amountLevel0: 0,
          amountLevel1: 0,
          amountLevel2: 0
        });
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de la prime');
    }
  };

  const handleUpdatePrime = async (prime) => {
    try {
      const response = await api.put(`/primes/${prime._id}`, prime);
      if (response.data.success) {
        toast.success('Prime mise à jour avec succès');
        setEditingPrime(null);
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de la prime');
    }
  };

  const handleDeletePrime = async (primeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette prime ?')) {
      return;
    }
    try {
      const response = await api.delete(`/primes/${primeId}`);
      if (response.data.success) {
        toast.success('Prime supprimée avec succès');
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la prime');
    }
  };

  // Partie 2 : Affectation des Primes
  const handleToggleAssignment = (employeeId, primeId) => {
    setAssignments(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [primeId]: !prev[employeeId]?.[primeId]
      }
    }));
  };

  const handleSaveAssignments = async () => {
    try {
      setSaving(true);
      const assignmentsArray = [];
      Object.keys(assignments).forEach(employeeId => {
        Object.keys(assignments[employeeId]).forEach(primeId => {
          assignmentsArray.push({
            employeeId,
            primeId,
            isActive: assignments[employeeId][primeId] || false
          });
        });
      });

      const response = await api.post('/primes/assignments', { assignments: assignmentsArray });
      if (response.data.success) {
        toast.success('Affectations sauvegardées avec succès');
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des affectations');
    } finally {
      setSaving(false);
    }
  };

  // Partie 3 : Calcul Mensuel
  const handleCalculationChange = (employeeId, primeId, level) => {
    const prime = primes.find(p => p._id === primeId);
    if (!prime) return;

    let amount = 0;
    if (level === 0) amount = prime.amountLevel0 || 0;
    else if (level === 1) amount = prime.amountLevel1;
    else if (level === 2) amount = prime.amountLevel2;

    const key = `${employeeId}_${primeId}`;
    setCalculations(prev => ({
      ...prev,
      [key]: { level, amount }
    }));
  };

  const handleSaveCalculations = async () => {
    try {
      setSaving(true);
      const calculationsArray = [];
      Object.keys(calculations).forEach(key => {
        const [employeeId, primeId] = key.split('_');
        const calc = calculations[key];
        calculationsArray.push({
          employeeId,
          primeId,
          month: selectedMonth,
          year: selectedYear,
          level: calc.level
        });
      });

      const response = await api.post('/primes/calculations', { calculations: calculationsArray });
      if (response.data.success) {
        toast.success('Calculs sauvegardés avec succès');
        loadCalculations();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des calculs');
    } finally {
      setSaving(false);
    }
  };

  const getMonthName = (month) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month - 1] || '';
  };

  // Filtrer les salariés qui ont au moins une prime assignée pour la partie 3
  const employeesWithPrimes = employees.filter(emp => {
    const empAssignments = assignments[emp._id] || {};
    return Object.values(empAssignments).some(active => active === true);
  });

  if (!isAdmin()) {
    return (
      <div className="primes-page fade-in">
        <div className="card">
          <h2>🚫 Accès refusé</h2>
          <p>Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="primes-page fade-in">
        <div className="card">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="primes-page fade-in">
      <h2>💰 Gestion des Primes</h2>

      {/* Partie 1 : Définition des Primes */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>1️⃣ Définition des Primes</h3>
        
        <form onSubmit={handleCreatePrime} style={{ marginBottom: '2rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Nom de la prime *</label>
              <input
                type="text"
                value={newPrime.name}
                onChange={(e) => setNewPrime({ ...newPrime, name: e.target.value })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Fréquence *</label>
              <select
                value={newPrime.frequency}
                onChange={(e) => setNewPrime({ ...newPrime, frequency: e.target.value })}
                required
                className="form-control"
              >
                <option value="mensuelle">Mensuelle</option>
                <option value="annuelle">Annuelle</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Montant Niveau 0 (non atteint)</label>
              <input
                type="number"
                step="0.01"
                value={newPrime.amountLevel0}
                onChange={(e) => setNewPrime({ ...newPrime, amountLevel0: parseFloat(e.target.value) || 0 })}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Montant Niveau 1 (atteint) *</label>
              <input
                type="number"
                step="0.01"
                value={newPrime.amountLevel1}
                onChange={(e) => setNewPrime({ ...newPrime, amountLevel1: parseFloat(e.target.value) || 0 })}
                required
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Montant Niveau 2 (dépassé) *</label>
              <input
                type="number"
                step="0.01"
                value={newPrime.amountLevel2}
                onChange={(e) => setNewPrime({ ...newPrime, amountLevel2: parseFloat(e.target.value) || 0 })}
                required
                className="form-control"
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary">➕ Créer la prime</button>
        </form>

        <div className="primes-list">
          <h4>Liste des primes</h4>
          {primes.length === 0 ? (
            <p>Aucune prime définie</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Fréquence</th>
                  <th>Niveau 0</th>
                  <th>Niveau 1</th>
                  <th>Niveau 2</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {primes.map(prime => (
                  <tr 
                    key={prime._id}
                    style={prime.frequency === 'annuelle' || prime.frequency === 'annual' ? { color: '#dc3545', fontWeight: 'bold' } : {}}
                  >
                    {editingPrime?._id === prime._id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingPrime.name}
                            onChange={(e) => setEditingPrime({ ...editingPrime, name: e.target.value })}
                            className="form-control"
                          />
                        </td>
                        <td>
                          <select
                            value={editingPrime.frequency}
                            onChange={(e) => setEditingPrime({ ...editingPrime, frequency: e.target.value })}
                            className="form-control"
                          >
                            <option value="mensuelle">Mensuelle</option>
                            <option value="annuelle">Annuelle</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editingPrime.amountLevel0}
                            onChange={(e) => setEditingPrime({ ...editingPrime, amountLevel0: parseFloat(e.target.value) || 0 })}
                            className="form-control"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editingPrime.amountLevel1}
                            onChange={(e) => setEditingPrime({ ...editingPrime, amountLevel1: parseFloat(e.target.value) || 0 })}
                            className="form-control"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editingPrime.amountLevel2}
                            onChange={(e) => setEditingPrime({ ...editingPrime, amountLevel2: parseFloat(e.target.value) || 0 })}
                            className="form-control"
                          />
                        </td>
                        <td>
                          <button
                            onClick={() => handleUpdatePrime(editingPrime)}
                            className="btn btn-sm btn-success"
                          >
                            💾 Sauvegarder
                          </button>
                          <button
                            onClick={() => setEditingPrime(null)}
                            className="btn btn-sm btn-secondary"
                          >
                            ❌ Annuler
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{prime.name}</td>
                        <td>{prime.frequency}</td>
                        <td>{prime.amountLevel0 || 0}€</td>
                        <td>{prime.amountLevel1}€</td>
                        <td>{prime.amountLevel2}€</td>
                        <td>
                          <button
                            onClick={() => setEditingPrime({ ...prime })}
                            className="btn btn-sm btn-primary"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDeletePrime(prime._id)}
                            className="btn btn-sm btn-danger"
                          >
                            🗑️ Supprimer
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Partie 2 : Affectation des Primes */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>2️⃣ Affectation des Primes</h3>
        <p>Sélectionnez les primes accessibles pour chaque salarié</p>
        
        {employees.length === 0 ? (
          <p>Aucun salarié trouvé</p>
        ) : primes.length === 0 ? (
          <p>Veuillez d'abord créer des primes</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Salarié</th>
                    {primes.map(prime => (
                      <th 
                        key={prime._id}
                        style={prime.frequency === 'annuelle' || prime.frequency === 'annual' ? { color: '#dc3545', fontWeight: 'bold' } : {}}
                      >
                        {prime.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee._id}>
                      <td>{employee.name}</td>
                      {primes.map(prime => (
                        <td key={prime._id}>
                          <input
                            type="checkbox"
                            checked={assignments[employee._id]?.[prime._id] || false}
                            onChange={() => handleToggleAssignment(employee._id, prime._id)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleSaveAssignments}
              disabled={saving}
              className="btn btn-success"
              style={{ marginTop: '1rem' }}
            >
              {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder les affectations'}
            </button>
          </>
        )}
      </div>

      {/* Partie 3 : Calcul Mensuel de la Prime */}
      <div className="card">
        <h3>3️⃣ Calcul Mensuel de la Prime</h3>
        
        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Mois</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="form-control"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>{getMonthName(m)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Année</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="form-control"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {employeesWithPrimes.length === 0 ? (
          <p>Aucun salarié n'a de prime assignée</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Salarié</th>
                    {primes.map(prime => (
                      <th 
                        key={prime._id}
                        style={prime.frequency === 'annuelle' || prime.frequency === 'annual' ? { color: '#dc3545', fontWeight: 'bold' } : {}}
                      >
                        {prime.name}
                        <br />
                        <small style={{ fontSize: '0.8rem', color: prime.frequency === 'annuelle' || prime.frequency === 'annual' ? '#dc3545' : '#666' }}>
                          (0: {prime.amountLevel0 || 0}€ | 1: {prime.amountLevel1}€ | 2: {prime.amountLevel2}€)
                        </small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeesWithPrimes.map(employee => {
                    const empAssignments = assignments[employee._id] || {};
                    const hasAnyPrime = Object.values(empAssignments).some(active => active === true);
                    
                    if (!hasAnyPrime) return null;
                    
                    return (
                      <tr key={employee._id}>
                        <td>{employee.name}</td>
                        {primes.map(prime => {
                          const hasAccess = empAssignments[prime._id] === true;
                          if (!hasAccess) {
                            return <td key={prime._id}>-</td>;
                          }
                          
                          const key = `${employee._id}_${prime._id}`;
                          const calc = calculations[key] || { level: 0, amount: prime.amountLevel0 || 0 };
                          
                          return (
                            <td key={prime._id}>
                              <select
                                value={calc.level}
                                onChange={(e) => handleCalculationChange(employee._id, prime._id, parseInt(e.target.value))}
                                className="form-control"
                              >
                                <option value="0">Niveau 0 (non atteint) - {prime.amountLevel0 || 0}€</option>
                                <option value="1">Niveau 1 (atteint) - {prime.amountLevel1}€</option>
                                <option value="2">Niveau 2 (dépassé) - {prime.amountLevel2}€</option>
                              </select>
                              <div style={{ marginTop: '5px', fontWeight: 'bold', color: '#28a745' }}>
                                Montant: {calc.amount}€
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleSaveCalculations}
              disabled={saving}
              className="btn btn-success"
              style={{ marginTop: '1rem' }}
            >
              {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder les calculs'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Primes;

