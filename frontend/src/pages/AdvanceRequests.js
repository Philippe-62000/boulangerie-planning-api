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
  const [selectedMonth, setSelectedMonth] = useState(''); // Filtre par mois

  useEffect(() => {
    fetchAdvanceRequests();
    fetchAdvanceStats();
  }, [selectedMonth, filter]); // Recharger quand le mois ou le filtre change

  const fetchAdvanceRequests = async () => {
    try {
      setLoading(true);
      // Construire les paramètres de requête
      const params = {};
      if (selectedMonth) {
        params.month = selectedMonth;
      }
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await api.get('/advance-requests', { params });
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
      // Construire les paramètres de requête
      const params = {};
      if (selectedMonth) {
        params.month = selectedMonth;
      }
      
      const response = await api.get('/advance-requests/stats', { params });
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
        // Recharger les données
        const params = {};
        if (selectedMonth) params.month = selectedMonth;
        if (filter !== 'all') params.status = filter;
        
        const requestsResponse = await api.get('/advance-requests', { params });
        if (requestsResponse.data.success) {
          setAdvanceRequests(requestsResponse.data.data);
        }
        
        const statsParams = {};
        if (selectedMonth) statsParams.month = selectedMonth;
        const statsResponse = await api.get('/advance-requests/stats', { params: statsParams });
        if (statsResponse.data.success) {
          setAdvanceStats(statsResponse.data.data);
        }
        
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
    // Le filtrage est déjà fait côté serveur via les paramètres
    // On retourne directement les résultats
    return advanceRequests;
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

  const handlePrint = () => {
    const filteredRequests = getFilteredRequests();
    const filterLabel = filter === 'all' ? 'Toutes' : 
                        filter === 'pending' ? 'En attente' :
                        filter === 'approved' ? 'Approuvées' : 'Rejetées';
    const monthLabel = selectedMonth || 'Tous les mois';
    
    // Créer une fenêtre d'impression
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Demandes d'Acompte - ${filterLabel} - ${monthLabel}</title>
        <meta charset="utf-8">
        <style>
          @media print {
            @page {
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              color: #000;
              margin: 0;
              padding: 20px;
            }
            .no-print { display: none !important; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            color: #333;
          }
          .header .filter-info {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .print-table th {
            background-color: #f0f0f0;
            border: 1px solid #333;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          .print-table td {
            border: 1px solid #333;
            padding: 8px;
          }
          .print-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
          }
          .status-approved {
            background-color: #d4edda;
            color: #155724;
          }
          .status-pending {
            background-color: #fff3cd;
            color: #856404;
          }
          .status-rejected {
            background-color: #f8d7da;
            color: #721c24;
          }
          .amount {
            font-weight: bold;
            color: #28a745;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 Gestion des Demandes d'Acompte</h1>
          <div class="filter-info">
            <strong>Filtre:</strong> ${filterLabel} | <strong>Mois:</strong> ${monthLabel}
          </div>
          <div class="filter-info">
            <strong>Date d'impression:</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <table class="print-table">
          <thead>
            <tr>
              <th>Salarié</th>
              <th>Email</th>
              <th>Montant</th>
              <th>Mois de déduction</th>
              <th>Date de demande</th>
              <th>Statut</th>
              <th>Commentaire manager</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRequests.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                  Aucune demande d'acompte trouvée
                </td>
              </tr>
            ` : filteredRequests.map(request => `
              <tr>
                <td>${request.employeeName || '-'}</td>
                <td>${request.employeeEmail || '-'}</td>
                <td class="amount">${request.amount || 0}€</td>
                <td>${request.deductionMonth || '-'}</td>
                <td>${new Date(request.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>
                  <span class="status-badge status-${request.status || 'pending'}">
                    ${getStatusLabel(request.status)}
                  </span>
                </td>
                <td>${request.managerComment || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${filteredRequests.length > 0 ? `
          <div style="margin-top: 20px; text-align: right;">
            <strong>Total: ${filteredRequests.length} demande(s) | 
            Montant total: ${filteredRequests.reduce((sum, r) => sum + (r.amount || 0), 0)}€</strong>
          </div>
        ` : ''}
        <div class="footer">
          <p>Boulangerie Planning - Impression générée le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis lancer l'impression
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
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
          <button 
            className="btn btn-secondary"
            onClick={handlePrint}
            title="Imprimer les demandes affichées"
          >
            🖨️ Imprimer
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
        
        {/* Sélecteur de mois */}
        <div className="month-filter">
          <label htmlFor="month-select">📅 Mois :</label>
          <select 
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-select"
          >
            <option value="">Tous les mois</option>
            {(() => {
              const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
              const currentYear = new Date().getFullYear();
              const options = [];
              
              // Ajouter les mois pour l'année en cours et l'année suivante
              for (let year = currentYear; year <= currentYear + 1; year++) {
                months.forEach((month, index) => {
                  options.push(
                    <option key={`${month} ${year}`} value={`${month} ${year}`}>
                      {month} {year}
                    </option>
                  );
                });
              }
              
              return options;
            })()}
          </select>
        </div>
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
