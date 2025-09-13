import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      
      // L'API peut retourner soit { success: true, data: [...] } soit directement [...]
      let employeesData = null;
      if (response.data.success && response.data.data) {
        employeesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        employeesData = response.data;
      }
      
      if (employeesData) {
        setEmployees(employeesData);
      } else {
        setEmployees([]);
        console.error('Format de données invalide:', response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les employés en arrêt maladie (exclure ceux repris depuis plus de 8 jours)
  const sickEmployees = employees.filter(emp => {
    if (!emp.sickLeave?.isOnSickLeave) return false;
    
    // Si l'employé a une date de fin d'arrêt maladie
    if (emp.sickLeave?.endDate) {
      const endDate = new Date(emp.sickLeave.endDate);
      const today = new Date();
      const daysSinceReturn = Math.floor((today - endDate) / (1000 * 60 * 60 * 24));
      
      // Exclure si repris depuis plus de 8 jours
      if (daysSinceReturn > 8) return false;
    }
    
    return true;
  });

  // Filtrer les employés mineurs (âge < 18)
  const minorEmployees = employees.filter(emp => emp.age < 18);

  // Filtrer les apprentis
  const apprenticeEmployees = employees.filter(emp => emp.contractType === 'Apprentissage');

  // Formater une date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Calculer les jours jusqu'à une date
  const calculateDaysUntil = (dateString) => {
    if (!dateString) return 0;
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <h2>📊 Tableau de bord</h2>

      {/* Récapitulatif : Arrêts maladie */}
      <div className="card">
        <h3>🏥 Récapitulatif : Arrêts maladie</h3>
        {sickEmployees.length === 0 ? (
          <p>Aucun employé en arrêt maladie</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date de reprise</th>
                  <th>Jours avant reprise</th>
                </tr>
              </thead>
              <tbody>
                {sickEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.name}</td>
                    <td>{formatDate(employee.sickLeave?.endDate)}</td>
                    <td>
                      {(() => {
                        const daysUntilReturn = calculateDaysUntil(employee.sickLeave?.endDate);
                        return (
                          <span style={{ 
                            color: daysUntilReturn > 0 ? '#28a745' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {daysUntilReturn > 0 ? `${daysUntilReturn} jours` : 'Repris'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* État Âge : Salariés mineurs */}
      <div className="card">
        <h3>🎂 État Âge : Salariés mineurs</h3>
        {minorEmployees.length === 0 ? (
          <p>Aucun employé mineur</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date des 18 ans</th>
                  <th>Jours avant les 18 ans</th>
                </tr>
              </thead>
              <tbody>
                {minorEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.name}</td>
                    <td>{(() => {
                      const currentAge = employee.age;
                      const yearsUntil18 = 18 - currentAge;
                      const today = new Date();
                      const eighteenBirthday = new Date(today.getFullYear() + yearsUntil18, today.getMonth(), today.getDate());
                      return formatDate(eighteenBirthday);
                    })()}</td>
                    <td>
                      {(() => {
                        // Calculer la date des 18 ans (approximatif basé sur l'âge actuel)
                        const currentAge = employee.age;
                        const yearsUntil18 = 18 - currentAge;
                        const today = new Date();
                        const eighteenBirthday = new Date(today.getFullYear() + yearsUntil18, today.getMonth(), today.getDate());
                        const daysUntilEighteen = calculateDaysUntil(eighteenBirthday);
                        
                        return (
                          <span style={{ 
                            color: daysUntilEighteen > 0 ? '#ffc107' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {daysUntilEighteen > 0 ? `${daysUntilEighteen} jours` : 'Majeur'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* État Contrat : Apprentis */}
      <div className="card">
        <h3>📋 État Contrat : Apprentis</h3>
        {apprenticeEmployees.length === 0 ? (
          <p>Aucun apprenti</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date de fin de contrat</th>
                  <th>Jours avant fin de contrat</th>
                </tr>
              </thead>
              <tbody>
                {apprenticeEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.name}</td>
                    <td>{formatDate(employee.contractEndDate)}</td>
                    <td>
                      {(() => {
                        const daysUntilContractEnd = calculateDaysUntil(employee.contractEndDate);
                        return (
                          <span style={{ 
                            color: daysUntilContractEnd > 30 ? '#28a745' : 
                                   daysUntilContractEnd > 7 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {daysUntilContractEnd > 0 ? `${daysUntilContractEnd} jours` : 'Terminé'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistiques générales */}
      <div className="card">
        <h3>📈 Statistiques générales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{employees.length}</h4>
            <p>Total employés</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{employees.filter(emp => emp.isActive).length}</h4>
            <p>Employés actifs</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{sickEmployees.length}</h4>
            <p>En arrêt maladie</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{minorEmployees.length}</h4>
            <p>Employés mineurs</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{apprenticeEmployees.length}</h4>
            <p>Apprentis</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

