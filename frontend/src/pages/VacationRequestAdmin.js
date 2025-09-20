import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './VacationRequestAdmin.css';

const VacationRequestAdmin = () => {
  const [vacationRequests, setVacationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVacationRequest, setEditingVacationRequest] = useState(null);
  const [editFormData, setEditFormData] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchVacationRequests();
  }, []);

  const fetchVacationRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vacation-requests');
      if (response.data.success) {
        setVacationRequests(response.data.data);
      }
    } catch (error) {
      console.error('❌ Erreur récupération demandes congés:', error);
      toast.error('Erreur lors du chargement des demandes de congés');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      const response = await api.patch(`/vacation-requests/${id}/validate`, {
        validatedBy: 'Administrateur',
        notes: 'Demande validée'
      });
      
      if (response.data.success) {
        toast.success('Demande de congés validée avec succès');
        fetchVacationRequests();
      }
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Raison du refus:');
    if (!reason) return;
    
    try {
      const response = await api.patch(`/vacation-requests/${id}/reject`, {
        rejectedBy: 'Administrateur',
        reason: reason
      });
      
      if (response.data.success) {
        toast.success('Demande de congés rejetée');
        fetchVacationRequests();
      }
    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const openEditModal = (vacationRequest) => {
    setEditingVacationRequest(vacationRequest);
    setEditFormData({
      startDate: new Date(vacationRequest.startDate).toISOString().split('T')[0],
      endDate: new Date(vacationRequest.endDate).toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingVacationRequest(null);
    setEditFormData({ startDate: '', endDate: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await api.put(`/vacation-requests/${editingVacationRequest._id}`, {
        startDate: editFormData.startDate,
        endDate: editFormData.endDate
      });
      
      if (response.data.success) {
        toast.success('Demande de congés modifiée avec succès');
        closeEditModal();
        fetchVacationRequests();
      }
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">En attente</span>;
      case 'validated':
        return <span className="badge badge-success">Validé</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejeté</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const filteredRequests = vacationRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading) {
    return (
      <div className="vacation-request-admin">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des demandes de congés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vacation-request-admin">
      <div className="page-header">
        <h1>🏖️ Gestion des Congés</h1>
        <p>Validez ou rejetez les demandes de congés des employés</p>
        <div style={{ marginTop: '10px' }}>
          <a 
            href="/plan/vacation-request-standalone.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            📝 Formulaire de demande de congés
          </a>
          <button 
            onClick={() => window.open('/vacation-planning', '_blank')}
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
          >
            📅 Impression Calendrier
          </button>
        </div>
      </div>

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Toutes ({vacationRequests.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          En attente ({vacationRequests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'validated' ? 'active' : ''}`}
          onClick={() => setFilter('validated')}
        >
          Validées ({vacationRequests.filter(r => r.status === 'validated').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejetées ({vacationRequests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      <div className="vacation-requests-table">
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Email</th>
              <th>Période</th>
              <th>Durée</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Date demande</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr key={request._id}>
                <td>{request.employeeName}</td>
                <td>{request.employeeEmail}</td>
                <td>
                  {formatDate(request.startDate)} - {formatDate(request.endDate)}
                </td>
                <td>{request.duration} jour{request.duration > 1 ? 's' : ''}</td>
                <td>{request.reason}</td>
                <td>{getStatusBadge(request.status)}</td>
                <td>{formatDate(request.uploadDate)}</td>
                <td>
                  <div className="actions">
                    {request.status === 'pending' && (
                      <>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleValidate(request._id)}
                          title="Valider"
                        >
                          ✅
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(request._id)}
                          title="Rejeter"
                        >
                          ❌
                        </button>
                      </>
                    )}
                    {(request.status === 'pending' || request.status === 'validated') && (
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => openEditModal(request)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                    )}
                    {request.status === 'validated' && (
                      <span className="text-success">✅ Validé le {formatDate(request.validatedAt)}</span>
                    )}
                    {request.status === 'rejected' && (
                      <span className="text-danger">❌ Rejeté le {formatDate(request.rejectedAt)}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRequests.length === 0 && (
          <div className="no-data">
            <p>Aucune demande de congés trouvée</p>
          </div>
        )}
      </div>

      {/* Modal de modification */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Modifier les dates de congés</h3>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({...editFormData, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({...editFormData, endDate: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Sauvegarder
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
