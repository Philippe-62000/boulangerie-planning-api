import React, { useState, useEffect } from 'react';
import './HolidayStatus.css';

const HolidayStatus = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validatedHolidays, setValidatedHolidays] = useState(new Set());
  const [rejectedHolidays, setRejectedHolidays] = useState(new Set());

  // URL du Google Sheets (format CSV)
  const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1HEPOWUMdbdqzpsrjBjqquTVPlDbyQv_y34c30rIaikM/edit?gid=781548784&export=format=csv';

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      // Utiliser un proxy CORS ou une API backend pour récupérer les données
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(GOOGLE_SHEETS_URL)}`);
      const data = await response.json();
      
      // Parser le CSV
      const csvData = data.contents;
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      const holidaysData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          return {
            id: values[0] || Math.random().toString(36).substr(2, 9),
            timestamp: values[0],
            boulangerie: values[1],
            nom: values[2],
            prenom: values[3],
            dateDebut: values[4],
            dateFin: values[5],
            commentaire: values[6] || ''
          };
        })
        .filter(holiday => holiday.boulangerie && holiday.boulangerie.toLowerCase().includes('arras'));

      setHolidays(holidaysData);
    } catch (error) {
      console.error('Erreur lors du chargement des congés:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleValidate = (holidayId) => {
    setValidatedHolidays(prev => new Set([...prev, holidayId]));
    setRejectedHolidays(prev => {
      const newSet = new Set(prev);
      newSet.delete(holidayId);
      return newSet;
    });
  };

  const handleReject = (holidayId) => {
    setRejectedHolidays(prev => new Set([...prev, holidayId]));
    setValidatedHolidays(prev => {
      const newSet = new Set(prev);
      newSet.delete(holidayId);
      return newSet;
    });
  };

  const getStatus = (holidayId) => {
    if (validatedHolidays.has(holidayId)) return 'validated';
    if (rejectedHolidays.has(holidayId)) return 'rejected';
    return 'pending';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'validated': return '✅ Validé';
      case 'rejected': return '❌ Rejeté';
      default: return '⏳ En attente';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'validated': return 'status-validated';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const generatePlanning = () => {
    const validatedHolidaysList = holidays.filter(h => validatedHolidays.has(h.id));
    
    // Créer un planning A4 paysage
    const planningWindow = window.open('', '_blank');
    planningWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Planning Annuel - Congés Validés</title>
        <style>
          @page { 
            size: A4 landscape; 
            margin: 1cm; 
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .planning-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 2px;
            margin-bottom: 20px;
          }
          .month-header {
            background: #f0f0f0;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
          }
          .holiday-item {
            background: #e8f5e8;
            padding: 5px;
            margin: 2px 0;
            border: 1px solid #ccc;
            font-size: 10px;
            border-radius: 3px;
          }
          .employee-name {
            font-weight: bold;
          }
          .dates {
            color: #666;
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Planning Annuel - Congés Validés</h1>
          <p>Boulangerie Arras - ${new Date().getFullYear()}</p>
        </div>
        
        <div class="planning-grid">
          ${Array.from({ length: 12 }, (_, i) => {
            const monthName = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                              'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i];
            const monthHolidays = validatedHolidaysList.filter(h => {
              const startMonth = new Date(h.dateDebut).getMonth();
              return startMonth === i;
            });
            
            return `
              <div class="month-header">${monthName}</div>
              <div>
                ${monthHolidays.map(h => `
                  <div class="holiday-item">
                    <div class="employee-name">${h.prenom} ${h.nom}</div>
                    <div class="dates">${h.dateDebut} - ${h.dateFin}</div>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `);
    planningWindow.document.close();
    planningWindow.print();
  };

  if (loading) {
    return (
      <div className="holiday-status">
        <div className="loading-container">
          <div className="loading"></div>
          <p>Chargement des congés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="holiday-status">
      <div className="holiday-header">
        <h3>🏖️ État des Congés</h3>
        <div className="holiday-actions">
          <button 
            className="btn btn-primary"
            onClick={fetchHolidays}
            disabled={loading}
          >
            🔄 Actualiser
          </button>
          <button 
            className="btn btn-success"
            onClick={generatePlanning}
            disabled={validatedHolidays.size === 0}
          >
            🖨️ Imprimer Planning
          </button>
        </div>
      </div>

      <div className="holiday-stats">
        <div className="stat-item">
          <span className="stat-number">{holidays.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{validatedHolidays.size}</span>
          <span className="stat-label">Validés</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{rejectedHolidays.size}</span>
          <span className="stat-label">Rejetés</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{holidays.length - validatedHolidays.size - rejectedHolidays.size}</span>
          <span className="stat-label">En attente</span>
        </div>
      </div>

      <div className="holiday-list">
        {holidays.length === 0 ? (
          <div className="no-data">
            <p>Aucune demande de congé trouvée pour Arras</p>
          </div>
        ) : (
          holidays.map((holiday) => {
            const status = getStatus(holiday.id);
            return (
              <div key={holiday.id} className={`holiday-card ${getStatusClass(status)}`}>
                <div className="holiday-info">
                  <div className="employee-info">
                    <strong>{holiday.prenom} {holiday.nom}</strong>
                    <span className="boulangerie">{holiday.boulangerie}</span>
                  </div>
                  <div className="dates-info">
                    <span className="date-range">
                      {holiday.dateDebut} → {holiday.dateFin}
                    </span>
                    {holiday.commentaire && (
                      <span className="comment">{holiday.commentaire}</span>
                    )}
                  </div>
                </div>
                <div className="holiday-actions">
                  <span className={`status ${getStatusClass(status)}`}>
                    {getStatusText(status)}
                  </span>
                  <div className="action-buttons">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleValidate(holiday.id)}
                      disabled={status === 'validated'}
                    >
                      ✅ Valider
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReject(holiday.id)}
                      disabled={status === 'rejected'}
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HolidayStatus;
