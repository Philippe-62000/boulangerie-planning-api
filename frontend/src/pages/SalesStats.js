import React, { useState, useEffect } from 'react';
import './SalesStats.css';

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

  // Initialiser le mois et l'année actuels
  useEffect(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

  // Charger les employés au montage
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Charger les données de la période actuelle au montage
  useEffect(() => {
    if (employees.length > 0 && currentMonth && currentYear) {
      loadSalesDataForPeriod();
    }
  }, [employees, currentMonth, currentYear]);

  // Charger les employés
  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://boulangerie-planning-api-3.onrender.com/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        
        // Initialiser les données de vente pour chaque employé
        const initialSalesData = {};
        data.forEach(emp => {
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
   const deleteSalesData = async () => {
     try {
       const response = await fetch(`https://boulangerie-planning-api-3.onrender.com/api/sales-stats/period/${currentMonth}/${currentYear}`, {
         method: 'DELETE'
       });
       
       if (response.ok) {
         console.log('✅ Données supprimées avec succès');
         alert('Données du mois supprimées avec succès !');
       } else {
         console.error('❌ Erreur lors de la suppression');
         alert('Erreur lors de la suppression des données');
       }
     } catch (error) {
       console.error('Erreur lors de la suppression:', error);
       alert('Erreur lors de la suppression');
     }
   };

   // Sauvegarder les données
   const saveSalesData = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        month: parseInt(currentMonth),
        year: currentYear,
        salesData: salesData
      };

      const response = await fetch('https://boulangerie-planning-api-3.onrender.com/api/sales-stats', {
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
  const loadSalesDataForPeriod = async () => {
    try {
      const response = await fetch(`https://boulangerie-planning-api-3.onrender.com/api/sales-stats/period/${currentMonth}/${currentYear}`);
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
                nbMenus: employeeData.nbMenus || 0,
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
  };

  // Charger les statistiques mensuelles
  const loadMonthlyStats = async () => {
    try {
      const response = await fetch(`https://boulangerie-planning-api-3.onrender.com/api/sales-stats/monthly/${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonthlyStats(data.data || {});
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats mensuelles:', error);
    }
  };

  // Charger les stats au changement d'année
  useEffect(() => {
    if (currentYear) {
      loadMonthlyStats();
    }
  }, [currentYear]);

  // Charger les données de la période actuelle au montage et au changement de période
  useEffect(() => {
    if (currentMonth && currentYear) {
      // Nettoyer d'abord les données actuelles
      setSalesData({});
      // Puis charger les nouvelles données
      loadSalesDataForPeriod();
    }
  }, [currentMonth, currentYear]);



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
                  <th>Nb Menus</th>
                  <th>Nb Cartes Fid</th>
                                     <th>Nb Avis +</th>
                   <th>Nb Avis -</th>
                   <th>Score</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {employees.map(emp => (
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
                         value={salesData[emp._id]?.nbMenus || 0}
                         onChange={(e) => updateSalesData(emp._id, 'nbMenus', e.target.value)}
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
                               nbMenus: 0,
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
                 ))}
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
      </div>
    </div>
  );
};

export default SalesStats;
