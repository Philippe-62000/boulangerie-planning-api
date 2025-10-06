import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const VacationPlanning = () => {
  const [vacationRequests, setVacationRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'vendeur', 'production'
  const [error, setError] = useState(null);

  console.log('🔧 VacationPlanning - Rendu du composant');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📅 Récupération des données...');

      // Récupérer les employés
      const employeesResponse = await api.get('/employees');
      const employeesData = employeesResponse.data.success ? employeesResponse.data.data : employeesResponse.data;
      setEmployees(employeesData);
      console.log('👥 Employés chargés:', employeesData.length);

      // Récupérer les demandes de congés validées
      const vacationResponse = await api.get('/vacation-requests?status=validated');
      const vacationData = vacationResponse.data.success ? vacationResponse.data.data : vacationResponse.data;
      setVacationRequests(vacationData);
      console.log('🏖️ Congés validés chargés:', vacationData.length);
      console.log('🔍 Détails des congés:', vacationData);
      
      // Debug : vérifier les employés
      console.log('👥 Détails des employés:', employeesData);
      const camille = employeesData.find(emp => emp.name === 'Camille');
      console.log('🔍 Camille trouvée:', camille);

    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrer les employés par catégorie
  const getFilteredEmployees = () => {
    if (selectedCategory === 'all') return employees;
    return employees.filter(emp => {
      if (selectedCategory === 'vente') {
        return emp.role === 'vendeuse' || emp.role === 'responsable' || 
               emp.role === 'manager' || emp.role === 'Apprenti Vendeuse';
      }
      if (selectedCategory === 'production') {
        return emp.role === 'chef prod' || emp.role === 'boulanger' || 
               emp.role === 'préparateur' || emp.role === 'Apprenti Boulanger' || 
               emp.role === 'Apprenti Préparateur';
      }
      return false;
    });
  };

  // Obtenir les congés d'un employé pour une année
  const getEmployeeVacations = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    if (!employee) return [];
    
    return vacationRequests.filter(vacation => 
      vacation.employeeName === employee.name && 
      new Date(vacation.startDate).getFullYear() === selectedYear
    );
  };

  // Obtenir le nom de l'employé par ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? employee.name : 'Employé inconnu';
  };

  // Générer les mois de l'année
  const months = [
    { name: 'Janvier', number: 1 },
    { name: 'Février', number: 2 },
    { name: 'Mars', number: 3 },
    { name: 'Avril', number: 4 },
    { name: 'Mai', number: 5 },
    { name: 'Juin', number: 6 },
    { name: 'Juillet', number: 7 },
    { name: 'Août', number: 8 },
    { name: 'Septembre', number: 9 },
    { name: 'Octobre', number: 10 },
    { name: 'Novembre', number: 11 },
    { name: 'Décembre', number: 12 }
  ];

  // Obtenir les congés pour un mois donné
  const getVacationsForMonth = (employeeId, monthNumber) => {
    const employee = employees.find(emp => emp._id === employeeId);
    if (!employee) return [];
    
    return vacationRequests.filter(vacation => {
      if (vacation.employeeName !== employee.name) return false;
      
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      const vacationYear = startDate.getFullYear();
      
      if (vacationYear !== selectedYear) return false;
      
      const startMonth = startDate.getMonth() + 1;
      const endMonth = endDate.getMonth() + 1;
      
      // Le congé couvre ce mois s'il commence avant la fin du mois ou se termine après le début du mois
      return (startMonth <= monthNumber && endMonth >= monthNumber);
    });
  };

  // Formater une date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Obtenir la durée d'un congé
  const getVacationDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Obtenir la couleur selon le rôle (3 couleurs seulement)
  const getRoleColor = (role) => {
    // Vente (bleu)
    if (role === 'vendeuse' || role === 'responsable' || role === 'manager' || role === 'Apprenti Vendeuse') {
      return '#e3f2fd';
    }
    // Chef Prod + Boulanger (orange)
    if (role === 'chef prod' || role === 'boulanger' || role === 'Apprenti Boulanger') {
      return '#fff3e0';
    }
    // Préparateur (vert)
    if (role === 'préparateur' || role === 'Apprenti Préparateur') {
      return '#e8f5e8';
    }
    return '#f5f5f5';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px'
      }}>
        🔄 Chargement du calendrier des congés...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '5px',
        margin: '20px'
      }}>
        ❌ {error}
        <button 
          onClick={fetchData}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🔄 Réessayer
        </button>
      </div>
    );
  }

  const filteredEmployees = getFilteredEmployees();

  return (
    <div className="vacation-planning" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div className="planning-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>
          📅 Planning Annuel - Congés Validés
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Boulangerie Arras - {selectedYear}
        </p>
        
        {/* Contrôles */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginTop: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Sélecteur d'année */}
          <div>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Année:</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value={selectedYear - 1}>{selectedYear - 1}</option>
              <option value={selectedYear}>{selectedYear}</option>
              <option value={selectedYear + 1}>{selectedYear + 1}</option>
            </select>
          </div>

          {/* Sélecteur de catégorie */}
          <div>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Catégorie:</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="all">Tous</option>
              <option value="vente">Vente (Vendeuse, Responsable, Manager, Apprenti Vendeuse)</option>
              <option value="production">Production (Chef Prod, Boulanger, Préparateur, Apprentis)</option>
            </select>
          </div>

          {/* Bouton d'impression */}
          <button 
            onClick={() => window.print()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* Légende */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Légende:</h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {/* Vente (bleu) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '15px', 
              height: '15px', 
              backgroundColor: '#e3f2fd', 
              marginRight: '6px',
              borderRadius: '3px'
            }}></div>
            <span style={{ fontSize: '12px' }}>Vendeuse, Responsable, Manager, App. Vendeuse</span>
          </div>
          
          {/* Chef Prod + Boulanger (orange) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '15px', 
              height: '15px', 
              backgroundColor: '#fff3e0', 
              marginRight: '6px',
              borderRadius: '3px'
            }}></div>
            <span style={{ fontSize: '12px' }}>Chef Prod, Boulanger, App. Boulanger</span>
          </div>
          
          {/* Préparateur (vert) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '15px', 
              height: '15px', 
              backgroundColor: '#e8f5e8', 
              marginRight: '6px',
              borderRadius: '3px'
            }}></div>
            <span style={{ fontSize: '12px' }}>Préparateur, App. Préparateur</span>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div className="calendar-container">
        {filteredEmployees.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#666',
            fontSize: '16px'
          }}>
            Aucun employé trouvé pour la catégorie sélectionnée
          </div>
        ) : (
          <div className="calendar-grid">
            {/* En-tête des mois */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '200px repeat(12, 1fr)', 
              gap: '2px',
              marginBottom: '10px'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                padding: '10px', 
                backgroundColor: '#e9ecef',
                border: '1px solid #dee2e6',
                textAlign: 'center'
              }}>
                Employé
              </div>
              {months.map(month => (
                <div key={month.number} style={{ 
                  fontWeight: 'bold', 
                  padding: '10px', 
                  backgroundColor: '#e9ecef',
                  border: '1px solid #dee2e6',
                  textAlign: 'center',
                  fontSize: '12px'
                }}>
                  {month.name}
                </div>
              ))}
            </div>

            {/* Lignes des employés */}
            {filteredEmployees.map(employee => (
              <div key={employee._id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '200px repeat(12, 1fr)', 
                gap: '2px',
                marginBottom: '2px'
              }}>
                {/* Nom de l'employé */}
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                    {employee.name}
                  </span>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: getRoleColor(employee.role),
                    borderRadius: '50%',
                    marginLeft: '8px'
                  }}></div>
                </div>

                {/* Cellules des mois */}
                {months.map(month => {
                  const monthVacations = getVacationsForMonth(employee._id, month.number);
                  
                  return (
                    <div key={month.number} style={{ 
                      padding: '8px', 
                      backgroundColor: monthVacations.length > 0 ? '#d4edda' : '#ffffff',
                      border: '1px solid #dee2e6',
                      minHeight: '40px',
                      fontSize: '11px'
                    }}>
                      {monthVacations.map((vacation, index) => (
                        <div key={index} style={{ 
                          backgroundColor: getRoleColor(employee.role),
                          color: 'black',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          marginBottom: '2px',
                          fontSize: '10px',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          {formatDate(vacation.startDate)}-{formatDate(vacation.endDate)}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer avec numéro de déploiement */}
      <div style={{
        marginTop: '30px',
        padding: '10px',
        backgroundColor: '#e9ecef',
        borderRadius: '5px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        🚀 DÉPLOIEMENT #019 - {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default VacationPlanning;