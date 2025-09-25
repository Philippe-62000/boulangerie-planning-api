import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './VacationPlanning.css';

const VacationPlanning = () => {
  const [employees, setEmployees] = useState([]);
  const [vacationRequests, setVacationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les employés
      const employeesResponse = await api.get('/employees');
      let employeesData = null;
      if (employeesResponse.data.success && employeesResponse.data.data) {
        employeesData = employeesResponse.data.data;
      } else if (Array.isArray(employeesResponse.data)) {
        employeesData = employeesResponse.data;
      }
      
      if (employeesData) {
        setEmployees(employeesData);
      }

      // Récupérer les demandes de congés validées
      const vacationResponse = await api.get('/vacation-requests');
      console.log('📅 Données congés reçues:', vacationResponse.data);
      if (vacationResponse.data.success) {
        const validatedVacations = vacationResponse.data.data.filter(
          req => req.status === 'validated' && 
          new Date(req.startDate).getFullYear() === selectedYear
        );
        console.log('📅 Congés validés filtrés:', validatedVacations);
        setVacationRequests(validatedVacations);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    console.log('📅 Génération calendrier - Employés:', employees.length);
    console.log('📅 Génération calendrier - Congés:', vacationRequests.length);
    
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const calendar = [];
    
    for (let month = 0; month < 12; month++) {
      const monthData = {
        name: months[month],
        number: month + 1,
        employees: {}
      };

      // Initialiser tous les employés pour ce mois
      employees.forEach(emp => {
        monthData.employees[emp.name] = {
          name: emp.name,
          days: new Array(31).fill(null) // Maximum 31 jours par mois
        };
      });

      // Remplir avec les congés
      vacationRequests.forEach(vacation => {
        const startDate = new Date(vacation.startDate);
        const endDate = new Date(vacation.endDate);
        
        if (startDate.getMonth() === month || endDate.getMonth() === month) {
          const employeeName = vacation.employeeName;
          if (monthData.employees[employeeName]) {
            const startDay = startDate.getMonth() === month ? startDate.getDate() : 1;
            const endDay = endDate.getMonth() === month ? endDate.getDate() : 31;
            
            for (let day = startDay; day <= endDay; day++) {
              if (day <= 31) {
                monthData.employees[employeeName].days[day - 1] = {
                  type: vacation.reason,
                  startDate: vacation.startDate,
                  endDate: vacation.endDate
                };
              }
            }
          }
        }
      });

      calendar.push(monthData);
    }

    return calendar;
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getVacationTypeColor = (type) => {
    switch (type) {
      case 'Congés payés': return '#28a745';
      case 'RTT': return '#17a2b8';
      case 'Congés sans solde': return '#ffc107';
      case 'Congés exceptionnels': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="vacation-planning">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement du planning des congés...</p>
        </div>
      </div>
    );
  }

  const calendar = generateCalendar();

  return (
    <div className={`vacation-planning ${printMode ? 'print-mode' : ''}`}>
      <div className="page-header">
        <h1>📅 Planning Annuel des Congés {selectedYear}</h1>
        <p>Vue d'ensemble des congés validés pour l'année {selectedYear}</p>
        
        <div className="controls">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="year-selector"
          >
            {[2023, 2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <button onClick={handlePrint} className="btn btn-primary">
            🖨️ Imprimer le Planning
          </button>
        </div>
      </div>

      <div className="calendar-container">
        {calendar.map((month, monthIndex) => (
          <div key={monthIndex} className="month-card">
            <h3 className="month-title">{month.name} {selectedYear}</h3>
            
            <div className="month-grid">
              {/* En-têtes des jours */}
              <div className="day-headers">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div key={day} className="day-header">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Lignes des employés */}
              {Object.values(month.employees).map((employee, empIndex) => (
                <div key={empIndex} className="employee-row">
                  <div className="employee-name">{employee.name}</div>
                  <div className="employee-days">
                    {employee.days.map((day, dayIndex) => (
                      <div 
                        key={dayIndex} 
                        className={`day-cell ${day ? 'vacation-day' : ''}`}
                        style={day ? { backgroundColor: getVacationTypeColor(day.type) } : {}}
                        title={day ? `${day.type} (${formatDate(day.startDate)} - ${formatDate(day.endDate)})` : ''}
                      >
                        {day ? '🏖️' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="legend">
        <h3>Légende</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#28a745' }}></div>
            <span>Congés payés</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#17a2b8' }}></div>
            <span>RTT</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
            <span>Congés sans solde</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#dc3545' }}></div>
            <span>Congés exceptionnels</span>
          </div>
        </div>
      </div>

      {/* Résumé */}
      <div className="summary">
        <h3>Résumé {selectedYear}</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-number">{vacationRequests.length}</span>
            <span className="stat-label">Demandes validées</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {vacationRequests.reduce((total, req) => total + req.duration, 0)}
            </span>
            <span className="stat-label">Jours de congés</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{employees.length}</span>
            <span className="stat-label">Employés</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationPlanning;
