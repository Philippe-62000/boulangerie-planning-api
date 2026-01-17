import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './VacationPlanning.css';

const VacationPlanning = () => {
  const [vacationRequests, setVacationRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('vente'); // 'vente' ou 'production'

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les employés
      const employeesResponse = await api.get('/employees');
      const employeesData = employeesResponse.data.success ? employeesResponse.data.data : employeesResponse.data;
      setEmployees(employeesData);
      
      // Récupérer les demandes de congés validées (exclure les annulées)
      const vacationResponse = await api.get('/vacation-requests');
      const allVacationData = vacationResponse.data.success ? vacationResponse.data.data : vacationResponse.data;
      // Filtrer pour ne garder que les validées (pas les annulées)
      const vacationData = allVacationData.filter(req => req.status === 'validated');
      setVacationRequests(vacationData);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Définir les catégories de rôles
  const categoryRoles = {
    vente: ['Vendeuse', 'Responsable', 'Manager', 'App. Vendeuse'],
    production: ['Chef Prod', 'Boulanger', 'App. Boulanger', 'Préparateur', 'App. Préparateur']
  };

  // Filtrer les employés par catégorie
  const getFilteredEmployees = () => {
    const roles = categoryRoles[selectedCategory];
    return employees.filter(emp => {
      const role = emp.role || '';
      return roles.some(catRole => 
        role.toLowerCase().includes(catRole.toLowerCase())
      );
    }).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Obtenir les jours d'un mois
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Obtenir le jour de la semaine (0 = dimanche, 1 = lundi, etc.)
  const getDayOfWeek = (day, month, year) => {
    return new Date(year, month - 1, day).getDay();
  };

  // Obtenir l'initial du jour en français
  const getDayInitial = (dayOfWeek) => {
    const initials = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // Dimanche, Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi
    return initials[dayOfWeek];
  };

  // Vérifier si un jour est un dimanche
  const isSunday = (day, month, year) => {
    return getDayOfWeek(day, month, year) === 0;
  };

  // Obtenir les congés pour un employé et un jour donné
  const getVacationForDay = (employeeId, day, month, year) => {
    const employee = employees.find(emp => emp._id === employeeId);
    if (!employee) return null;
    
    // Créer la date en UTC pour éviter les problèmes de fuseau horaire
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    currentDate.setHours(12, 0, 0, 0); // Milieu de journée pour éviter les problèmes
    
    const vacation = vacationRequests.find(req => {
      if (req.employeeName !== employee.name) return false;
      // Status validated uniquement (les annulées sont déjà filtrées dans fetchData)
      if (req.status !== 'validated') return false;
      
      // Parser les dates sans tenir compte du fuseau horaire
      const startDateStr = req.startDate.split('T')[0]; // Format YYYY-MM-DD
      const endDateStr = req.endDate.split('T')[0];
      
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      
      const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
      startDate.setHours(12, 0, 0, 0);
      const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));
      endDate.setHours(12, 0, 0, 0);
      
      return currentDate >= startDate && currentDate <= endDate;
    });
    
    return vacation;
  };

  // Obtenir la couleur selon le rôle
  const getRoleColor = (role) => {
    const roleLower = (role || '').toLowerCase();
    // Vente (bleu)
    if (roleLower.includes('vendeuse') || roleLower.includes('responsable') || 
        roleLower.includes('manager') || roleLower.includes('app. vendeuse')) {
      return '#e3f2fd';
    }
    // Chef Prod + Boulanger (orange)
    if (roleLower.includes('chef prod') || roleLower.includes('boulanger') || 
        roleLower.includes('app. boulanger')) {
      return '#fff3e0';
    }
    // Préparateur (vert)
    if (roleLower.includes('préparateur') || roleLower.includes('app. préparateur')) {
      return '#e8f5e8';
    }
    return '#f5f5f5';
  };

  // Générer les mois
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

  // Obtenir le nombre maximum de jours dans un mois (31)
  const maxDays = 31;

  // Fonction d'impression
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="vacation-planning-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du planning...</p>
      </div>
    );
  }

  const filteredEmployees = getFilteredEmployees();

  // Déterminer le titre selon la catégorie
  const categoryTitle = selectedCategory === 'vente' ? 'Vente' : 'Prépa';
  
  // Formater la date de génération
  const printDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="vacation-planning">
      {/* En-tête PDF avec titre et date (visible uniquement à l'impression) */}
      <div className="print-header">
        Planning Congés {categoryTitle} - Généré le {printDate}
      </div>

      {/* En-tête avec contrôles */}
      <div className="planning-header">
        <div className="header-title">
          <h1>Calendrier {selectedYear}</h1>
          <p className="subtitle">Planning annuel des congés validés</p>
        </div>
        
        <div className="header-controls">
          {/* Sélecteur d'année */}
          <div className="control-group">
            <label>Année :</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="control-select"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
          </div>

          {/* Sélecteur de catégorie */}
          <div className="control-group">
            <label>Catégorie :</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="control-select"
            >
              <option value="vente">Vente (Vendeuse, Responsable, Manager, App. Vendeuse)</option>
              <option value="production">Production (Chef Prod, Boulanger, Préparateur, Apprentis)</option>
            </select>
          </div>

          {/* Bouton impression */}
          <button onClick={handlePrint} className="btn-print">
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="legend">
        <div className="legend-item">
          <span className="legend-color vente"></span>
          <span>Vente</span>
        </div>
        <div className="legend-item">
          <span className="legend-color chef-boulanger"></span>
          <span>Chef Prod / Boulanger</span>
        </div>
        <div className="legend-item">
          <span className="legend-color preparateur"></span>
          <span>Préparateur</span>
        </div>
      </div>

      {/* Tableau calendrier */}
      <div className="calendar-wrapper">
        <table className="calendar-table">
          {/* En-tête avec noms des mois */}
          <thead>
            <tr>
              <th className="first-header"></th>
              {months.map(month => (
                <th key={month.number} className="month-header">
                  {month.name}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {/* Lignes pour chaque jour (1-31) - format comme l'image */}
            {Array.from({ length: maxDays }, (_, dayIndex) => {
              const day = dayIndex + 1;
              return (
                <tr key={day} className="day-row">
                  {/* Première colonne avec le numéro du jour */}
                  <td className="day-number-cell">
                    {day <= 31 ? day : ''}
                  </td>
                  
                  {/* Colonnes pour chaque mois */}
                  {months.map(month => {
                    const daysInMonth = getDaysInMonth(month.number, selectedYear);
                    const isVisible = day <= daysInMonth;
                    const dayOfWeek = isVisible ? getDayOfWeek(day, month.number, selectedYear) : -1;
                    const dayInitial = isVisible ? getDayInitial(dayOfWeek) : '';
                    const isSundayDay = isVisible && isSunday(day, month.number, selectedYear);
                    
                    // Trouver tous les employés en congé ce jour-là
                    const employeesOnVacation = filteredEmployees.filter(employee => {
                      const vacation = getVacationForDay(employee._id, day, month.number, selectedYear);
                      return vacation !== null;
                    });
                    
                    return (
                      <td 
                        key={month.number} 
                        className={`calendar-day-cell ${isVisible ? '' : 'empty'} ${isSundayDay ? 'sunday' : ''}`}
                      >
                        {isVisible && (
                          <div className="day-content">
                            <span className="day-value">{day}</span>
                            <span className="day-letter">{dayInitial}</span>
                            {/* Afficher les initiales des employés en congé */}
                            {employeesOnVacation.length > 0 && (
                              <div className="vacation-initials">
                                {employeesOnVacation.map((employee, idx) => {
                                  const vacation = getVacationForDay(employee._id, day, month.number, selectedYear);
                                  
                                  // Si pas de congé, ne pas afficher
                                  if (!vacation) return null;
                                  
                                  // Extraire les initiales (prénom + nom)
                                  const nameParts = employee.name.split(' ');
                                  let initials = '';
                                  if (nameParts.length >= 2) {
                                    // Premier caractère du prénom + premier caractère du nom
                                    initials = nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
                                  } else if (nameParts.length === 1) {
                                    // Si un seul mot, prendre les 2 premiers caractères
                                    initials = nameParts[0].substring(0, 2).toUpperCase();
                                  }
                                  
                                  const startDate = new Date(vacation.startDate);
                                  const endDate = new Date(vacation.endDate);
                                  
                                  return (
                                    <span
                                      key={employee._id}
                                      className="employee-initial"
                                      style={{ 
                                        backgroundColor: getRoleColor(employee.role),
                                        color: '#333'
                                      }}
                                      title={`${employee.name}: ${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`}
                                    >
                                      {initials}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VacationPlanning;
