import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import EmployeeModal from '../components/EmployeeModal';
import DeclarationModal from '../components/DeclarationModal';
import DelayModal from '../components/DelayModal';
import OnboardingOffboardingModal from '../components/OnboardingOffboardingModal';
import UniformModal from '../components/UniformModal';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showOnboardingOffboardingModal, setShowOnboardingOffboardingModal] = useState(false);
  const [showUniformModal, setShowUniformModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [advanceRequests, setAdvanceRequests] = useState([]);
  const [advanceStats, setAdvanceStats] = useState({});
  const [selectedAdvanceRequest, setSelectedAdvanceRequest] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    fetchAdvanceRequests();
    fetchAdvanceStats();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      console.log('📊 Réponse API employés:', response.data);
      
      // L'API peut retourner soit { success: true, data: [...] } soit directement [...]
      let employeesData = null;
      if (response.data.success && response.data.data) {
        employeesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        employeesData = response.data;
      }
      
      if (employeesData) {
        setEmployees(employeesData);
        console.log('✅ Employés chargés:', employeesData.length);
      } else {
        console.error('❌ Format de données invalide:', response.data);
        setEmployees([]);
        toast.error('Format de données invalide');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des employés');
      console.error(error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };



  const handleDeclareMaladieAbsence = () => {
    setShowDeclarationModal(true);
  };

  const handleDeclareDelay = () => {
    setShowDelayModal(true);
  };

  const handleEntreeSortie = () => {
    setShowOnboardingOffboardingModal(true);
  };

  const handleTenue = () => {
    setShowUniformModal(true);
  };

  const handleViewTutors = () => {
    navigate('/tutors');
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleSendPassword = async (employee) => {
    try {
      if (!employee.email) {
        toast.error('Aucun email configuré pour cet employé');
        return;
      }

      const confirmMessage = `Envoyer un mot de passe par email à ${employee.name} (${employee.email}) ?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }

      console.log('🔐 Envoi mot de passe pour:', employee.name);
      
      // D'abord, appeler le backend pour générer et sauvegarder le mot de passe
      const backendResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api'}/auth/send-password/${employee._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.error || 'Erreur backend');
      }

      const backendData = await backendResponse.json();
      
      console.log('✅ Mot de passe sauvegardé et email envoyé via backend');
      
      // L'API backend a déjà envoyé l'email avec le bon template
      toast.success(`Mot de passe envoyé à ${employee.email}`);
      console.log('✅ Mot de passe envoyé via backend API');
    } catch (error) {
      console.error('❌ Erreur envoi mot de passe:', error);
      toast.error(`Erreur: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      console.log('🔍 Données employé à sauvegarder:', employeeData);
      
      if (editingEmployee) {
        console.log('📝 Modification employé existant:', editingEmployee._id);
        await api.put(`/employees/${editingEmployee._id}`, employeeData);
        toast.success('Employé modifié avec succès');
      } else {
        console.log('➕ Création nouvel employé');
        console.log('📤 Envoi POST vers /employees avec:', employeeData);
        const response = await api.post('/employees', employeeData);
        console.log('✅ Réponse API:', response.data);
        toast.success('Employé ajouté avec succès');
      }
      fetchEmployees();
      setShowModal(false);
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      console.error('❌ Erreur response:', error.response);
      console.error('❌ Erreur data:', error.response?.data);
      toast.error(`Erreur lors de la sauvegarde: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSaveDeclaration = async (declarationData) => {
    try {
      console.log('Données déclaration:', declarationData);
      
      if (declarationData.type === 'maladie') {
        // Arrêt maladie
        await api.put(`/employees/${declarationData.employeeId}`, {
          sickLeave: {
            isOnSickLeave: true,
            startDate: declarationData.startDate,
            endDate: declarationData.endDate
          }
        });
        toast.success('Arrêt maladie déclaré avec succès');
      } else {
        // Absence
        await api.put(`/employees/${declarationData.employeeId}`, {
          absence: {
            isAbsent: true,
            startDate: declarationData.startDate,
            endDate: declarationData.endDate,
            reason: declarationData.reason
          }
        });
        toast.success('Absence déclarée avec succès');
      }
      
      fetchEmployees();
      setShowDeclarationModal(false);
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data || error.message);
      toast.error('Erreur lors de la déclaration');
    }
  };

  const handleSaveDelay = async (delayData) => {
    try {
      console.log('🕐 Sauvegarde retard:', delayData);
      
      await api.post('/delays', delayData);
      toast.success('Retard déclaré avec succès');
      
      // Recharger les données
      fetchEmployees();
      setShowDelayModal(false);
    } catch (error) {
      console.error('❌ Erreur sauvegarde retard:', error);
      toast.error('Erreur lors de la déclaration du retard');
    }
  };

  const handleDeactivateEmployee = async (employeeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver cet employé ?')) {
      try {
        await api.patch(`/employees/${employeeId}/deactivate`);
        toast.success('Employé désactivé');
        fetchEmployees();
      } catch (error) {
        toast.error('Erreur lors de la désactivation');
      }
    }
  };

  const handleReactivateEmployee = async (employeeId) => {
    try {
      await api.patch(`/employees/${employeeId}/reactivate`);
      toast.success('Employé réactivé');
      fetchEmployees();
    } catch (error) {
      toast.error('Erreur lors de la réactivation');
    }
  };

  // Fonctions pour la gestion des acomptes
  const fetchAdvanceRequests = async () => {
    try {
      const response = await api.get('/advance-requests');
      if (response.data.success) {
        setAdvanceRequests(response.data.data);
      }
    } catch (error) {
      console.error('Erreur récupération demandes acompte:', error);
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
        setShowAdvanceModal(false);
        setSelectedAdvanceRequest(null);
      }
    } catch (error) {
      console.error('Erreur action acompte:', error);
      toast.error('Erreur lors de l\'action');
    }
  };

  const handleOpenAdvanceModal = (request) => {
    setSelectedAdvanceRequest(request);
    setShowAdvanceModal(true);
  };

  const handleCloseAdvanceModal = () => {
    setShowAdvanceModal(false);
    setSelectedAdvanceRequest(null);
  };

  const getRoleLabel = (role) => {
    const labels = {
      vendeuse: 'Vendeuse',
      apprenti: 'Apprenti',
      responsable: 'Responsable',
      manager: 'Manager',
      preparateur: 'Préparateur',
      chef_prod: 'Chef Prod',
      boulanger: 'Boulanger'
    };
    return labels[role] || role;
  };

  const getContractLabel = (contractType) => {
    const labels = {
      CDI: 'CDI',
      Apprentissage: 'Contrat d\'apprentissage'
    };
    return labels[contractType] || contractType;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employees fade-in">
      <div className="page-header">
        <h2>Gestion des employés</h2>
        <div className="header-actions">
          <button className="btn btn-info" onClick={handleViewTutors}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Tuteurs
          </button>
          <button className="btn btn-purple" onClick={handleEntreeSortie}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            Entrée/Sortie
          </button>
          <button className="btn btn-pink" onClick={handleTenue}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M16 20H8V10h8v10zm4-16H4v2h2v14h12V6h2V4zm-4 0H8V3h8v1z"/>
            </svg>
            Tenue
          </button>
          <button className="btn btn-success" onClick={handleDeclareMaladieAbsence}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            Déclarer maladie/absence
          </button>
          <button className="btn btn-warning" onClick={handleDeclareDelay}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Déclarer retard
          </button>
          <button className="btn btn-primary" onClick={handleAddEmployee}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Ajouter un employé
          </button>
          <button className="btn btn-info" onClick={() => setShowAdvanceModal(true)}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            💰 Acomptes ({advanceStats.pending || 0})
          </button>
        </div>
      </div>

      {/* Modal flottant pour ajouter/modifier un employé */}
      {showModal && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <EmployeeModal
              employee={editingEmployee}
              onSave={handleSaveEmployee}
              onClose={() => setShowModal(false)}
              employees={employees.filter(emp => emp.isActive)}
            />
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Contrat</th>
                <th>Âge</th>
                <th>Volume hebdo</th>
                <th>Compétences</th>
                <th>Jours formation</th>
                <th>Arrêt maladie</th>
                <th>Absences</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id}>
                  <td>{employee.name}</td>
                  <td>{getRoleLabel(employee.role)}</td>
                  <td>{getContractLabel(employee.contractType)}</td>
                  <td>
                    {employee.age} ans
                    {employee.isMinor && (
                      <span style={{ 
                        color: '#ffc107', 
                        fontSize: '0.8rem', 
                        marginLeft: '0.5rem',
                        fontWeight: 'bold'
                      }}>
                        (Mineur)
                      </span>
                    )}
                  </td>
                  <td>{employee.weeklyHours}h</td>
                  <td>
                    {employee.skills && employee.skills.length > 0
                      ? employee.skills.join(', ')
                      : 'Aucune'
                    }
                  </td>
                  <td>
                    {employee.trainingDays && employee.trainingDays.length > 0
                      ? employee.trainingDays.join(', ')
                      : '-'
                    }
                  </td>
                  <td>
                    {(() => {
                      // Vérifier d'abord l'ancien format (sickLeave.isOnSickLeave)
                      if (employee.sickLeave?.isOnSickLeave) {
                        // Vérifier si l'arrêt maladie est terminé depuis plus de 8 jours
                        if (employee.sickLeave?.endDate) {
                          const endDate = new Date(employee.sickLeave.endDate);
                          const today = new Date();
                          const daysSinceReturn = Math.floor((today - endDate) / (1000 * 60 * 60 * 24));
                          
                          // Masquer si repris depuis plus de 8 jours
                          if (daysSinceReturn > 8) {
                            return '-';
                          }
                        }
                        
                        return (
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                            {formatDate(employee.sickLeave.startDate)} - {formatDate(employee.sickLeave.endDate)}
                          </span>
                        );
                      }
                      
                      // Vérifier les absences de type "Arrêt maladie" créées automatiquement
                      const maladieAbsences = (Array.isArray(employee.absences) ? employee.absences : [])
                        .filter(absence => {
                          if (absence.type !== 'Arrêt maladie') return false;
                          
                          // Vérifier si l'absence est terminée depuis plus de 8 jours
                          const endDate = new Date(absence.endDate);
                          const today = new Date();
                          const daysSinceReturn = Math.floor((today - endDate) / (1000 * 60 * 60 * 24));
                          
                          // Inclure seulement si active ou terminée depuis moins de 8 jours
                          return daysSinceReturn <= 8;
                        });
                      
                      if (maladieAbsences && maladieAbsences.length > 0) {
                        // Prendre la première absence active
                        const activeAbsence = maladieAbsences[0];
                        return (
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                            {formatDate(activeAbsence.startDate)} - {formatDate(activeAbsence.endDate)}
                          </span>
                        );
                      }
                      
                      return '-';
                    })()}
                  </td>
                  <td>
                    {(() => {
                      // Compter les absences non-maladie
                      const otherAbsences = (Array.isArray(employee.absences) ? employee.absences : [])
                        .filter(absence => absence.type !== 'Arrêt maladie');
                      
                      if (otherAbsences.length > 0) {
                        return (
                          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                            {otherAbsences.length} absence{otherAbsences.length > 1 ? 's' : ''}
                          </span>
                        );
                      }
                      return '-';
                    })()}
                  </td>
                  <td>
                    <span style={{
                      color: employee.isActive ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {employee.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEditEmployee(employee)}
                      style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                    >
                      ✏️ Modifier
                    </button>
                    {employee.email && (
                      <button
                        className="btn btn-info"
                        onClick={() => handleSendPassword(employee)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
                        title="Envoyer un mot de passe par email"
                      >
                        🔐 Mot de passe
                      </button>
                    )}
                    {employee.isActive ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeactivateEmployee(employee._id)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
                      >
                        🚫 Désactiver
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={() => handleReactivateEmployee(employee._id)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
                      >
                        ✅ Réactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {employees.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>👥 Aucun employé trouvé</h3>
          <p>Commencez par ajouter votre premier employé.</p>
          <button className="btn btn-primary" onClick={handleAddEmployee}>
            Ajouter un employé
          </button>
        </div>
      )}

      {/* Modal de déclaration maladie/absence */}
      <DeclarationModal
        show={showDeclarationModal}
        onClose={() => setShowDeclarationModal(false)}
        onSave={handleSaveDeclaration}
        employees={employees.filter(emp => emp.isActive)}
      />
      
      {/* Modal de déclaration retard */}
      <DelayModal
        show={showDelayModal}
        onClose={() => setShowDelayModal(false)}
        onSave={handleSaveDelay}
        employees={employees.filter(emp => emp.isActive)}
      />

      {/* Modal Entrée/Sortie */}
      <OnboardingOffboardingModal
        isOpen={showOnboardingOffboardingModal}
        onClose={() => setShowOnboardingOffboardingModal(false)}
        employees={employees.filter(emp => emp.isActive)}
      />

      {/* Modal Tenue */}
      <UniformModal
        isOpen={showUniformModal}
        onClose={() => setShowUniformModal(false)}
        employees={employees.filter(emp => emp.isActive)}
      />

      {/* Modal de gestion des acomptes */}
      {showAdvanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>💰 Gestion des Demandes d'Acompte</h3>
              <button className="close-btn" onClick={handleCloseAdvanceModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
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

              {/* Liste des demandes */}
              <div className="advance-requests-list">
                <h4>📋 Demandes en attente</h4>
                {advanceRequests
                  .filter(req => req.status === 'pending')
                  .map(request => (
                    <div key={request._id} className="advance-request-card">
                      <div className="request-info">
                        <div className="employee-name">{request.employeeName}</div>
                        <div className="request-amount">{request.amount}€</div>
                        <div className="request-month">Déduction: {request.deductionMonth}</div>
                        <div className="request-date">
                          Demandé le: {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        {request.comment && (
                          <div className="request-comment">
                            <strong>Commentaire:</strong> {request.comment}
                          </div>
                        )}
                      </div>
                      <div className="request-actions">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleAdvanceAction(request._id, 'approved')}
                        >
                          ✅ Approuver
                        </button>
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => handleOpenAdvanceModal(request)}
                        >
                          ✏️ Modifier
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleAdvanceAction(request._id, 'rejected')}
                        >
                          ❌ Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                
                {advanceRequests.filter(req => req.status === 'pending').length === 0 && (
                  <div className="no-requests">
                    <p>Aucune demande d'acompte en attente</p>
                  </div>
                )}
              </div>

              {/* Historique des demandes traitées */}
              <div className="advance-history">
                <h4>📊 Historique</h4>
                {advanceRequests
                  .filter(req => req.status !== 'pending')
                  .slice(0, 10) // Limiter à 10 dernières
                  .map(request => (
                    <div key={request._id} className="advance-history-item">
                      <div className="history-info">
                        <span className="employee-name">{request.employeeName}</span>
                        <span className="amount">{request.amount}€</span>
                        <span className={`status status-${request.status}`}>
                          {request.status === 'approved' ? '✅ Approuvé' : '❌ Rejeté'}
                        </span>
                        <span className="date">
                          {new Date(request.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification d'acompte */}
      {selectedAdvanceRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Modifier la Demande d'Acompte</h3>
              <button className="close-btn" onClick={handleCloseAdvanceModal}>
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
                  onClick={handleCloseAdvanceModal}
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

export default Employees;

