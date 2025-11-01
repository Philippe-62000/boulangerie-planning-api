import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const VacationRequestAdmin = () => {
  const [vacationRequests, setVacationRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVacationRequest, setEditingVacationRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

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
  const applyFilters = (requests = vacationRequests) => {
    let filtered = requests;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Filtre par année (basé sur la date de début des congés)
    filtered = filtered.filter(req => {
      const vacationYear = new Date(req.startDate).getFullYear();
      return vacationYear === yearFilter;
    });

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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'En attente', class: 'badge-warning' },
      accepted: { text: 'Accepté', class: 'badge-success' },
      rejected: { text: 'Rejeté', class: 'badge-danger' }
    };
    
    const badge = badges[status] || { text: status, class: 'badge-secondary' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
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
          onClick={() => window.open('/plan/vacation-planning', '_blank')}
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
          <label>Statut:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
          >
            <option value="all">Toutes ({vacationRequests.length})</option>
            <option value="pending">En attente ({vacationRequests.filter(r => r.status === 'pending').length})</option>
            <option value="validated">Validées ({vacationRequests.filter(r => r.status === 'validated').length})</option>
            <option value="rejected">Rejetées ({vacationRequests.filter(r => r.status === 'rejected').length})</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Année des congés:</label>
          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="form-control"
          >
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
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
              <div key={request._id} className="request-card">
                <div className="card-header">
                  <h3>{request.employeeName}</h3>
                  <p>{request.employeeEmail}</p>
                  <p>{request.city}</p>
                </div>
                
                <div className="card-content">
                  <div className="period">
                    <strong>Période:</strong> {formatDate(request.startDate)} → {formatDate(request.endDate)}
                    <span className="duration">
                      ({calculateDuration(request.startDate, request.endDate)} jour{calculateDuration(request.startDate, request.endDate) > 1 ? 's' : ''})
                    </span>
                  </div>
                  
                  <div className="type">
                    <strong>Type:</strong> {request.type}
                  </div>
                  
                  <div className="status">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                
                <div className="card-actions">
                  {request.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAccept(request._id)}
                        className="btn btn-success"
                        title="Accepter"
                      >
                        ✅
                      </button>
                      <button 
                        onClick={() => openEditModal(request)}
                        className="btn btn-warning"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleReject(request._id)}
                        className="btn btn-danger"
                        title="Rejeter"
                      >
                        ❌
                      </button>
                    </>
                  )}
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
      
      <style jsx>{`
        .filters-section {
          display: flex;
          gap: 20px;
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .filter-group label {
          font-weight: bold;
          color: #495057;
          font-size: 14px;
        }
        
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background-color: white;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default VacationRequestAdmin;