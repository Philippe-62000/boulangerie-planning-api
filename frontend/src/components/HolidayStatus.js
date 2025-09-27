import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './HolidayStatus.css';

const HolidayStatus = () => {
  console.log('🏖️ HolidayStatus - Composant chargé');
  console.log('🏖️ HolidayStatus - URL actuelle:', window.location.href);
  
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validatedHolidays, setValidatedHolidays] = useState(new Set());
  const [rejectedHolidays, setRejectedHolidays] = useState(new Set());

  // Charger automatiquement les données au montage du composant
  useEffect(() => {
    console.log('🏖️ HolidayStatus - Chargement automatique des données');
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des congés depuis l\'API backend...');
      
      // Utiliser l'API backend pour récupérer les demandes de congés
      const response = await api.get('/vacation-requests?city=Arras');
      const data = response.data;
      
      console.log('📊 Données reçues:', data);
      console.log('📊 Structure des données:', {
        success: data.success,
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        firstItem: data.data?.[0]
      });
      
      if (data.success && data.data) {
        const holidaysData = data.data.map(vacation => ({
          id: vacation._id,
          timestamp: new Date(vacation.uploadDate).toLocaleString('fr-FR'),
          boulangerie: vacation.city || 'Arras',
          nom: vacation.employeeName.split(' ')[1] || '',
          prenom: vacation.employeeName.split(' ')[0] || '',
          dateDebut: new Date(vacation.startDate).toLocaleDateString('fr-FR'),
          dateFin: new Date(vacation.endDate).toLocaleDateString('fr-FR'),
          commentaire: vacation.precisions || '',
          status: vacation.status,
          duration: vacation.duration,
          reason: vacation.reason,
          employeeEmail: vacation.employeeEmail
        }));

        console.log('✅ Congés récupérés depuis l\'API:', holidaysData);
        console.log('✅ Nombre de congés:', holidaysData.length);
        console.log('✅ Congés validés:', holidaysData.filter(h => h.status === 'validated').length);
        setHolidays(holidaysData);
      } else {
        console.log('⚠️ Aucune donnée reçue ou format invalide');
        setHolidays([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des congés:', error);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (holidayId) => {
    try {
      console.log('✅ Validation de la demande:', holidayId);
      await api.patch(`/vacation-requests/${holidayId}/validate`, {
        validatedBy: 'Admin',
        notes: 'Validé via tableau de bord'
      });
      
      // Recharger les données
      await fetchHolidays();
      console.log('✅ Demande validée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
    }
  };

  const handleReject = async (holidayId) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;
    
    try {
      console.log('❌ Rejet de la demande:', holidayId);
      await api.patch(`/vacation-requests/${holidayId}/reject`, {
        rejectedBy: 'Admin',
        reason: reason
      });
      
      // Recharger les données
      await fetchHolidays();
      console.log('❌ Demande rejetée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rejet:', error);
    }
  };

  const handleEdit = (holidayId) => {
    // Ouvrir la page de gestion des congés pour modifier
    window.open(`/vacation-request-admin`, '_blank');
  };

  const getStatus = (holiday) => {
    return holiday.status || 'pending';
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
    const validatedHolidaysList = holidays.filter(h => h.status === 'validated');
    
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
        <div style={{ 
          background: '#17a2b8', 
          color: 'white', 
          padding: '5px 10px', 
          margin: '5px 0',
          borderRadius: '3px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          🚀 DÉPLOIEMENT #002 - {new Date().toLocaleString()}
        </div>
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
            disabled={holidays.filter(h => h.status === 'validated').length === 0}
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
          <span className="stat-number">{holidays.filter(h => h.status === 'validated').length}</span>
          <span className="stat-label">Validés</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{holidays.filter(h => h.status === 'rejected').length}</span>
          <span className="stat-label">Rejetés</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{holidays.filter(h => h.status === 'pending').length}</span>
          <span className="stat-label">En attente</span>
        </div>
      </div>

      <div className="holiday-info">
        <p>📊 Utilisez le bouton "Imprimer Planning" pour voir le calendrier des congés validés.</p>
        <p>📋 Pour gérer les demandes de congés, utilisez la page "Gestion des congés".</p>
      </div>
    </div>
  );
};

export default HolidayStatus;
