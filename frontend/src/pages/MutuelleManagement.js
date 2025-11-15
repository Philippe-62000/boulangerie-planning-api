import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MutuelleManagement.css';

const MutuelleManagement = () => {
  const [mutuelles, setMutuelles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api';

  useEffect(() => {
    fetchMutuelles();
    fetchStats();
    fetchEmployees();
  }, [selectedStatus, currentPage]);

  const fetchMutuelles = async () => {
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

      const response = await axios.get(`${API_URL}/mutuelle?${params}`);
      
      if (response.data.success) {
        setMutuelles(response.data.data.mutuelles);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Erreur récupération justificatifs mutuelle:', error);
      setMessage('Erreur lors du chargement des justificatifs mutuelle');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/mutuelle/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/mutuelle/employees-list`);
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération liste employés:', error);
    }
  };

  const handleValidate = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/mutuelle/${id}/validate`, {
        validatedBy: 'Admin',
        notes: 'Validé par l\'administrateur'
      });

      if (response.data.success) {
        setMessage('Justificatif mutuelle validé avec succès');
        setMessageType('success');
        fetchMutuelles();
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      setMessage('Erreur lors de la validation');
      setMessageType('error');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Raison du rejet (ex: Document illisible):');
    if (!reason) return;

    try {
      const response = await axios.put(`${API_URL}/mutuelle/${id}/reject`, {
        rejectedBy: 'Admin',
        reason: reason
      });

      if (response.data.success) {
        setMessage('Justificatif mutuelle rejeté');
        setMessageType('success');
        fetchMutuelles();
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      setMessage('Erreur lors du rejet');
      setMessageType('error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce justificatif ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/mutuelle/${id}`);

      if (response.data.success) {
        setMessage('Justificatif mutuelle supprimé avec succès');
        setMessageType('success');
        fetchMutuelles();
        fetchStats();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      setMessage('Erreur lors de la suppression');
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

  const handleDownload = async (mutuelle) => {
    if (!mutuelle?._id) {
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/mutuelle/${mutuelle._id}/download`, {
        responseType: 'blob'
      });

      const rawMimeType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: rawMimeType });
      const mimeType = normalizeMimeType(rawMimeType);

      const contentDisposition = response.headers['content-disposition'];
      let fileName = mutuelle.originalFileName || `mutuelle-${mutuelle._id}`;

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
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setMessage('Erreur lors du téléchargement');
      setMessageType('error');
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const handlePrintList = async () => {
    try {
      // Récupérer les justificatifs mutuelle pour avoir les dates d'envoi
      const mutuellesResponse = await axios.get(`${API_URL}/mutuelle?limit=1000`);
      const allMutuelles = mutuellesResponse.data.success ? mutuellesResponse.data.data.mutuelles : [];
      
      const printWindow = window.open('', '_blank');
      const employeesWithMutuelle = employees.filter(emp => emp.mutuelle === 'Oui Entreprise');
      const employeesWithoutMutuelle = employees.filter(emp => emp.mutuelle === 'Non Perso');
      
      // Créer un map des dates d'envoi par employé (dernier justificatif envoyé)
      const mutuelleDatesMap = {};
      allMutuelles.forEach(mut => {
        const empId = mut.employeeId?._id || mut.employeeId;
        if (empId && (!mutuelleDatesMap[empId] || new Date(mut.uploadDate) > new Date(mutuelleDatesMap[empId]))) {
          mutuelleDatesMap[empId] = mut.uploadDate;
        }
      });
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Liste des Mutuelles</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; }
              h2 { margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Liste des Mutuelles - ${new Date().toLocaleDateString('fr-FR')}</h1>
            
            <h2>Salariés avec Mutuelle Entreprise (${employeesWithMutuelle.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                ${employeesWithMutuelle.map(emp => `
                  <tr>
                    <td>${emp.name}</td>
                    <td>${emp.email || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <h2>Salariés avec Mutuelle Personnelle (${employeesWithoutMutuelle.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Date d'envoi du justificatif</th>
                </tr>
              </thead>
              <tbody>
                ${employeesWithoutMutuelle.map(emp => {
                  const empId = emp._id || emp.id;
                  const uploadDate = mutuelleDatesMap[empId] 
                    ? new Date(mutuelleDatesMap[empId]).toLocaleDateString('fr-FR')
                    : '-';
                  return `
                    <tr>
                      <td>${emp.name}</td>
                      <td>${uploadDate}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Erreur récupération justificatifs pour impression:', error);
      setMessage('Erreur lors de la récupération des données pour impression');
      setMessageType('error');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'En attente', class: 'status-pending' },
      validated: { text: 'Validé', class: 'status-validated' },
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
    <div className="mutuelle-management">
      <div className="management-header">
        <h1>🏥 Gestion des Mutuelles</h1>
        <p>Suivi et validation des justificatifs de mutuelle personnelle</p>
      </div>

      {/* Statistiques */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{stats.total || 0}</div>
          <div className="stat-label">Total justificatifs</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending || 0}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card validated">
          <div className="stat-number">{stats.validated || 0}</div>
          <div className="stat-label">Validés</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.employees?.withMutuelle || 0}</div>
          <div className="stat-label">Avec mutuelle entreprise</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.employees?.withoutMutuelle || 0}</div>
          <div className="stat-label">Avec mutuelle personnelle</div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-container" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handlePrint} className="btn btn-primary">
          🖨️ Imprimer la liste des mutuelles
        </button>
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
          <option value="rejected">Rejetés</option>
        </select>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Liste des justificatifs */}
      <div className="mutuelles-list">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : mutuelles.length === 0 ? (
          <div className="no-data">Aucun justificatif mutuelle trouvé</div>
        ) : (
          <div className="mutuelles-table">
            <div className="table-header">
              <div>Salarié</div>
              <div>Date upload</div>
              <div>Fichier</div>
              <div>Statut</div>
              <div>Validation</div>
              <div>Actions</div>
            </div>
            
            {mutuelles.map((mutuelle) => (
              <div key={mutuelle._id} className="table-row">
                <div className="employee-info">
                  <div className="employee-name">{mutuelle.employeeName}</div>
                  <div className="employee-email">{mutuelle.employeeEmail}</div>
                </div>
                
                <div className="date-info">
                  {formatDate(mutuelle.uploadDate)}
                </div>
                
                <div className="file-info">
                  <div className="file-name">{mutuelle.originalFileName}</div>
                  <div className="file-details">
                    {formatFileSize(mutuelle.fileSize)} • {mutuelle.fileType.split('/')[1].toUpperCase()}
                  </div>
                </div>
                
                <div className="status-info">
                  {getStatusBadge(mutuelle.status)}
                  {mutuelle.expirationDate && mutuelle.status === 'validated' && (
                    <div className="expiration-info">
                      Expire le: {formatDate(mutuelle.expirationDate)}
                    </div>
                  )}
                </div>
                
                <div className="validation-info">
                  <div className="auto-validation">
                    <div className={`quality-score ${mutuelle.autoValidation.qualityScore >= 60 ? 'good' : 'poor'}`}>
                      Score: {mutuelle.autoValidation.qualityScore}/100
                    </div>
                    <div className="validation-message">
                      {mutuelle.autoValidation.validationMessage}
                    </div>
                  </div>
                </div>
                
                <div className="actions">
                  <button 
                    onClick={() => handleDownload(mutuelle)}
                    className="action-btn download"
                    title="Télécharger"
                  >
                    📥
                  </button>
                  
                  {mutuelle.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleValidate(mutuelle._id)}
                        className="action-btn validate"
                        title="Valider"
                      >
                        ✅
                      </button>
                      <button 
                        onClick={() => handleReject(mutuelle._id)}
                        className="action-btn reject"
                        title="Rejeter"
                      >
                        ❌
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={() => handleDelete(mutuelle._id)}
                    className="action-btn delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
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

      {/* Modal d'impression */}
      {showPrintModal && (
        <div className="modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🖨️ Imprimer la liste des mutuelles</h3>
              <button className="close-btn" onClick={() => setShowPrintModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Voulez-vous imprimer la liste des salariés avec leur statut mutuelle ?</p>
              <div className="modal-actions">
                <button onClick={handlePrintList} className="btn btn-primary">
                  Imprimer
                </button>
                <button onClick={() => setShowPrintModal(false)} className="btn btn-secondary">
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

export default MutuelleManagement;

