import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSickLeave, setEditingSickLeave] = useState(null);
  const [editFormData, setEditFormData] = useState({ startDate: '', endDate: '' });

  const API_URL = getApiUrl();

  const fetchSickLeaves = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Récupération des arrêts maladie...');
      
      // Paramètres de pagination côté serveur
      const params = {
        page: currentPage,
        limit: 50, // Limite élevée pour récupérer plus d'arrêts maladie
        sortBy: 'uploadDate',
        sortOrder: 'desc'
      };
      
      // Ajouter le filtre de statut si nécessaire
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      
      const response = await axios.get(`${API_URL}/sick-leaves`, { params });
      
      if (response.data.success) {
        let allSickLeaves = response.data.data.sickLeaves || response.data.data;
        
        console.log('📋 Arrêts maladie reçus:', allSickLeaves);
        
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
      } else {
        console.log('❌ Réponse API sans succès:', response.data);
        setMessage('Erreur: Réponse API invalide');
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des arrêts maladie:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      setMessage(`Erreur lors du chargement des arrêts maladie: ${error.response?.data?.error || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, currentPage, API_URL]);

  // Fonction pour effacer toutes les données des arrêts maladie
  const clearAllSickLeaves = async () => {
    const confirmMessage = `⚠️ ATTENTION : Cette action va supprimer TOUTES les données des arrêts maladie de la base de données.\n\n` +
      `- Les fichiers sur le NAS seront conservés\n` +
      `- Seuls les enregistrements de la base de données seront supprimés\n` +
      `- Cette action est IRRÉVERSIBLE\n\n` +
      `Êtes-vous sûr de vouloir continuer ?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('🗑️ Suppression de tous les arrêts maladie...');
      setLoading(true);
      
      const response = await axios.delete(`${API_URL}/sick-leaves/all`);
      
      if (response.data.success) {
        setMessage(`✅ ${response.data.deletedCount} arrêts maladie supprimés de la base de données`);
        setMessageType('success');
        
        // Recharger les données
        await fetchSickLeaves();
        await fetchStats();
      } else {
        setMessage('❌ Erreur lors de la suppression');
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ Erreur suppression arrêts maladie:', error);
      setMessage(`❌ Erreur lors de la suppression: ${error.response?.data?.error || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = useCallback(async () => {
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
  }, [API_URL]);

  useEffect(() => {
    fetchSickLeaves();
    fetchStats();
  }, [selectedStatus, currentPage, fetchSickLeaves, fetchStats]);

  const handleValidate = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/sick-leaves/${id}/validate`, {
        validatedBy: 'Admin',
        notes: 'Validé par l\'administrateur'
      });

      if (response.data.success) {
        // Note: La synchronisation avec l'employé est déjà gérée automatiquement par le backend
        // lors de la validation (dans validateSickLeave), donc on n'a pas besoin de la refaire ici

        setMessage('Arrêt maladie validé avec succès');
        setMessageType('success');
        fetchSickLeaves();
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      // Si l'erreur est 400, c'est probablement que l'arrêt a déjà été traité
      if (error.response?.status === 400) {
        setMessage(error.response?.data?.error || 'Cet arrêt maladie a déjà été traité');
        setMessageType('warning');
        // Recharger quand même pour voir le nouveau statut
        fetchSickLeaves();
        fetchStats();
      } else {
        setMessage('Erreur lors de la validation');
        setMessageType('error');
      }
    }
  };

  const handleReject = async (id) => {
    // Créer un modal personnalisé pour le rejet
    const reason = prompt('Raison du rejet (obligatoire):');
    if (!reason || reason.trim() === '') {
      setMessage('La raison du rejet est obligatoire');
      setMessageType('error');
      return;
    }

    // Confirmer le rejet
    const confirmReject = window.confirm(`Êtes-vous sûr de vouloir rejeter cet arrêt maladie ?\n\nRaison : ${reason}\n\nUn email sera envoyé au salarié pour l'informer du rejet.`);
    if (!confirmReject) return;

    try {
      const response = await axios.put(`${API_URL}/sick-leaves/${id}/reject`, {
        rejectedBy: 'Admin',
        reason: reason.trim()
      });

      if (response.data.success) {
        setMessage('Arrêt maladie rejeté - Email envoyé au salarié');
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
    
    // Demander si on veut envoyer l'email au comptable
    const sendToAccountant = window.confirm('Souhaitez-vous envoyer l\'arrêt maladie au comptable ?\n\nCliquez sur OK pour envoyer l\'email au comptable.\nCliquez sur Annuler pour marquer comme déclaré sans envoyer d\'email.');

    try {
      const response = await axios.put(`${API_URL}/sick-leaves/${id}/declare`, {
        declaredBy: 'Admin',
        notes: notes,
        sendToAccountant: sendToAccountant
      });

      if (response.data.success) {
        if (sendToAccountant) {
          setMessage('Arrêt maladie marqué comme déclaré et email envoyé au comptable');
        } else {
          setMessage('Arrêt maladie marqué comme déclaré (email non envoyé)');
        }
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

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet arrêt maladie ? Cette action est irréversible et aucun email ne sera envoyé.')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/sick-leaves/${id}`);

      if (response.data.success) {
        setMessage('Arrêt maladie supprimé avec succès');
        setMessageType('success');
        fetchSickLeaves();
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      setMessage('Erreur lors de la suppression');
      setMessageType('error');
    }
  };

  const handleResendAccountantEmail = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/sick-leaves/${id}/resend-accountant-email`);

      if (response.data.success) {
        setMessage('Email au comptable renvoyé avec succès');
        setMessageType('success');
        fetchSickLeaves();
      } else {
        setMessage('Erreur lors du renvoi de l\'email');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur renvoi email:', error);
      setMessage(error.response?.data?.error || 'Erreur lors du renvoi de l\'email au comptable');
      setMessageType('error');
    }
  };

  const openEditModal = (sickLeave) => {
    setEditingSickLeave(sickLeave);
    setEditFormData({
      startDate: sickLeave.startDate.split('T')[0], // Format YYYY-MM-DD
      endDate: sickLeave.endDate.split('T')[0]
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSickLeave(null);
    setEditFormData({ startDate: '', endDate: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingSickLeave) return;
    
    try {
      const response = await axios.put(`${API_URL}/sick-leaves/${editingSickLeave._id}`, {
        startDate: editFormData.startDate,
        endDate: editFormData.endDate
      });
      
      if (response.data.success) {
        setMessage('Dates modifiées avec succès');
        setMessageType('success');
        closeEditModal();
        fetchSickLeaves();
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      setMessage('Erreur lors de la modification des dates');
      setMessageType('error');
    }
  };

  const normalizeMimeType = (mimeType = '') => mimeType.split(';')[0].trim().toLowerCase();

  const getMimeExtension = (mimeType = '') => {
    const normalized = normalizeMimeType(mimeType);
    const map = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png'
    };
    return map[normalized] || '';
  };

  const handleDownload = async (sickLeave) => {
    if (!sickLeave?._id) {
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/sick-leaves/${sickLeave._id}/download`, {
        responseType: 'blob'
      });

      const rawMimeType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: rawMimeType });
      const mimeType = normalizeMimeType(rawMimeType);

      const contentDisposition = response.headers['content-disposition'];
      let fileName = sickLeave.originalFileName || `arret-maladie-${sickLeave._id}`;

      if (contentDisposition) {
        // Gestion des formats filename="..." ou filename*=UTF-8''
        const fileNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?\"?([^\";]+)/i);
        if (fileNameMatch && fileNameMatch[1]) {
          try {
            fileName = decodeURIComponent(fileNameMatch[1].replace(/\"/g, '').trim());
          } catch (decodeError) {
            fileName = fileNameMatch[1].replace(/\"/g, '').trim();
          }
        }
      }

      const extension = getMimeExtension(mimeType);
      if (extension && !fileName.toLowerCase().endsWith(`.${extension}`)) {
        fileName = `${fileName}.${extension}`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Fichier téléchargé:', fileName);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      setMessage('Erreur lors du téléchargement du fichier');
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

      {/* Bouton d'effacement */}
      <div className="admin-actions">
        <button
          className="btn btn-danger"
          onClick={clearAllSickLeaves}
          disabled={loading || (stats.total || 0) === 0}
          style={{
            opacity: (stats.total || 0) === 0 ? 0.5 : 1,
            cursor: (stats.total || 0) === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          🗑️ Effacer toutes les données
        </button>
        <p className="admin-warning">
          ⚠️ Attention : Ce bouton supprime uniquement les données de la base de données.<br/>
          Les fichiers sur le NAS sont conservés.
        </p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div className={`quality-score ${sickLeave.autoValidation.qualityScore >= 60 ? 'good' : 'poor'}`}>
                        Score: {sickLeave.autoValidation.qualityScore}/100
                      </div>
                      <button 
                        onClick={() => handleDelete(sickLeave._id)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.9em' }}
                        title="Supprimer (sans envoyer d'email)"
                      >
                        🗑️
                      </button>
                    </div>
                    {sickLeave.isOverdue && (
                      <div className="overdue-warning">⚠️ En retard</div>
                    )}
                    <div className="email-status" style={{ marginTop: '8px', fontSize: '0.75em' }}>
                      {/* Afficher validationEmail pour les arrêts validés/déclarés, confirmationEmail pour les autres */}
                      {(sickLeave.status === 'validated' || sickLeave.status === 'declared') ? (
                        sickLeave.validationEmail?.sent ? (
                          <div style={{ color: '#155724', marginBottom: '2px' }} title={`Email de validation envoyé le ${new Date(sickLeave.validationEmail.sentAt).toLocaleString('fr-FR')}`}>
                            ✅ Validation: Envoyé
                          </div>
                        ) : (
                          <div style={{ color: '#721c24', marginBottom: '2px' }} title="Email de validation non envoyé">
                            ❌ Validation: Non envoyé
                          </div>
                        )
                      ) : (
                        sickLeave.confirmationEmail?.sent ? (
                          <div style={{ color: '#155724', marginBottom: '2px' }} title={`Email de confirmation envoyé le ${new Date(sickLeave.confirmationEmail.sentAt).toLocaleString('fr-FR')}`}>
                            ✅ Confirmation: Envoyé
                          </div>
                        ) : (
                          <div style={{ color: '#721c24', marginBottom: '2px' }} title="Email de confirmation non envoyé">
                            ❌ Confirmation: Non envoyé
                          </div>
                        )
                      )}
                      {sickLeave.accountantNotification?.sent ? (
                        <div style={{ color: '#155724' }} title={`Email comptable envoyé le ${new Date(sickLeave.accountantNotification.sentAt).toLocaleString('fr-FR')} à ${sickLeave.accountantNotification.sentTo}`}>
                          ✅ Comptable: Envoyé
                        </div>
                      ) : (
                        <div style={{ color: '#721c24' }} title="Email comptable non envoyé">
                          ❌ Comptable: Non envoyé
                        </div>
                      )}
                    </div>
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
                    onClick={() => handleDownload(sickLeave)}
                    className="btn btn-download"
                    title="Télécharger"
                  >
                    📥
                  </button>
                  
                  {sickLeave.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => openEditModal(sickLeave)}
                        className="btn btn-warning"
                        title="Modifier les dates"
                      >
                        ✏️
                      </button>
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
                  
                  {(sickLeave.status === 'validated' || sickLeave.status === 'declared') && (
                    <button 
                      onClick={() => handleResendAccountantEmail(sickLeave._id)}
                      className="btn btn-warning"
                      title="Renvoyer l'email au comptable"
                    >
                      📧
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

      {/* Modal d'édition des dates */}
      {showEditModal && editingSickLeave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Modifier les dates</h3>
              <button onClick={closeEditModal} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Employé: {editingSickLeave.employeeName}</label>
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

export default SickLeaveAdmin;
