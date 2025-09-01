import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import EmployeeModal from '../components/EmployeeModal';
import SickLeaveModal from '../components/SickLeaveModal';
import AbsenceModal from '../components/AbsenceModal';
import { Dropdown, DropdownButton } from 'react-bootstrap';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSickLeaveModal, setShowSickLeaveModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

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



  const handleDeclareMaladieAbsence = (type) => {
    if (type === 'maladie') {
      setShowSickLeaveModal(true);
    } else if (type === 'absence') {
      setShowAbsenceModal(true);
    }
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

  const handleSaveSickLeave = async (sickLeaveData) => {
    try {
      console.log('Données arrêt maladie:', sickLeaveData);
      
      // Utiliser l'endpoint PUT existant en attendant que l'API soit mise à jour
      const response = await api.put(`/employees/${sickLeaveData.employeeId}`, {
        sickLeave: {
          isOnSickLeave: true,
          startDate: sickLeaveData.startDate,
          endDate: sickLeaveData.endDate
        }
      });
      
      console.log('Réponse API:', response.data);
      toast.success('Arrêt maladie déclaré avec succès');
      fetchEmployees();
      setShowSickLeaveModal(false);
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data || error.message);
      toast.error('Erreur lors de la déclaration d\'arrêt maladie');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Gestion des employés</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <DropdownButton
            id="dropdown-maladie-absence"
            title="🏥 Déclarer Maladie/Absence"
            variant="primary"
            onSelect={handleDeclareMaladieAbsence}
          >
            <Dropdown.Item eventKey="maladie">🏥 Déclarer Maladie</Dropdown.Item>
            <Dropdown.Item eventKey="absence">📋 Déclarer Absence</Dropdown.Item>
          </DropdownButton>
          <button className="btn btn-primary" onClick={handleAddEmployee}>
            ➕ Ajouter un employé
          </button>
        </div>
      </div>

      {/* Zone de formulaire qui apparaît au-dessus du tableau */}
      {(showModal || showSickLeaveModal || showAbsenceModal) && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f8f9fa' }}>
          <div style={{ padding: '1rem' }}>
            {showModal && (
              <EmployeeModal
                employee={editingEmployee}
                onSave={handleSaveEmployee}
                onClose={() => setShowModal(false)}
              />
            )}
            {showSickLeaveModal && (
              <SickLeaveModal
                employees={employees.filter(emp => emp.isActive)}
                onSave={handleSaveSickLeave}
                onClose={() => setShowSickLeaveModal(false)}
              />
            )}
            {showAbsenceModal && (
              <AbsenceModal
                show={showAbsenceModal}
                onHide={() => setShowAbsenceModal(false)}
                onSuccess={() => {
                  fetchEmployees();
                  toast.success('Absence déclarée avec succès');
                }}
              />
            )}
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


    </div>
  );
};

export default Employees;

