import React from 'react';
import './VacationPlanning.css';

const VacationPlanning = () => {
  console.log('📅 VacationPlanning - Composant chargé');
  console.log('📅 VacationPlanning - URL actuelle:', window.location.href);
  
  // Version simplifiée pour diagnostiquer le problème
  return (
    <div className="vacation-planning">
      <h1>📅 Planning des Congés - Test</h1>
      <p>Le composant VacationPlanning se charge correctement !</p>
      <p>URL: {window.location.href}</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
      <div style={{ 
        background: '#28a745', 
        color: 'white', 
        padding: '10px', 
        margin: '10px 0',
        borderRadius: '5px',
        fontWeight: 'bold'
      }}>
        🚀 DÉPLOIEMENT #003 - {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default VacationPlanning;