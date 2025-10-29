import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './AdvanceRequests.css';

const AdvanceRequests = () => {
  const [advanceRequests, setAdvanceRequests] = useState([]);
  const [advanceStats, setAdvanceStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAdvanceRequest, setSelectedAdvanceRequest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchAdvanceRequests();
    fetchAdvanceStats();
  }, []);

  const fetchAdvanceRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/advance-requests');
      if (response.data.success) {
        setAdvanceRequests(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération demandes acompte:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvanceStats = async () => {
    try {
      const response = await api.get('/advance-requests/stats');
      if (response.data.success) {
        setAdvanceStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération stats acompte:', error);
    }
  };

  const handleAdvanceAction = async (requestId, action, data = {}) => {
    try {
      const response = await api.put(`/advance-requests/${requestId}`, {
        status: action,
        ...data
      });
      
      if (response.data.success) {
        toast.success(`Demande ${action === 'approved' ? 'approuvée' : 'rejetée'} avec succès`);
        fetchAdvanceRequests();
        fetchAdvanceStats();
        setShowEditModal(false);
        setSelectedAdvanceRequest(null);
      }
    } catch (error) {
      console.error('Erreur action acompte:', error);
      toast.error('Erreur lors de l\'action');
    }
  };

  const handleOpenEditModal = (request) => {
    setSelectedAdvanceRequest(request);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAdvanceRequest(null);
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return advanceRequests;
    return advanceRequests.filter(req => req.status === filter);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      approved: 'Approuvée',
      rejected: 'Rejetée'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected'
    };
    return classes[status] || '';
  };

  if (loading) {
    return (
      <div className="advance-requests">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement des demandes d'acompte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advance-requests">
      <div className="page-header">
        <h2>💰 Gestion des Demandes d'Acompte</h2>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={fetchAdvanceRequests}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="advance-stats">
        <div className="stat-card">
          <div className="stat-number">{advanceStats.pending || 0}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{advanceStats.approved || 0}</div>
          <div className="stat-label">Approuvées</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{advanceStats.rejected || 0}</div>
          <div className="stat-label">Rejetées</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{advanceStats.totalAmount || 0}€</div>
          <div className="stat-label">Montant total</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Toutes ({advanceStats.total || 0})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          En attente ({advanceStats.pending || 0})
        </button>
        <button 
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approuvées ({advanceStats.approved || 0})
        </button>
        <button 
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejetées ({advanceStats.rejected || 0})
        </button>
      </div>

      {/* Liste des demandes */}
      <div className="requests-list">
        {getFilteredRequests().length === 0 ? (
          <div className="no-requests">
            <p>Aucune demande d'acompte trouvée</p>
          </div>
        ) : (
          getFilteredRequests().map(request => (
            <div key={request._id} className="request-card">
              <div className="request-info">
                <div className="employee-info">
                  <div className="employee-name">{request.employeeName}</div>
                  <div className="employee-email">{request.employeeEmail}</div>
                </div>
                <div className="request-details">
                  <div className="amount">{request.amount}€</div>
                  <div className="month">Déduction: {request.deductionMonth}</div>
                  <div className="date">
                    Demandé le: {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  {request.comment && (
                    <div className="comment">
                      <strong>Commentaire:</strong> {request.comment}
                    </div>
                  )}
                  {request.managerComment && (
                    <div className="manager-comment">
                      <strong>Commentaire manager:</strong> {request.managerComment}
                    </div>
                  )}
                </div>
              </div>
              <div className="request-actions">
                <div className={`status-badge ${getStatusClass(request.status)}`}>
                  {getStatusLabel(request.status)}
                </div>
                {request.status === 'pending' && (
                  <>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleAdvanceAction(request._id, 'approved')}
                    >
                      ✅ Approuver
                    </button>
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={() => handleOpenEditModal(request)}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleAdvanceAction(request._id, 'rejected')}
                    >
                      ❌ Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de modification */}
      {showEditModal && selectedAdvanceRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Modifier la Demande d'Acompte</h3>
              <button className="close-btn" onClick={handleCloseEditModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Employé: {selectedAdvanceRequest.employeeName}</label>
              </div>
              
              <div className="form-group">
                <label>Montant (€):</label>
                <input 
                  type="number" 
                  id="editAmount"
                  defaultValue={selectedAdvanceRequest.amount}
                  min="1"
                  max="5000"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label>Mois de déduction:</label>
                <select id="editMonth" defaultValue={selectedAdvanceRequest.deductionMonth}>
                  <option value="Janvier 2025">Janvier 2025</option>
                  <option value="Février 2025">Février 2025</option>
                  <option value="Mars 2025">Mars 2025</option>
                  <option value="Avril 2025">Avril 2025</option>
                  <option value="Mai 2025">Mai 2025</option>
                  <option value="Juin 2025">Juin 2025</option>
                  <option value="Juillet 2025">Juillet 2025</option>
                  <option value="Août 2025">Août 2025</option>
                  <option value="Septembre 2025">Septembre 2025</option>
                  <option value="Octobre 2025">Octobre 2025</option>
                  <option value="Novembre 2025">Novembre 2025</option>
                  <option value="Décembre 2025">Décembre 2025</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Commentaire du manager:</label>
                <textarea 
                  id="editComment"
                  rows="3"
                  placeholder="Commentaire optionnel..."
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    const amount = document.getElementById('editAmount').value;
                    const month = document.getElementById('editMonth').value;
                    const comment = document.getElementById('editComment').value;
                    handleAdvanceAction(selectedAdvanceRequest._id, 'approved', {
                      approvedAmount: amount,
                      managerComment: comment
                    });
                  }}
                >
                  ✅ Approuver avec modifications
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    const comment = document.getElementById('editComment').value;
                    handleAdvanceAction(selectedAdvanceRequest._id, 'rejected', {
                      managerComment: comment
                    });
                  }}
                >
                  ❌ Rejeter
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCloseEditModal}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceRequests;
