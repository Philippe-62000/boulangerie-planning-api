import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import EmployeeModal from '../components/EmployeeModal';
import DeclarationModal from '../components/DeclarationModal';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des employés');
      console.error(error);
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

  const handleViewTutors = () => {
    navigate('/tutors');
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, employeeData);
        toast.success('Employé modifié avec succès');
      } else {
        await api.post('/employees', employeeData);
        toast.success('Employé ajouté avec succès');
      }
      fetchEmployees();
      setShowModal(false);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
  };

  const handleSaveDeclaration = async (declarationData) => {
    try {
      console.log('Données déclaration:', declarationData);
      
      if (declarationData.type === 'maladie') {
        // Arrêt maladie
        const response = await api.put(`/employees/${declarationData.employeeId}`, {
          sickLeave: {
            isOnSickLeave: true,
            startDate: declarationData.startDate,
            endDate: declarationData.endDate
          }
        });
        toast.success('Arrêt maladie déclaré avec succès');
      } else {
        // Absence
        const response = await api.put(`/employees/${declarationData.employeeId}`, {
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
          <button className="btn btn-success" onClick={handleDeclareMaladieAbsence}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            Déclarer maladie/absence
          </button>
          <button className="btn btn-primary" onClick={handleAddEmployee}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Ajouter un employé
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
                    {employee.sickLeave?.isOnSickLeave ? (
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        {formatDate(employee.sickLeave.startDate)} - {formatDate(employee.sickLeave.endDate)}
                      </span>
                    ) : (
                      '-'
                    )}
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
    </div>
  );
};

export default Employees;

