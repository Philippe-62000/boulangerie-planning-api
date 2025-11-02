import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingObligations, setPendingObligations] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingObligations();
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

  const fetchPendingObligations = async () => {
    try {
      const response = await api.get('/onboarding-offboarding/pending-obligations');
      if (response.data.success && response.data.data) {
        setPendingObligations(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des obligations légales:', error);
      setPendingObligations([]);
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

  // Filtrer les employés en congés (8 jours avant le début, exclure ceux qui ont déjà fini)
  const vacationEmployees = employees.filter(emp => {
    // Si pas de vacation du tout, exclure
    if (!emp.vacation) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliser à minuit pour la comparaison
    
    // PRIORITÉ 1: Si l'employé a une date de fin de congés et qu'elle est passée, l'exclure
    // (même si isOnVacation est true, si la date de fin est passée, les congés sont terminés)
    if (emp.vacation?.endDate) {
      const endDate = new Date(emp.vacation.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      // Exclure si la date de fin est passée (congés terminés)
      // Utiliser <= au lieu de < pour exclure les congés qui se terminent aujourd'hui
      if (endDate < today) return false;
    }
    
    // Si pas de flag isOnVacation, vérifier quand même avec les dates
    if (!emp.vacation?.isOnVacation) {
      // Si pas de dates non plus, exclure
      if (!emp.vacation?.startDate && !emp.vacation?.endDate) return false;
    }
    
    // Si l'employé a une date de début de congés
    if (emp.vacation?.startDate) {
      const startDate = new Date(emp.vacation.startDate);
      startDate.setHours(0, 0, 0, 0);
      const daysUntilVacation = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));
      
      // Afficher seulement si 8 jours ou moins avant le début (ou déjà en congés)
      if (daysUntilVacation > 8) return false;
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
      <div className="card" style={{ marginBottom: '2rem' }}>
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

      {/* Récapitulatif : Congés */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>🏖️ Récapitulatif : Congés</h3>
        {vacationEmployees.length === 0 ? (
          <p>Aucun employé en congés dans les 8 prochains jours</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date de début</th>
                  <th>Date de fin</th>
                  <th>Jours avant congés</th>
                </tr>
              </thead>
              <tbody>
                {vacationEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.name}</td>
                    <td>{formatDate(employee.vacation?.startDate)}</td>
                    <td>{formatDate(employee.vacation?.endDate)}</td>
                    <td>
                      {(() => {
                        const daysUntilVacation = calculateDaysUntil(employee.vacation?.startDate);
                        return (
                          <span style={{ 
                            color: daysUntilVacation > 0 ? '#ffc107' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {daysUntilVacation > 0 ? `${daysUntilVacation} jours` : 'En congés'}
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
      <div className="card" style={{ marginBottom: '2rem' }}>
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

      {/* Obligations Légales */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>⚖️ Obligations Légales</h3>
        {pendingObligations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: '#d4edda', 
            color: '#155724',
            borderRadius: '8px',
            border: '1px solid #c3e6cb'
          }}>
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              style={{ width: '48px', height: '48px', marginBottom: '1rem' }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              ✅ Toutes les obligations légales sont à jour !
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fff3cd', 
              color: '#856404',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #ffeaa7'
            }}>
              <strong>⚠️ {pendingObligations.length} démarche(s) administrative(s) en attente</strong>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Démarche</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {pendingObligations.map((obligation, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold' }}>{obligation.employeeName}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: '#f8d7da', 
                        color: '#721c24',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}>
                        {obligation.taskLabel}
                      </span>
                    </td>
                    <td style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      {obligation.comment || '-'}
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
            <h4>{vacationEmployees.length}</h4>
            <p>En congés (8j)</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{minorEmployees.length}</h4>
            <p>Employés mineurs</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>{apprenticeEmployees.length}</h4>
            <p>Apprentis</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
            <h4 style={{ color: '#856404' }}>{pendingObligations.length}</h4>
            <p style={{ color: '#856404' }}>Obligations légales</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

