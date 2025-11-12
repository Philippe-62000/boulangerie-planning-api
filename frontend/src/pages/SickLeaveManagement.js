import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SickLeaveManagement.css';

const SickLeaveManagement = () => {
  const [sickLeaves, setSickLeaves] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api';

  useEffect(() => {
    fetchSickLeaves();
    fetchStats();
  }, [selectedStatus, currentPage]);

  const fetchSickLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        sortBy: 'uploadDate',
        sortOrder: 'desc'
      });
      
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await axios.get(`${API_URL}/sick-leaves?${params}`);
      
      if (response.data.success) {
        setSickLeaves(response.data.data.sickLeaves);
        setTotalPages(response.data.data.pagination.pages);
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
      const response = await axios.get(`${API_URL}/sick-leaves/stats/overview`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
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

  const getMimeExtension = (mimeType = '') => {
    const map = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png'
    };
    return map[mimeType.toLowerCase()] || '';
  };

  const handleDownload = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/sick-leaves/${id}/download`, {
        responseType: 'blob'
      });

      const mimeType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mimeType });

      const contentDisposition = response.headers['content-disposition'];
      const sickLeave = sickLeaves.find((item) => item._id === id);
      let fileName = sickLeave?.originalFileName || `arret-maladie-${id}`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?\"?([^\";]+)/i);
        if (fileNameMatch && fileNameMatch[1]) {
          try {
            fileName = decodeURIComponent(fileNameMatch[1].replace(/\"/g, '').trim());
          } catch (decodeError) {
            fileName = fileNameMatch[1].replace(/\"/g, '').trim();
          }
        }
      }

      if (!fileName.includes('.')) {
        const extension = getMimeExtension(mimeType);
        if (extension) {
          fileName = `${fileName}.${extension}`;
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
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
    <div className="sick-leave-management">
      <div className="management-header">
        <h1>📋 Gestion des Arrêts Maladie</h1>
        <p>Suivi et validation des arrêts maladie des salariés</p>
      </div>

      {/* Statistiques */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{stats.total || 0}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending || 0}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card validated">
          <div className="stat-number">{stats.validated || 0}</div>
          <div className="stat-label">Validés</div>
        </div>
        <div className="stat-card declared">
          <div className="stat-number">{stats.declared || 0}</div>
          <div className="stat-label">Déclarés</div>
        </div>
        {stats.overdue > 0 && (
          <div className="stat-card overdue">
            <div className="stat-number">{stats.overdue}</div>
            <div className="stat-label">En retard</div>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="filters-container">
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
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Liste des arrêts maladie */}
      <div className="sick-leaves-list">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : sickLeaves.length === 0 ? (
          <div className="no-data">Aucun arrêt maladie trouvé</div>
        ) : (
          <div className="sick-leaves-table">
            <div className="table-header">
              <div>Salarié</div>
              <div>Période</div>
              <div>Fichier</div>
              <div>Statut</div>
              <div>Validation</div>
              <div>Actions</div>
            </div>
            
            {sickLeaves.map((sickLeave) => (
              <div key={sickLeave._id} className="table-row">
                <div className="employee-info">
                  <div className="employee-name">{sickLeave.employeeName}</div>
                  <div className="employee-email">{sickLeave.employeeEmail}</div>
                </div>
                
                <div className="period-info">
                  <div>Du {formatDate(sickLeave.startDate)}</div>
                  <div>Au {formatDate(sickLeave.endDate)}</div>
                  <div className="duration">({sickLeave.duration} jour{sickLeave.duration > 1 ? 's' : ''})</div>
                </div>
                
                <div className="file-info">
                  <div className="file-name">{sickLeave.originalFileName}</div>
                  <div className="file-details">
                    {formatFileSize(sickLeave.fileSize)} • {sickLeave.fileType.split('/')[1].toUpperCase()}
                  </div>
                </div>
                
                <div className="status-info">
                  {getStatusBadge(sickLeave.status)}
                  {sickLeave.isOverdue && (
                    <div className="overdue-warning">⚠️ En retard</div>
                  )}
                </div>
                
                <div className="validation-info">
                  <div className="auto-validation">
                    <div className={`quality-score ${sickLeave.autoValidation.qualityScore >= 60 ? 'good' : 'poor'}`}>
                      Score: {sickLeave.autoValidation.qualityScore}/100
                    </div>
                    <div className="validation-message">
                      {sickLeave.autoValidation.validationMessage}
                    </div>
                  </div>
                </div>
                
                <div className="actions">
                  <button 
                    onClick={() => handleDownload(sickLeave._id)}
                    className="action-btn download"
                    title="Télécharger"
                  >
                    📥
                  </button>
                  
                  {sickLeave.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleValidate(sickLeave._id)}
                        className="action-btn validate"
                        title="Valider"
                      >
                        ✅
                      </button>
                      <button 
                        onClick={() => handleReject(sickLeave._id)}
                        className="action-btn reject"
                        title="Rejeter"
                      >
                        ❌
                      </button>
                    </>
                  )}
                  
                  {sickLeave.status === 'validated' && (
                    <button 
                      onClick={() => handleDeclare(sickLeave._id)}
                      className="action-btn declare"
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
    </div>
  );
};

export default SickLeaveManagement;
