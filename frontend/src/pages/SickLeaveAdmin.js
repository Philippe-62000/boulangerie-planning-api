import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SickLeaveAdmin.css';

const SickLeaveAdmin = () => {
  const [sickLeaves, setSickLeaves] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedSickLeave, setSelectedSickLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'https://boulangerie-planning-api-3.onrender.com/api';

  useEffect(() => {
    fetchSickLeaves();
    fetchStats();
  }, [selectedStatus, currentPage]);

  const fetchSickLeaves = async () => {
    try {
      setLoading(true);
      console.log('📋 Récupération des arrêts maladie...');
      
      const response = await axios.get(`${API_URL}/sick-leaves`);
      
      if (response.data.success) {
        let allSickLeaves = response.data.data;
        
        // Filtrer par statut si nécessaire
        if (selectedStatus !== 'all') {
          allSickLeaves = allSickLeaves.filter(sl => sl.status === selectedStatus);
        }
        
        // Tri par date d'upload (plus récents en premier)
        allSickLeaves.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        
        // Pagination côté client
        const itemsPerPage = 12;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedSickLeaves = allSickLeaves.slice(startIndex, endIndex);
        
        setSickLeaves(paginatedSickLeaves);
        setTotalPages(Math.ceil(allSickLeaves.length / itemsPerPage));
        
        console.log(`✅ ${allSickLeaves.length} arrêts maladie récupérés, ${paginatedSickLeaves.length} affichés`);
      }
    } catch (error) {
      console.error('Erreur récupération arrêts maladie:', error);
      setMessage('Erreur lors du chargement des arrêts maladie');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Récupération des statistiques...');
      const response = await axios.get(`${API_URL}/sick-leaves/stats/overview`);
      if (response.data.success) {
        setStats(response.data.data);
        console.log('✅ Statistiques récupérées:', response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      // En cas d'erreur, calculer les stats côté client
      if (sickLeaves.length > 0) {
        const clientStats = {
          total: sickLeaves.length,
          pending: sickLeaves.filter(sl => sl.status === 'pending').length,
          validated: sickLeaves.filter(sl => sl.status === 'validated').length,
          declared: sickLeaves.filter(sl => sl.status === 'declared').length,
          rejected: sickLeaves.filter(sl => sl.status === 'rejected').length,
          overdue: 0
        };
        setStats(clientStats);
      }
    }
  };

  const handleValidate = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/sick-leaves/${id}/validate`, {
        validatedBy: 'Admin',
        notes: 'Validé par l\'administrateur'
      });

      if (response.data.success) {
        setMessage('Arrêt maladie validé avec succès');
        setMessageType('success');
        fetchSickLeaves();
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      setMessage('Erreur lors de la validation');
      setMessageType('error');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    try {
      const response = await axios.put(`${API_URL}/sick-leaves/${id}/reject`, {
        rejectedBy: 'Admin',
        reason: reason
      });

      if (response.data.success) {
        setMessage('Arrêt maladie rejeté');
        setMessageType('success');
        fetchSickLeaves();
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      setMessage('Erreur lors du rejet');
      setMessageType('error');
    }
  };

  const handleDeclare = async (id) => {
    const notes = prompt('Notes de déclaration (optionnel):') || '';

    try {
      const response = await axios.put(`${API_URL}/sick-leaves/${id}/declare`, {
        declaredBy: 'Admin',
        notes: notes
      });

      if (response.data.success) {
        setMessage('Arrêt maladie marqué comme déclaré');
        setMessageType('success');
        fetchSickLeaves();
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur déclaration:', error);
      setMessage('Erreur lors de la déclaration');
      setMessageType('error');
    }
  };

  const handleDownload = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/sick-leaves/${id}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `arret-maladie-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setMessage('Erreur lors du téléchargement');
      setMessageType('error');
    }
  };

  const openModal = (sickLeave) => {
    setSelectedSickLeave(sickLeave);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSickLeave(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'En attente', class: 'status-pending' },
      validated: { text: 'Validé', class: 'status-validated' },
      declared: { text: 'Déclaré', class: 'status-declared' },
      rejected: { text: 'Rejeté', class: 'status-rejected' }
    };
    
    const badge = badges[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="sick-leave-admin">
      <div className="admin-header">
        <h1>🏥 Gestion des Arrêts Maladie</h1>
        <p>Suivi et validation des arrêts maladie des salariés</p>
      </div>

      {/* Statistiques compactes */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number">{stats.total || 0}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-item pending">
          <div className="stat-number">{stats.pending || 0}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-item validated">
          <div className="stat-number">{stats.validated || 0}</div>
          <div className="stat-label">Validés</div>
        </div>
        <div className="stat-item declared">
          <div className="stat-number">{stats.declared || 0}</div>
          <div className="stat-label">Déclarés</div>
        </div>
        {stats.overdue > 0 && (
          <div className="stat-item overdue">
            <div className="stat-number">{stats.overdue}</div>
            <div className="stat-label">En retard</div>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="filters-row">
        <select 
          value={selectedStatus} 
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="status-filter"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="validated">Validés</option>
          <option value="declared">Déclarés</option>
          <option value="rejected">Rejetés</option>
        </select>
        
        <div className="quick-actions">
          <a 
            href="/plan/sick-leave-standalone.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="action-link"
          >
            📤 Lien pour salariés
          </a>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Liste compacte */}
      <div className="sick-leaves-list">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : sickLeaves.length === 0 ? (
          <div className="no-data">Aucun arrêt maladie trouvé</div>
        ) : (
          <div className="sick-leaves-grid">
            {sickLeaves.map((sickLeave) => (
              <div key={sickLeave._id} className="sick-leave-card">
                <div className="card-header">
                  <div className="employee-info">
                    <h3>{sickLeave.employeeName}</h3>
                    <p>{sickLeave.employeeEmail}</p>
                  </div>
                  {getStatusBadge(sickLeave.status)}
                </div>
                
                <div className="card-content">
                  <div className="period">
                    <strong>Période:</strong> {formatDate(sickLeave.startDate)} - {formatDate(sickLeave.endDate)}
                    <span className="duration">({sickLeave.duration} jour{sickLeave.duration > 1 ? 's' : ''})</span>
                  </div>
                  
                  <div className="file-info">
                    <strong>Fichier:</strong> {sickLeave.originalFileName}
                    <span className="file-size">({formatFileSize(sickLeave.fileSize)})</span>
                  </div>
                  
                  <div className="validation-info">
                    <div className={`quality-score ${sickLeave.autoValidation.qualityScore >= 60 ? 'good' : 'poor'}`}>
                      Score: {sickLeave.autoValidation.qualityScore}/100
                    </div>
                    {sickLeave.isOverdue && (
                      <div className="overdue-warning">⚠️ En retard</div>
                    )}
                  </div>
                </div>
                
                <div className="card-actions">
                  <button 
                    onClick={() => openModal(sickLeave)}
                    className="btn btn-info"
                    title="Voir détails"
                  >
                    👁️
                  </button>
                  
                  <button 
                    onClick={() => handleDownload(sickLeave._id)}
                    className="btn btn-download"
                    title="Télécharger"
                  >
                    📥
                  </button>
                  
                  {sickLeave.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleValidate(sickLeave._id)}
                        className="btn btn-success"
                        title="Valider"
                      >
                        ✅
                      </button>
                      <button 
                        onClick={() => handleReject(sickLeave._id)}
                        className="btn btn-danger"
                        title="Rejeter"
                      >
                        ❌
                      </button>
                    </>
                  )}
                  
                  {sickLeave.status === 'validated' && (
                    <button 
                      onClick={() => handleDeclare(sickLeave._id)}
                      className="btn btn-primary"
                      title="Marquer comme déclaré"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Précédent
          </button>
          
          <span className="page-info">
            Page {currentPage} sur {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal de détails */}
      {showModal && selectedSickLeave && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de l'arrêt maladie</h2>
              <button onClick={closeModal} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>Salarié</h3>
                <p><strong>Nom:</strong> {selectedSickLeave.employeeName}</p>
                <p><strong>Email:</strong> {selectedSickLeave.employeeEmail}</p>
              </div>
              
              <div className="detail-section">
                <h3>Période d'arrêt</h3>
                <p><strong>Début:</strong> {formatDate(selectedSickLeave.startDate)}</p>
                <p><strong>Fin:</strong> {formatDate(selectedSickLeave.endDate)}</p>
                <p><strong>Durée:</strong> {selectedSickLeave.duration} jour{selectedSickLeave.duration > 1 ? 's' : ''}</p>
              </div>
              
              <div className="detail-section">
                <h3>Fichier</h3>
                <p><strong>Nom:</strong> {selectedSickLeave.originalFileName}</p>
                <p><strong>Taille:</strong> {formatFileSize(selectedSickLeave.fileSize)}</p>
                <p><strong>Type:</strong> {selectedSickLeave.fileType}</p>
                <p><strong>Uploadé le:</strong> {formatDate(selectedSickLeave.uploadDate)}</p>
              </div>
              
              <div className="detail-section">
                <h3>Validation automatique</h3>
                <p><strong>Score:</strong> {selectedSickLeave.autoValidation.qualityScore}/100</p>
                <p><strong>Message:</strong> {selectedSickLeave.autoValidation.validationMessage}</p>
                <p><strong>Lisible:</strong> {selectedSickLeave.autoValidation.isReadable ? 'Oui' : 'Non'}</p>
              </div>
              
              {selectedSickLeave.manualValidation.validatedBy && (
                <div className="detail-section">
                  <h3>Validation manuelle</h3>
                  <p><strong>Validé par:</strong> {selectedSickLeave.manualValidation.validatedBy}</p>
                  <p><strong>Date:</strong> {formatDate(selectedSickLeave.manualValidation.validatedAt)}</p>
                  {selectedSickLeave.manualValidation.validationNotes && (
                    <p><strong>Notes:</strong> {selectedSickLeave.manualValidation.validationNotes}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={() => handleDownload(selectedSickLeave._id)} className="btn btn-download">
                📥 Télécharger
              </button>
              <button onClick={closeModal} className="btn btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SickLeaveAdmin;
