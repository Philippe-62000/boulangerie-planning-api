import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import DocumentsSection from '../components/DocumentsSection';
import './EmployeeDashboard.css';

const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api';

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

const formatDateForInput = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

const getDayNameFromDate = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to 6
  return WEEK_DAYS[dayIndex];
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
  return formatter.format(date);
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [generalDocuments, setGeneralDocuments] = useState([]);
  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [weeklyObjectives, setWeeklyObjectives] = useState({ objectifCartesFid: 0, objectifPromo: 0, presences: {} });
  const [selectedWeekStart, setSelectedWeekStart] = useState('');

  useEffect(() => {
    if (user) {
      loadDocuments();
      // Initialiser la semaine en cours
      const now = new Date();
      const { start } = getWeekRangeFromDate(now);
      setSelectedWeekStart(formatDateForInput(start));
    }
  }, [user]);

  // Charger les stats hebdomadaires
  useEffect(() => {
    if (selectedWeekStart && user?.employeeId) {
      fetchWeeklyStats();
      fetchWeeklyObjectives();
    }
  }, [selectedWeekStart, user?.employeeId]);

  const fetchWeeklyStats = async () => {
    try {
      const url = new URL(`${API_BASE_URL}/daily-sales/weekly`);
      url.searchParams.set('weekStart', selectedWeekStart);
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
  };

  const fetchWeeklyObjectives = async () => {
    try {
      const url = new URL(`${API_BASE_URL}/daily-sales/objectives`);
      url.searchParams.set('weekStart', selectedWeekStart);
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWeeklyObjectives({
            objectifCartesFid: data.data.objectifCartesFid || 0,
            objectifPromo: data.data.objectifPromo || 0,
            presences: data.data.presences || {}
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement objectifs:', error);
    }
  };

  // Calculer les métriques de l'employé pour la semaine
  const employeeMetrics = useMemo(() => {
    if (!weeklyStats?.dailySales || !user?.employeeId) {
      return { totalCartes: 0, totalPromo: 0, perDay: {} };
    }
    const aggregated = {
      totalCartes: 0,
      totalPromo: 0,
      perDay: {}
    };
    
    weeklyStats.dailySales.forEach((sale) => {
      const saleEmployeeId = sale.employeeId?._id || sale.employeeId;
      if (saleEmployeeId?.toString() === user.employeeId?.toString()) {
        const cartesValue = parseInt(sale.nbCartesFid, 10) || 0;
        const promoValue = parseInt(sale.nbPromo, 10) || 0;

        aggregated.totalCartes += cartesValue;
        aggregated.totalPromo += promoValue;

        const dayLabel = getDayNameFromDate(sale.date);
        if (dayLabel) {
          const dayEntry = aggregated.perDay[dayLabel] || { cartes: 0, promo: 0 };
          dayEntry.cartes += cartesValue;
          dayEntry.promo += promoValue;
          aggregated.perDay[dayLabel] = dayEntry;
        }
      }
    });
    
    return aggregated;
  }, [weeklyStats, user?.employeeId]);

  // Calculer les objectifs par présence
  const employeePresence = weeklyObjectives.presences[user?.employeeId] || {};
  const presenceCount = WEEK_DAYS.filter(jour => employeePresence[jour]).length;
  const objectifParPresenceCartesFid = presenceCount > 0
    ? Math.ceil(weeklyObjectives.objectifCartesFid / (Object.values(weeklyObjectives.presences).reduce((sum, pres) => {
        return sum + Object.values(pres || {}).filter(Boolean).length;
      }, 0) || 1))
    : 0;
  const objectifParPresencePromo = presenceCount > 0
    ? Math.ceil(weeklyObjectives.objectifPromo / (Object.values(weeklyObjectives.presences).reduce((sum, pres) => {
        return sum + Object.values(pres || {}).filter(Boolean).length;
      }, 0) || 1))
    : 0;

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Charger les documents généraux
      const generalResponse = await api.get('/documents/general');
      if (generalResponse.data.success) {
        setGeneralDocuments(generalResponse.data.data);
      }
      
      // Charger les documents personnels si l'utilisateur a un ID employé
      if (user.employeeId) {
        const personalResponse = await api.get(`/documents/personal/${user.employeeId}`);
        if (personalResponse.data.success) {
          setPersonalDocuments(personalResponse.data.data);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, documentTitle) => {
    try {
      console.log('⬇️ Téléchargement document:', documentId);
      
      // Construire l'URL de téléchargement avec l'ID employé si nécessaire
      let downloadUrl = `/documents/${documentId}/download`;
      if (user.employeeId) {
        downloadUrl += `?employeeId=${user.employeeId}`;
      }
      
      // Créer un lien de téléchargement temporaire
      const link = document.createElement('a');
      link.href = `${import.meta.env.VITE_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api'}${downloadUrl}`;
      link.download = documentTitle;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`📥 Téléchargement de "${documentTitle}" démarré`);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du document');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'notice': '📋',
      'procedure': '📝',
      'formation': '🎓',
      'payslip': '💰',
      'contract': '📄',
      'other': '📁'
    };
    return icons[category] || '📄';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'notice': 'Notice',
      'procedure': 'Procédure',
      'formation': 'Formation',
      'payslip': 'Fiche de paie',
      'contract': 'Contrat',
      'other': 'Autre'
    };
    return labels[category] || category;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="employee-dashboard">
        <div className="loading-container">
          <div className="loading"></div>
          <p>Chargement de vos documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <h1>📁 Mes Documents</h1>
        <p>Bienvenue {user?.name || 'Employé'}, consultez vos documents personnels et généraux</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          📋 Documents Généraux ({generalDocuments.length})
        </button>
        <button 
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          👤 Mes Documents ({personalDocuments.length})
        </button>
        <button 
          className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          📊 Mes Ventes
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'general' ? (
          <DocumentsSection
            title="📋 Documents Généraux"
            description="Documents accessibles à tous les employés"
            documents={generalDocuments}
            onDownload={handleDownload}
            getCategoryIcon={getCategoryIcon}
            getCategoryLabel={getCategoryLabel}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
            emptyMessage="Aucun document général disponible"
          />
        ) : activeTab === 'sales' ? (
          <div style={{ padding: '2rem' }}>
            <h2>📊 Mes Ventes - Semaine en cours</h2>
            
            {selectedWeekStart && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Semaine :
                </label>
                <input
                  type="week"
                  value={(() => {
                    const weekStart = new Date(selectedWeekStart);
                    const year = weekStart.getFullYear();
                    const weekNumber = Math.ceil((weekStart - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
                    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
                  })()}
                  onChange={(e) => {
                    const [year, week] = e.target.value.split('-W');
                    const date = new Date(year, 0, 1);
                    const dayOfWeek = date.getDay() || 7;
                    const diff = (parseInt(week) - 1) * 7 + (1 - dayOfWeek);
                    date.setDate(date.getDate() + diff);
                    setSelectedWeekStart(formatDateForInput(date));
                  }}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            )}

            {selectedWeekStart && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <p><strong>Semaine :</strong> {formatWeekDate(new Date(selectedWeekStart))} au {formatWeekDate(new Date(new Date(selectedWeekStart).setDate(new Date(selectedWeekStart).getDate() + 6)))}</p>
                <p><strong>Objectif par présence :</strong> 🎯 {objectifParPresenceCartesFid} cartes fidélité / 🔥 {objectifParPresencePromo} promo quinzaine</p>
                <p><strong>Mes présences :</strong> {presenceCount} jour{presenceCount > 1 ? 's' : ''}</p>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <h3>📈 Résumé de la semaine</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '2px solid #2196f3' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🎯 Cartes Fidélité</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{employeeMetrics.totalCartes || 0}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    Objectif : {presenceCount * objectifParPresenceCartesFid}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '8px', border: '2px solid #ff9800' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔥 Promo Quinzaine</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{employeeMetrics.totalPromo || 0}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    Objectif : {presenceCount * objectifParPresencePromo}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3>📅 Détail jour par jour</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Jour</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>Présent</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>🎯 Cartes Fidélité</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>🔥 Promo Quinzaine</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEK_DAYS.map(jour => {
                    const presence = employeePresence[jour] || false;
                    const dayMetrics = employeeMetrics.perDay?.[jour] || { cartes: 0, promo: 0 };
                    const expectedCartes = presence ? objectifParPresenceCartesFid : 0;
                    const expectedPromo = presence ? objectifParPresencePromo : 0;
                    const cartesReached = expectedCartes > 0 ? dayMetrics.cartes >= expectedCartes : false;
                    const promoReached = expectedPromo > 0 ? dayMetrics.promo >= expectedPromo : false;
                    const statusClass = presence 
                      ? (cartesReached && promoReached ? 'success' : 'danger')
                      : (dayMetrics.cartes > 0 || dayMetrics.promo > 0 ? 'info' : 'neutral');
                    
                    return (
                      <tr key={jour}>
                        <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', fontWeight: 'bold' }}>{jour}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          {presence ? '✅' : '❌'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          <strong>{dayMetrics.cartes}</strong> / {expectedCartes}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>
                          <strong>{dayMetrics.promo}</strong> / {expectedPromo}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center', 
                          border: '1px solid #dee2e6',
                          color: statusClass === 'success' ? '#28a745' : statusClass === 'danger' ? '#dc3545' : statusClass === 'info' ? '#17a2b8' : '#6c757d',
                          fontWeight: 'bold'
                        }}>
                          {statusClass === 'success' ? '✅ Atteint' : 
                           statusClass === 'danger' ? '❌ Non atteint' : 
                           statusClass === 'info' ? 'ℹ️ Données sans présence' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                    <td style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}>Total</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {presenceCount} jour(s)
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {employeeMetrics.totalCartes || 0}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {employeeMetrics.totalPromo || 0}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #dee2e6' }}>—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <DocumentsSection
            title="👤 Mes Documents Personnels"
            description="Vos documents personnels (fiches de paie, contrats, etc.)"
            documents={personalDocuments}
            onDownload={handleDownload}
            getCategoryIcon={getCategoryIcon}
            getCategoryLabel={getCategoryLabel}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
            emptyMessage="Aucun document personnel disponible"
            isPersonal={true}
          />
        )}
      </div>

      <div className="dashboard-footer">
        <div className="info-box">
          <h3>ℹ️ Informations importantes</h3>
          <ul>
            <li>📋 Les <strong>documents généraux</strong> sont accessibles à tous les employés</li>
            <li>👤 Les <strong>documents personnels</strong> sont spécifiques à votre compte</li>
            <li>⏰ Les documents personnels sont automatiquement supprimés après 1 mois</li>
            <li>📥 Cliquez sur "Télécharger" pour sauvegarder un document sur votre appareil</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
