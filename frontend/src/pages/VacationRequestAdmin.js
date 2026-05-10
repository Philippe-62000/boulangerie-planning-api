import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './VacationRequestAdmin.css';

const YEAR_MAX = 2032;

const VacationRequestAdmin = () => {
  const location = useLocation();
  const [vacationRequests, setVacationRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVacationRequest, setEditingVacationRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  // Détecter le basename depuis l'URL actuelle
  const getBasename = () => {
    // Utiliser BASE_URL de Vite (comme dans App.js) pour être cohérent
    if (import.meta.env.BASE_URL) {
      return import.meta.env.BASE_URL.replace(/\/$/, ''); // Enlever le slash final
    }
    // Fallback : détecter depuis l'URL actuelle
    const pathname = location.pathname;
    if (pathname.startsWith('/lon')) {
      return '/lon';
    }
    return '/plan';
  };

  console.log('🔧 VacationRequestAdmin - Rendu du composant');

  // Gestion d'erreur globale désactivée temporairement
  // useEffect(() => {
  //   const handleError = (error) => {
  //     console.error('🚨 Erreur JavaScript globale:', error);
  //     setError('Une erreur est survenue. Veuillez recharger la page.');
  //   };

  //   window.addEventListener('error', handleError);
  //   return () => window.removeEventListener('error', handleError);
  // }, []);

  // Debug pour les changements d'état du modal
  useEffect(() => {
    console.log('🔧 État showEditModal changé:', showEditModal);
    if (!showEditModal) {
      console.log('🔧 Modal fermé - Stack trace:', new Error().stack);
    }
  }, [showEditModal]);

  const fetchVacationRequests = async () => {
    try {
      setLoading(true);
      console.log('📅 Récupération des demandes de congés...');
      
      const response = await api.get('/vacation-requests');
      
      if (response.data.success) {
        setVacationRequests(response.data.data);
        console.log('✅ Demandes de congés chargées:', response.data.data.length);
        applyFilters(response.data.data);
      } else {
        setVacationRequests([]);
        setFilteredRequests([]);
        console.error('❌ Format de données invalide');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des demandes de congés');
      setVacationRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres
  const parseYear = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
  };

  const availableYears = useMemo(() => {
    const years = new Set();
    const currentYear = new Date().getFullYear();

    vacationRequests.forEach((req) => {
      const startYear = parseYear(req.startDate);
      const endYear = parseYear(req.endDate);
      const createdYear = parseYear(req.createdAt);

      if (startYear) years.add(startYear);
      if (endYear) years.add(endYear);
      if (createdYear) years.add(createdYear);
    });

    for (let year = currentYear; year <= YEAR_MAX; year += 1) {
      years.add(year);
    }

    return Array.from(years).sort((a, b) => a - b);
  }, [vacationRequests]);

  const applyFilters = (requests = vacationRequests) => {
    let filtered = requests;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Filtre par année (basé sur la date de début des congés)
    if (yearFilter !== 'all') {
      const targetYear = parseInt(yearFilter, 10);
      filtered = filtered.filter(req => {
        const vacationYear =
          parseYear(req.startDate) ??
          parseYear(req.endDate) ??
          parseYear(req.createdAt);

        return vacationYear === targetYear;
      });
    }

    setFilteredRequests(filtered);
  };

  // Gérer les changements de filtres
  useEffect(() => {
    applyFilters();
  }, [statusFilter, yearFilter, vacationRequests]);

  useEffect(() => {
    fetchVacationRequests();
  }, []);

  const openEditModal = (vacationRequest) => {
    console.log('🔧 Ouverture modal modification pour:', vacationRequest);
    
    // Extraction des dates
    const originalDates = {
      startDate: vacationRequest.startDate,
      endDate: vacationRequest.endDate,
      startDateType: typeof vacationRequest.startDate,
      endDateType: typeof vacationRequest.endDate
    };
    console.log('🔧 Dates originales:', originalDates);
    
    const extractedDates = {
      startDate: vacationRequest.startDate.split('T')[0],
      endDate: vacationRequest.endDate.split('T')[0]
    };
    console.log('🔧 Dates extraites:', extractedDates);
    
    setEditingVacationRequest(vacationRequest);
    setEditFormData(extractedDates);
    setShowEditModal(true);
    
    console.log('🔧 Modal ouvert:', true);
    
    // Vérification après 1 seconde
    setTimeout(() => {
      console.log('🔧 Vérification modal après 1 seconde - Modal devrait être ouvert');
      if (!showEditModal) {
        console.log('🔧 MODAL FERMÉ AUTOMATIQUEMENT - Raison possible: re-render ou autre événement');
      }
    }, 1000);
  };

  const closeEditModal = () => {
    console.log('🔧 Fermeture modal - Appelée depuis:', new Error().stack);
    console.log('🔧 État showEditModal avant fermeture:', showEditModal);
    setShowEditModal(false);
    setEditingVacationRequest(null);
    setEditFormData({ startDate: '', endDate: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingVacationRequest) return;
    
    try {
      console.log('🔧 Soumission modification pour:', editingVacationRequest._id);
      console.log('🔧 Nouvelles dates:', editFormData);
      
      const response = await api.patch(`/vacation-requests/${editingVacationRequest._id}`, {
        startDate: editFormData.startDate,
        endDate: editFormData.endDate
      });
      
      console.log('🔧 Réponse API modification:', response.data);
      
      if (response.data.success) {
        toast.success('Demande de congés modifiée avec succès');
        closeEditModal();
        fetchVacationRequests();
      } else {
        toast.error('Erreur lors de la modification');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification de la demande');
    }
  };

  const handleAccept = async (id) => {
    try {
      const response = await api.patch(`/vacation-requests/${id}/accept`);
      if (response.data.success) {
        toast.success('Demande acceptée');
        fetchVacationRequests();
      }
    } catch (error) {
      console.error('Erreur acceptation:', error);
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await api.patch(`/vacation-requests/${id}/reject`);
      if (response.data.success) {
        toast.success('Demande rejetée');
        fetchVacationRequests();
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const handleCancel = async (id) => {
    try {
      const response = await api.patch(`/vacation-requests/${id}/cancel`);
      if (response.data.success) {
        toast.success('Demande annulée');
        fetchVacationRequests();
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error('Erreur lors de l\'annulation');
    }
  };

  // Suppression définitive (sans envoi d'email au salarié) — utile pour les doublons / erreurs.
  const handleDelete = async (request) => {
    const ok = window.confirm(
      `🗑️ Supprimer définitivement la demande de congés de ${request.employeeName} `
      + `(${formatDate(request.startDate)} → ${formatDate(request.endDate)}) ?\n\n`
      + 'Aucun email ne sera envoyé au salarié. Cette action est irréversible.'
    );
    if (!ok) return;
    try {
      const response = await api.delete(`/vacation-requests/${request._id}`);
      if (response.data.success) {
        toast.success('Demande supprimée');
        fetchVacationRequests();
      }
    } catch (error) {
      console.error('Erreur suppression demande congés:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'En attente', class: 'badge-warning', icon: '⏳' },
      validated: { text: 'Validé', class: 'badge-success', icon: '✅' },
      accepted: { text: 'Accepté', class: 'badge-success', icon: '✅' },
      rejected: { text: 'Rejeté', class: 'badge-danger', icon: '❌' },
      cancelled: { text: 'Annulé', class: 'badge-secondary', icon: '🚫' }
    };
    
    const badge = badges[status] || { text: status, class: 'badge-secondary', icon: '' };
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="vacation-request-admin">
      <div className="admin-header">
        <h1>🏖️ Gestion des Demandes de Congés</h1>
        <p>Validation et suivi des demandes de congés des employés</p>
      </div>

      <div className="admin-actions">
        <button 
          className="btn btn-primary"
          onClick={() => window.open(`${getBasename()}/vacation-planning`, '_blank')}
        >
          🖨️ Impression Calendrier
        </button>
        
        <button 
          className="btn btn-warning"
          onClick={async () => {
            try {
              const response = await api.post('/vacation-requests/sync-employees');
              if (response.data.success) {
                toast.success(`Synchronisation terminée: ${response.data.syncedCount} employés mis à jour`);
                fetchVacationRequests(); // Recharger les données
              }
            } catch (error) {
              toast.error('Erreur lors de la synchronisation');
            }
          }}
        >
          🔄 Synchroniser Congés
        </button>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="status-filter">Statut :</label>
          <select 
            id="status-filter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
          >
            <option value="all">Toutes ({vacationRequests.length})</option>
            <option value="pending">⏳ En attente ({vacationRequests.filter(r => r.status === 'pending').length})</option>
            <option value="validated">✅ Validées ({vacationRequests.filter(r => r.status === 'validated').length})</option>
            <option value="rejected">❌ Rejetées ({vacationRequests.filter(r => r.status === 'rejected').length})</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="year-filter">Année des congés :</label>
          <select 
            id="year-filter"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="form-control"
          >
            <option value="all">Toutes les années</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="vacation-requests-list">
        {loading ? (
          <div className="loading">Chargement des demandes de congés...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="no-data">
            <p>Aucune demande de congés trouvée pour les filtres sélectionnés</p>
          </div>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <div key={request._id} className={`request-card status-${request.status}`}>
                <div className="card-header">
                  <div className="employee-info">
                    <h3 className="employee-name">{request.employeeName}</h3>
                    <p className="employee-email">{request.employeeEmail}</p>
                    <p className="employee-city">📍 {request.city}</p>
                  </div>
                  <div className="status-badge-container">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="info-row period-row">
                    <span className="info-label">📅 Période</span>
                    <span className="info-value">
                      {formatDate(request.startDate)} → {formatDate(request.endDate)}
                    </span>
                    <span className="duration-badge">
                      {calculateDuration(request.startDate, request.endDate)} jour{calculateDuration(request.startDate, request.endDate) > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {request.type && (
                    <div className="info-row">
                      <span className="info-label">📋 Type</span>
                      <span className="info-value">{request.type || '-'}</span>
                    </div>
                  )}
                  
                  {request.reason && (
                    <div className="info-row">
                      <span className="info-label">💬 Raison</span>
                      <span className="info-value">{request.reason || '-'}</span>
                    </div>
                  )}
                  
                  {request.validatedAt && (
                    <div className="info-row">
                      <span className="info-label">✅ Validé le</span>
                      <span className="info-value">{formatDate(request.validatedAt)}</span>
                    </div>
                  )}
                  
                  {request.rejectedAt && (
                    <div className="info-row">
                      <span className="info-label">❌ Rejeté le</span>
                      <span className="info-value">{formatDate(request.rejectedAt)}</span>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  {request.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAccept(request._id)}
                        className="btn btn-success btn-action"
                        title="Accepter"
                      >
                        ✅ Accepter
                      </button>
                      <button 
                        onClick={() => openEditModal(request)}
                        className="btn btn-warning btn-action"
                        title="Modifier"
                      >
                        ✏️ Modifier
                      </button>
                      <button 
                        onClick={() => handleReject(request._id)}
                        className="btn btn-danger btn-action"
                        title="Rejeter"
                      >
                        ❌ Rejeter
                      </button>
                    </>
                  )}
                  {request.status === 'validated' && (
                    <button 
                      onClick={() => handleCancel(request._id)}
                      className="btn btn-secondary btn-action"
                      title="Annuler"
                    >
                      🚫 Annuler
                    </button>
                  )}
                  {/* Suppression définitive disponible quel que soit le statut, sans email */}
                  <button
                    onClick={() => handleDelete(request)}
                    className="btn btn-dark btn-action"
                    title="Supprimer la demande sans envoyer d'email au salarié"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'édition des dates - Structure copiée de SickLeaveAdmin */}
      {showEditModal && editingVacationRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Modifier les dates de congés</h3>
              <button onClick={closeEditModal} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Employé: {editingVacationRequest.employeeName}</label>
                </div>
                
                <div className="form-group">
                  <label htmlFor="editStartDate">Date de début:</label>
                  <input
                    type="date"
                    id="editStartDate"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({...editFormData, startDate: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editEndDate">Date de fin:</label>
                  <input
                    type="date"
                    id="editEndDate"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({...editFormData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  💾 Sauvegarder
                </button>
                <button type="button" onClick={closeEditModal} className="btn btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default VacationRequestAdmin;