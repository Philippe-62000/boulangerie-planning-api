import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './SalesStats.css';

const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const VENDEUSE_ROLES = ['vendeuse', 'apprenti', 'manager', 'responsable'];
const createFullWeekPresence = () => {
  const presence = {};
  WEEK_DAYS.forEach((jour) => {
    presence[jour] = true;
  });
  return presence;
};

const capitalize = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatWeekDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return capitalize(formatter.format(date));
};

const getISOWeekNumber = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
};

const getWeekRangeFromDate = (referenceDate) => {
  const base = (referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime()))
    ? new Date(referenceDate)
    : new Date();
  const start = new Date(base);
  const day = start.getDay() === 0 ? 7 : start.getDay();
  const diff = 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const SalesStats = () => {
  // Configuration des années
  // ⚠️  MODIFIER CES VALEURS POUR CHANGER LA PLAGE D'ANNÉES
  const YEAR_RANGE = 8; // Nombre total d'années à afficher (ex: 8 = 2022 à 2029)
  const YEARS_BACK = 3; // Nombre d'années en arrière depuis l'année actuelle (ex: 3 = 2022, 2023, 2024, 2025...)
  
  const [employees, setEmployees] = useState([]);
  const [salesData, setSalesData] = useState({});
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyStats, setMonthlyStats] = useState({});
  const [loading, setLoading] = useState(false);
  
  // États pour les objectifs hebdomadaires
  const [objectifHebdoCartesFid, setObjectifHebdoCartesFid] = useState(0);
  const [objectifHebdoPromo, setObjectifHebdoPromo] = useState(0);
  const [presences, setPresences] = useState({}); // { employeeId: { 'Lundi': true, 'Mardi': false, ... } }
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState('');
  const [marges, setMarges] = useState({ vert: 100, jaune: 80, orange: 50 });

  const vendeuses = useMemo(() => {
    return employees.filter(emp => VENDEUSE_ROLES.includes(emp.role));
  }, [employees]);

  const totalCheckedBoxes = useMemo(() => {
    const computed = vendeuses.reduce((sum, vendeuse) => {
      const presence = presences[vendeuse._id] || {};
      const employeeCount = WEEK_DAYS.reduce((count, jour) => (
        presence[jour] ? count + 1 : count
      ), 0);
      return sum + employeeCount;
    }, 0);
    if (computed === 0) {
      const hasManualSelection = Object.values(presences).some((days) =>
        days && typeof days === 'object' && Object.values(days).some(Boolean)
      );
      if (!hasManualSelection && weeklyStats?.totalPresences) {
        return weeklyStats.totalPresences;
      }
    }
    return computed;
  }, [vendeuses, presences, weeklyStats]);

  const objectifParPresenceCartesFid = totalCheckedBoxes > 0
    ? Math.ceil(objectifHebdoCartesFid / totalCheckedBoxes)
    : 0;

  const objectifParPresencePromo = totalCheckedBoxes > 0
    ? Math.ceil(objectifHebdoPromo / totalCheckedBoxes)
    : 0;

  const totalCartesObjective = objectifParPresenceCartesFid * totalCheckedBoxes;
  const totalPromoObjective = objectifParPresencePromo * totalCheckedBoxes;

  const weekInfo = useMemo(() => {
    const baseDate = selectedWeekStart
      ? new Date(selectedWeekStart)
      : (weeklyStats?.weekStart ? new Date(weeklyStats.weekStart) : new Date());
    const { start, end } = getWeekRangeFromDate(baseDate);
    return {
      weekNumber: getISOWeekNumber(start),
      startLabel: formatWeekDate(start),
      endLabel: formatWeekDate(end)
    };
  }, [selectedWeekStart, weeklyStats]);

  // Initialiser le mois et l'année actuels
  useEffect(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(month);
    setCurrentYear(year);
    const { start } = getWeekRangeFromDate(now);
    setSelectedWeekStart(start.toISOString().split('T')[0]);
  }, []);

  // Charger les employés au montage
  useEffect(() => {
    fetchEmployees();
    fetchMarges();
  }, []);

  // Charger les objectifs hebdomadaires
  const fetchWeeklyObjectives = useCallback(async (weekStartValue) => {
    if (!weekStartValue) {
      return;
    }
    try {
      const url = new URL('https://boulangerie-planning-api-4-pbfy.onrender.com/api/daily-sales/objectives');
      url.searchParams.set('weekStart', weekStartValue);
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setObjectifHebdoPromo(data.data.objectifPromo || 0);
          setObjectifHebdoCartesFid(data.data.objectifCartesFid || 0);
          setPresences(buildPresenceState(data.data.presences || {}));
        } else {
          setPresences(buildPresenceState({}));
        }
      } else {
        setPresences(buildPresenceState({}));
      }
    } catch (error) {
      console.error('Erreur chargement objectifs:', error);
      setPresences(buildPresenceState({}));
    }
  }, [buildPresenceState]);

  // Charger les stats hebdomadaires
  const fetchWeeklyStats = useCallback(async (weekStartValue) => {
    if (!weekStartValue) {
      return;
    }
    try {
      const url = new URL('https://boulangerie-planning-api-4-pbfy.onrender.com/api/daily-sales/weekly');
      url.searchParams.set('weekStart', weekStartValue);
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWeeklyStats(data.data);
        }
      }
    } catch (error) {
      console.error('Erreur chargement stats hebdo:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedWeekStart) {
      setPresences(buildPresenceState({}));
      fetchWeeklyObjectives(selectedWeekStart);
      fetchWeeklyStats(selectedWeekStart);
    }
  }, [selectedWeekStart, fetchWeeklyObjectives, fetchWeeklyStats, buildPresenceState]);

  // Charger les marges depuis les paramètres
  const fetchMarges = async () => {
    try {
      const response = await fetch('https://boulangerie-planning-api-4-pbfy.onrender.com/api/parameters');
      if (response.ok) {
        const params = await response.json();
        const margeVert = params.find(p => p.name === 'margeVert');
        const margeJaune = params.find(p => p.name === 'margeJaune');
        const margeOrange = params.find(p => p.name === 'margeOrange');
        setMarges({
          vert: margeVert?.kmValue || 100,
          jaune: margeJaune?.kmValue || 80,
          orange: margeOrange?.kmValue || 50
        });
      }
    } catch (error) {
      console.error('Erreur chargement marges:', error);
    }
  };

  // Sauvegarder les objectifs hebdomadaires
  const saveWeeklyObjectives = async () => {
    try {
      if (!selectedWeekStart) {
        alert('Veuillez sélectionner une semaine.');
        return;
      }
      const presencesPayload = buildPresencesPayload();

      const response = await fetch('https://boulangerie-planning-api-4-pbfy.onrender.com/api/daily-sales/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectifPromo: objectifHebdoPromo,
          objectifCartesFid: objectifHebdoCartesFid,
          presences: presencesPayload,
          weekStart: selectedWeekStart
        })
      });

      if (response.ok) {
        alert('Objectifs hebdomadaires enregistrés avec succès !');
        setPresences(presencesPayload);
        await fetchWeeklyStats(selectedWeekStart);
      }
    } catch (error) {
      console.error('Erreur sauvegarde objectifs:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  // Toggle présence
  const togglePresence = (employeeId, jour) => {
    setPresences(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [jour]: !prev[employeeId]?.[jour]
      }
    }));
  };

  const toggleEmployeeWeek = useCallback((employeeId) => {
    setPresences(prev => {
      const currentPresence = prev[employeeId] || {};
      const allChecked = WEEK_DAYS.every(jour => currentPresence[jour]);
      const newValue = !allChecked;
      const updatedPresence = {};
      WEEK_DAYS.forEach(jour => {
        updatedPresence[jour] = newValue;
      });
      return {
        ...prev,
        [employeeId]: updatedPresence
      };
    });
  }, []);

  const buildPresencesPayload = useCallback(() => {
    const payload = {};
    vendeuses.forEach(vendeuse => {
      const presence = presences[vendeuse._id] || {};
      const activeDays = {};
      WEEK_DAYS.forEach(jour => {
        if (presence[jour]) {
          activeDays[jour] = true;
        }
      });
      if (Object.keys(activeDays).length > 0) {
        payload[vendeuse._id] = activeDays;
      }
    });
    return payload;
  }, [vendeuses, presences]);

  const shiftWeek = useCallback((offset) => {
    const baseDate = selectedWeekStart ? new Date(selectedWeekStart) : new Date();
    if (Number.isNaN(baseDate.getTime())) {
      return;
    }
    const { start } = getWeekRangeFromDate(baseDate);
    start.setDate(start.getDate() + offset * 7);
    const { start: newStart } = getWeekRangeFromDate(start);
    setSelectedWeekStart(newStart.toISOString().split('T')[0]);
  }, [selectedWeekStart]);

  const handleWeekDateChange = useCallback((event) => {
    const { value } = event.target;
    if (!value) {
      return;
    }
    const pickedDate = new Date(value);
    if (Number.isNaN(pickedDate.getTime())) {
      return;
    }
    const { start } = getWeekRangeFromDate(pickedDate);
    setSelectedWeekStart(start.toISOString().split('T')[0]);
  }, []);

  const buildPresenceState = useCallback((rawPresences = {}) => {
    const result = {};
    vendeuses.forEach((vendeuse) => {
      const rawDays = rawPresences[vendeuse._id];
      const presence = {};
      const hasExplicitDays = rawDays && Object.keys(rawDays).length > 0;
      WEEK_DAYS.forEach((jour) => {
        if (hasExplicitDays) {
          presence[jour] = !!rawDays[jour];
        } else {
          presence[jour] = true;
        }
      });
      result[vendeuse._id] = presence;
    });
    return result;
  }, [vendeuses]);

  useEffect(() => {
    if (vendeuses.length === 0) {
      return;
    }
    setPresences((prev) => {
      const merged = buildPresenceState(prev);
      const prevKeys = Object.keys(prev);
      const mergedKeys = Object.keys(merged);
      const hasDifference = mergedKeys.length !== prevKeys.length ||
        mergedKeys.some((key) => {
          const prevEmployee = prev[key];
          if (!prevEmployee) {
            return true;
          }
          return WEEK_DAYS.some((jour) => merged[key][jour] !== !!prevEmployee[jour]);
        });
      if (!hasDifference) {
        return prev;
      }
      return merged;
    });
  }, [vendeuses, buildPresenceState]);

  // Charger les employés
  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://boulangerie-planning-api-4-pbfy.onrender.com/api/employees');
      if (response.ok) {
        const data = await response.json();
        // S'assurer que data est un tableau - gérer le nouveau format API
        let employeesArray = [];
        if (Array.isArray(data)) {
          employeesArray = data;
        } else if (data.success && Array.isArray(data.data)) {
          employeesArray = data.data;
        } else if (data.employees && Array.isArray(data.employees)) {
          employeesArray = data.employees;
        }
        setEmployees(employeesArray);
        console.log('✅ Employés chargés pour SalesStats:', employeesArray.length, employeesArray);
        
        // Initialiser les données de vente pour chaque employé
        const initialSalesData = {};
        employeesArray.forEach(emp => {
          initialSalesData[emp._id] = {
            caNetHt: 0,
            nbClients: 0,
            panierMoyen: 0,
            nbMenus: 0,
            nbCartesFid: 0,
            nbAvisPositifs: 0,
            nbAvisNegatifs: 0
          };
        });
        setSalesData(initialSalesData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    }
  };

  // Mettre à jour les données de vente
  const updateSalesData = (employeeId, field, value) => {
    setSalesData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  // Calculer le score d'un employé
  const calculateScore = (data) => {
    return data.caNetHt + (data.nbCartesFid * 500) + (data.nbAvisPositifs * 100) - (data.nbAvisNegatifs * 300);
  };



     // Supprimer les données du mois
   // const deleteSalesData = async () => {
   //   try {
   //     const response = await fetch(`https://boulangerie-planning-api-4-pbfy.onrender.com/api/sales-stats/period/${currentMonth}/${currentYear}`, {
   //       method: 'DELETE'
   //     });
   //     
   //     if (response.ok) {
   //       console.log('✅ Données supprimées avec succès');
   //       alert('Données du mois supprimées avec succès !');
   //     } else {
   //       console.error('❌ Erreur lors de la suppression');
   //       alert('Erreur lors de la suppression des données');
   //     }
   //   } catch (error) {
   //     console.error('Erreur lors de la suppression:', error);
   //     alert('Erreur lors de la suppression');
   //   }
   // }; // Non utilisé

   // Sauvegarder les données
   const saveSalesData = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        month: parseInt(currentMonth),
        year: currentYear,
        salesData: salesData
      };

      const response = await fetch('https://boulangerie-planning-api-4-pbfy.onrender.com/api/sales-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Données sauvegardées:', result);
        
        // Recharger les données sauvegardées
        await loadSalesDataForPeriod();
        
        // Recharger les statistiques mensuelles
        await loadMonthlyStats();
        
        alert('Données de vente sauvegardées avec succès !');
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur API:', errorData);
        alert(`Erreur lors de la sauvegarde: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données de vente pour la période actuelle
  const loadSalesDataForPeriod = useCallback(async () => {
    try {
      const response = await fetch(`https://boulangerie-planning-api-4-pbfy.onrender.com/api/sales-stats/period/${currentMonth}/${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.salesData) {
          // Mettre à jour l'état local avec les données sauvegardées
          const updatedSalesData = {};
          
          // Créer un mapping par nom d'employé car les IDs peuvent différer
          const employeeNameMapping = {};
          employees.forEach(emp => {
            employeeNameMapping[emp.name] = emp._id;
          });
          
          Object.keys(data.data.salesData).forEach(apiEmployeeId => {
            const employeeData = data.data.salesData[apiEmployeeId];
            const employeeName = employeeData.employeeName;
            
            // Trouver l'ID frontend correspondant au nom
            const frontendEmployeeId = employeeNameMapping[employeeName];
            
            if (frontendEmployeeId) {
              updatedSalesData[frontendEmployeeId] = {
                caNetHt: employeeData.caNetHt || 0,
                nbClients: employeeData.nbClients || 0,
                panierMoyen: employeeData.panierMoyen || 0,
                nbPromo: employeeData.nbPromo || employeeData.nbMenus || 0, // Support ancien format
                nbCartesFid: employeeData.nbCartesFid || 0,
                nbAvisPositifs: employeeData.nbAvisPositifs || 0,
                nbAvisNegatifs: employeeData.nbAvisNegatifs || 0
              };
            }
          });
          
          setSalesData(updatedSalesData);
          console.log('✅ Données rechargées par nom:', updatedSalesData);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de la période:', error);
    }
  }, [currentMonth, currentYear]);

  // Charger les données de la période actuelle au montage
  useEffect(() => {
    if (employees.length > 0 && currentMonth && currentYear) {
      loadSalesDataForPeriod();
    }
  }, [employees, currentMonth, currentYear, loadSalesDataForPeriod]);

  // Charger les statistiques mensuelles
  const loadMonthlyStats = useCallback(async () => {
    try {
      const response = await fetch(`https://boulangerie-planning-api-4-pbfy.onrender.com/api/sales-stats/monthly/${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonthlyStats(data.data || {});
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats mensuelles:', error);
    }
  }, [currentYear]);

  // Charger les stats au changement d'année
  useEffect(() => {
    if (currentYear) {
      loadMonthlyStats();
    }
  }, [currentYear, loadMonthlyStats]);

  // Charger les données de la période actuelle au montage et au changement de période
  useEffect(() => {
    if (currentMonth && currentYear) {
      // Nettoyer d'abord les données actuelles
      setSalesData({});
      // Puis charger les nouvelles données
      loadSalesDataForPeriod();
    }
  }, [currentMonth, currentYear, loadSalesDataForPeriod]);



  // Obtenir le nom du mois
  const getMonthName = (month) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[parseInt(month) - 1];
  };

  // Générer la liste des années pour les sélecteurs
  const generateYearOptions = () => {
    return Array.from({length: YEAR_RANGE}, (_, i) => {
      const year = new Date().getFullYear() - YEARS_BACK + i;
      return <option key={year} value={year}>{year}</option>;
    });
  };

  return (
    <div className="sales-stats-container">
      <div className="sales-stats-header">
        <h1>📊 Statistiques de Vente</h1>
                 <div className="period-selector">
           <select 
             value={currentMonth} 
             onChange={(e) => setCurrentMonth(e.target.value)}
             className="month-select"
           >
             {Array.from({length: 12}, (_, i) => (
               <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                 {getMonthName(String(i + 1).padStart(2, '0'))}
               </option>
             ))}
           </select>
           <select 
             value={currentYear} 
             onChange={(e) => setCurrentYear(parseInt(e.target.value))}
             className="year-select"
           >
             {generateYearOptions()}
           </select>
           <button 
             onClick={() => {
               setSalesData({});
               loadSalesDataForPeriod();
             }}
             className="refresh-button"
             title="Actualiser les données du mois sélectionné"
           >
             🔄 Actualiser
           </button>
         </div>
      </div>

      <div className="sales-stats-content">
        {/* Section Objectifs Hebdomadaires */}
        <div className="sales-form-section">
          <h2>🎯 Objectifs Hebdomadaires</h2>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="week-selector-block">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Semaine à planifier :
              </label>
              <div className="week-selector-controls">
                <button
                  type="button"
                  onClick={() => shiftWeek(-1)}
                  className="week-nav-button"
                  title="Semaine précédente"
                >
                  ◀
                </button>
                <input
                  type="date"
                  value={selectedWeekStart}
                  onChange={handleWeekDateChange}
                  className="week-date-input"
                />
                <button
                  type="button"
                  onClick={() => shiftWeek(1)}
                  className="week-nav-button"
                  title="Semaine suivante"
                >
                  ▶
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Objectif Hebdomadaire total Carte Fidélité :
              </label>
              <input
                type="number"
                value={objectifHebdoCartesFid}
                onChange={(e) => setObjectifHebdoCartesFid(parseFloat(e.target.value) || 0)}
                style={{ padding: '10px', borderRadius: '8px', border: '2px solid #667eea', width: '200px' }}
                min="0"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Objectif Hebdomadaire total Quinzaine Promo :
              </label>
              <input
                type="number"
                value={objectifHebdoPromo}
                onChange={(e) => setObjectifHebdoPromo(parseFloat(e.target.value) || 0)}
                style={{ padding: '10px', borderRadius: '8px', border: '2px solid #667eea', width: '200px' }}
                min="0"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={saveWeeklyObjectives}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                💾 Enregistrer Objectifs
              </button>
            </div>
          </div>

          {/* Tableau des présences */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '15px' }}>📅 Présences des Vendeuses</h3>
            <div className="week-info-bar">
              <div className="week-info-text">
                {weekInfo.weekNumber
                  ? `Semaine ${weekInfo.weekNumber} · du ${weekInfo.startLabel} au ${weekInfo.endLabel}`
                  : `Semaine du ${weekInfo.startLabel} au ${weekInfo.endLabel}`}
              </div>
              <div className="weekly-objective-summary">
                <span className="objective-pill objective-pill-fid">🎫 {objectifParPresenceCartesFid} / présence</span>
                <span className="objective-pill objective-pill-promo">🍔 {objectifParPresencePromo} / présence</span>
                <span className="objective-pill objective-pill-total-fid">🎯 Total cartes : {totalCartesObjective}</span>
                <span className="objective-pill objective-pill-total-promo">🔥 Total promo : {totalPromoObjective}</span>
                <span className="objective-pill objective-pill-count">✅ {totalCheckedBoxes} présence{totalCheckedBoxes > 1 ? 's' : ''}</span>
              </div>
            </div>
            <table className="presence-table">
              <thead>
                <tr>
                  <th className="presence-header-name">Vendeuse</th>
                  <th className="presence-master-header">Semaine</th>
                  {WEEK_DAYS.map(jour => (
                    <th key={jour} className="presence-day-header">{jour}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendeuses.map((vendeuse) => {
                  const presence = presences[vendeuse._id] || {};
                  const employeePresenceCount = WEEK_DAYS.reduce((count, jour) => (
                    presence[jour] ? count + 1 : count
                  ), 0);
                  const areAllDaysChecked = WEEK_DAYS.every(jour => presence[jour]);
                  const hasSomeDaysChecked = employeePresenceCount > 0 && !areAllDaysChecked;
                  const objectifFidEmployee = employeePresenceCount * objectifParPresenceCartesFid;
                  const objectifPromoEmployee = employeePresenceCount * objectifParPresencePromo;

                  return (
                    <tr key={vendeuse._id}>
                      <td className="presence-name-cell">
                        <div className="presence-employee-name">{vendeuse.name}</div>
                        <div className="employee-weekly-targets">
                          <span className="target-badge target-fid">🎯 Carte : {objectifFidEmployee}</span>
                          <span className="target-badge target-promo">🔥 Promo : {objectifPromoEmployee}</span>
                          <span className="target-badge target-days">✅ {employeePresenceCount} jour{employeePresenceCount > 1 ? 's' : ''}</span>
                        </div>
                      </td>
                      <td className="presence-master-cell">
                        <input
                          type="checkbox"
                          checked={areAllDaysChecked && employeePresenceCount > 0}
                          ref={(element) => {
                            if (element) {
                              element.indeterminate = hasSomeDaysChecked;
                            }
                          }}
                          onChange={() => toggleEmployeeWeek(vendeuse._id)}
                        />
                      </td>
                      {WEEK_DAYS.map(jour => (
                        <td key={jour} className="day-checkbox">
                          <input
                            type="checkbox"
                            checked={!!presence[jour]}
                            onChange={() => togglePresence(vendeuse._id, jour)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulaire de saisie */}
        <div className="sales-form-section">
          <h2>📝 Saisie des données mensuelles</h2>
          <div className="sales-form">
            <table className="sales-form-table">
              <thead>
                <tr>
                  <th>Vendeuse</th>
                  <th>CA Net HT</th>
                  <th>Nb Clients</th>
                  <th>Panier Moyen</th>
                  <th>Nb Promo</th>
                  <th>Nb Cartes Fid</th>
                                     <th>Nb Avis +</th>
                   <th>Nb Avis -</th>
                   <th>Score</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {(() => {
                   console.log('🔍 Rendu tableau SalesStats - employés:', employees.length, employees);
                   return Array.isArray(employees) && employees.length > 0 ? employees.map(emp => (
                   <tr key={emp._id}>
                     <td className="employee-name">{emp.name}</td>
                     <td>
                       <input
                         type="number"
                         value={salesData[emp._id]?.caNetHt || 0}
                         onChange={(e) => updateSalesData(emp._id, 'caNetHt', e.target.value)}
                         placeholder="0"
                         min="0"
                         step="0.01"
                       />
                     </td>
                     <td>
                       <input
                         type="number"
                         value={salesData[emp._id]?.nbClients || 0}
                         onChange={(e) => updateSalesData(emp._id, 'nbClients', e.target.value)}
                         placeholder="0"
                         min="0"
                       />
                     </td>
                     <td>
                       <input
                         type="number"
                         value={salesData[emp._id]?.panierMoyen || 0}
                         onChange={(e) => updateSalesData(emp._id, 'panierMoyen', e.target.value)}
                         placeholder="0"
                         min="0"
                         step="0.01"
                       />
                     </td>
                     <td>
                       <input
                         type="number"
                         value={salesData[emp._id]?.nbPromo || 0}
                         onChange={(e) => updateSalesData(emp._id, 'nbPromo', e.target.value)}
                         placeholder="0"
                         min="0"
                       />
                     </td>
                     <td>
                       <input
                         type="number"
                         value={salesData[emp._id]?.nbCartesFid || 0}
                         onChange={(e) => updateSalesData(emp._id, 'nbCartesFid', e.target.value)}
                         placeholder="0"
                         min="0"
                       />
                     </td>
                     <td>
                       <input
                         type="number"
                         value={salesData[emp._id]?.nbAvisPositifs || 0}
                         onChange={(e) => updateSalesData(emp._id, 'nbAvisPositifs', e.target.value)}
                         placeholder="0"
                         min="0"
                       />
                     </td>
                     <td>
                       <input
                         type="number"
                         value={salesData[emp._id]?.nbAvisNegatifs || 0}
                         onChange={(e) => updateSalesData(emp._id, 'nbAvisNegatifs', e.target.value)}
                         placeholder="0"
                         min="0"
                       />
                     </td>
                     <td className="score-cell">
                       <strong>{calculateScore(salesData[emp._id] || {}).toFixed(0)}</strong>
                     </td>
                     <td className="actions-cell">
                       <button
                         onClick={() => {
                           if (window.confirm(`⚠️ Êtes-vous sûr de vouloir effacer les données de ${emp.name} pour ce mois ?`)) {
                             // Effacer les données de cet employé spécifique
                             const updatedData = { ...salesData };
                             updatedData[emp._id] = {
                               caNetHt: 0,
                               nbClients: 0,
                               panierMoyen: 0,
                               nbPromo: 0,
                               nbCartesFid: 0,
                               nbAvisPositifs: 0,
                               nbAvisNegatifs: 0
                             };
                             setSalesData(updatedData);
                           }
                         }}
                         className="delete-employee-button"
                         title={`Effacer les données de ${emp.name}`}
                       >
                         🗑️
                       </button>
                     </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan="10" style={{textAlign: 'center', padding: '20px'}}>
                       Aucun employé trouvé
                     </td>
                   </tr>
                 );
                 })()}
               </tbody>
            </table>
            
                         <div className="form-actions">
               <button 
                 onClick={saveSalesData} 
                 disabled={loading}
                 className="save-button"
               >
                 {loading ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
               </button>
             </div>
          </div>
        </div>

                 {/* Classement des vendeuses */}
         <div className="ranking-section">
           <h2>🏆 Classement des Vendeuses</h2>
           <div className="ranking-header">
             <div className="ranking-selectors">
               <div className="selector-group">
                 <label>Mois :</label>
                 <select 
                   value={currentMonth} 
                   onChange={(e) => setCurrentMonth(e.target.value)}
                   className="month-select-ranking"
                 >
                   {Array.from({length: 12}, (_, i) => (
                     <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                       {getMonthName(String(i + 1).padStart(2, '0'))}
                     </option>
                   ))}
                 </select>
               </div>
               <div className="selector-group">
                 <label>Année :</label>
                 <select 
                   value={currentYear} 
                   onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                   className="year-select-ranking"
                 >
                   {generateYearOptions()}
                 </select>
               </div>
             </div>
           </div>
           <div className="ranking-table">
             <table>
               <thead>
                 <tr>
                   <th>Rang</th>
                   <th>Vendeuse</th>
                   <th>Score</th>
                   <th>CA Net HT</th>
                   <th>Cartes Fid</th>
                   <th>Avis +</th>
                   <th>Avis -</th>
                 </tr>
               </thead>
               <tbody>
                 {employees
                   .map(emp => {
                     const data = salesData[emp._id] || {};
                     const score = calculateScore(data);
                     return { emp, data, score };
                   })
                   .sort((a, b) => b.score - a.score) // Trier par score décroissant
                   .map(({ emp, data, score }, index) => (
                     <tr key={emp._id} className={index < 3 ? 'top-three' : ''}>
                       <td className="rank">#{index + 1}</td>
                       <td className="employee-name">{emp.name}</td>
                       <td className="score"><strong>{score.toFixed(0)}</strong></td>
                       <td>{data.caNetHt || 0}€</td>
                       <td>{data.nbCartesFid || 0}</td>
                       <td className="positive">{data.nbAvisPositifs || 0}</td>
                       <td className="negative">{data.nbAvisNegatifs || 0}</td>
                     </tr>
                   ))}
               </tbody>
             </table>
             
             {/* Total annuel */}
             <div className="annual-total">
               <h3>📊 Total Année {currentYear}</h3>
               <div className="total-stats">
                 <div className="total-item">
                   <span className="total-label">CA Total :</span>
                   <span className="total-value">
                     {employees.reduce((sum, emp) => sum + (salesData[emp._id]?.caNetHt || 0), 0).toFixed(2)}€
                   </span>
                 </div>
                 <div className="total-item">
                   <span className="total-label">Cartes Fid Total :</span>
                   <span className="total-value">
                     {employees.reduce((sum, emp) => sum + (salesData[emp._id]?.nbCartesFid || 0), 0)}
                   </span>
                 </div>
                 <div className="total-item">
                   <span className="total-label">Avis + Total :</span>
                   <span className="total-value positive">
                     {employees.reduce((sum, emp) => sum + (salesData[emp._id]?.nbAvisPositifs || 0), 0)}
                   </span>
                 </div>
                 <div className="total-item">
                   <span className="total-label">Avis - Total :</span>
                   <span className="total-value negative">
                     {employees.reduce((sum, emp) => sum + (salesData[emp._id]?.nbAvisNegatifs || 0), 0)}
                   </span>
                 </div>
               </div>
             </div>
           </div>
         </div>

        

                 {/* Comparaison sur 12 mois */}
         <div className="monthly-comparison-section">
           <h2>📈 Comparaison sur 12 mois</h2>
           <div className="monthly-comparison-header">
             <div className="year-selector">
               <label>Année :</label>
               <select 
                 value={currentYear} 
                 onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                 className="year-select-compare"
               >
                 {generateYearOptions()}
               </select>
             </div>
           </div>
           <div className="monthly-stats">
             <table>
               <thead>
                 <tr>
                   <th>Mois</th>
                   <th>CA Total</th>
                   <th>Clients Total</th>
                   <th>Cartes Fid Total</th>
                   <th>Avis + Total</th>
                   <th>Avis - Total</th>
                 </tr>
               </thead>
               <tbody>
                 {Array.from({length: 12}, (_, i) => {
                   const month = String(i + 1).padStart(2, '0');
                   const monthData = monthlyStats[month] || {};
                   
                   return (
                     <tr key={month} className={month === currentMonth ? 'current-month' : ''}>
                       <td>{getMonthName(month)}</td>
                       <td>{monthData.totalCA || 0}€</td>
                       <td>{monthData.totalClients || 0}</td>
                       <td>{monthData.totalCartesFid || 0}</td>
                       <td className="positive">{monthData.totalAvisPositifs || 0}</td>
                       <td className="negative">{monthData.totalAvisNegatifs || 0}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
         </div>

        {/* Section Cumul Hebdomadaire avec Comparaison */}
        {weeklyStats && (
          <div className="sales-form-section">
            <h2>📊 Cumul Hebdomadaire vs Objectifs</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              {/* Cartes Fidélité */}
              <div style={{
                padding: '20px',
                borderRadius: '15px',
                background: weeklyStats.colorCartesFid === 'green' ? '#d4edda' :
                            weeklyStats.colorCartesFid === 'yellow' ? '#fff3cd' :
                            weeklyStats.colorCartesFid === 'orange' ? '#ffeaa7' : '#f8d7da',
                border: `3px solid ${
                  weeklyStats.colorCartesFid === 'green' ? '#28a745' :
                  weeklyStats.colorCartesFid === 'yellow' ? '#ffc107' :
                  weeklyStats.colorCartesFid === 'orange' ? '#ff9800' : '#dc3545'
                }`
              }}>
                <h3 style={{ marginBottom: '15px' }}>🎫 Cartes Fidélité</h3>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  <strong>Total Semaine :</strong> {weeklyStats.totalCartesFid}
                </div>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  <strong>Objectif :</strong> {weeklyStats.objectifCartesFid}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '15px' }}>
                  {weeklyStats.pourcentageCartesFid.toFixed(1)}%
                </div>
              </div>

              {/* Promo Quinzaine */}
              <div style={{
                padding: '20px',
                borderRadius: '15px',
                background: weeklyStats.colorPromo === 'green' ? '#d4edda' :
                            weeklyStats.colorPromo === 'yellow' ? '#fff3cd' :
                            weeklyStats.colorPromo === 'orange' ? '#ffeaa7' : '#f8d7da',
                border: `3px solid ${
                  weeklyStats.colorPromo === 'green' ? '#28a745' :
                  weeklyStats.colorPromo === 'yellow' ? '#ffc107' :
                  weeklyStats.colorPromo === 'orange' ? '#ff9800' : '#dc3545'
                }`
              }}>
                <h3 style={{ marginBottom: '15px' }}>🍔 Promo Quinzaine</h3>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  <strong>Total Semaine :</strong> {weeklyStats.totalPromo}
                </div>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  <strong>Objectif :</strong> {weeklyStats.objectifPromo}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '15px' }}>
                  {weeklyStats.pourcentagePromo.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesStats;
