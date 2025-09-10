import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Tutors.css';

const Tutors = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      
      // L'API peut retourner soit { success: true, data: [...] } soit directement [...]
      let employeesData = null;
      if (response.data.success && response.data.data) {
        employeesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        employeesData = response.data;
      }
      
      if (employeesData) {
        setEmployees(employeesData);
      } else {
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

  // Grouper les employés par tuteur
  const getTutorsAndApprentices = () => {
    const tutors = {};
    const apprentices = employees.filter(emp => emp.contractType === 'Apprentissage' && emp.tutor);
    
    apprentices.forEach(apprentice => {
      const tutorId = apprentice.tutor;
      if (!tutors[tutorId]) {
        const tutor = employees.find(emp => emp._id === tutorId);
        if (tutor) {
          tutors[tutorId] = {
            tutor: tutor,
            apprentices: []
          };
        }
      }
      if (tutors[tutorId]) {
        tutors[tutorId].apprentices.push(apprentice);
      }
    });
    
    return Object.values(tutors);
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading"></div>
          <p>Chargement des tuteurs...</p>
        </div>
      </div>
    );
  }

  const tutorsData = getTutorsAndApprentices();

  return (
    <div className="tutors fade-in">
      <div className="page-header">
        <h2>👨‍🏫 Gestion des Tuteurs</h2>
        <p>Liste des tuteurs et de leurs apprentis</p>
      </div>

      {tutorsData.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>👨‍🏫 Aucun tuteur trouvé</h3>
          <p>Aucun apprenti n'a de tuteur assigné pour le moment.</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tuteur</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Apprentis</th>
                  <th>Détails des apprentis</th>
                </tr>
              </thead>
              <tbody>
                {tutorsData.map((tutorData, index) => (
                  <tr key={tutorData.tutor._id}>
                    <td>
                      <strong>{tutorData.tutor.name}</strong>
                    </td>
                    <td>{getRoleLabel(tutorData.tutor.role)}</td>
                    <td>
                      <span style={{
                        color: tutorData.tutor.isActive ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {tutorData.tutor.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '50%',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        {tutorData.apprentices.length}
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: '300px' }}>
                        {tutorData.apprentices.map((apprentice, idx) => (
                          <div key={apprentice._id} style={{ 
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#495057' }}>
                              {apprentice.name}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                              Âge: {apprentice.age} ans
                              {apprentice.isMinor && (
                                <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>
                                  (Mineur)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                              Contrat: {apprentice.contractType}
                            </div>
                            {apprentice.contractEndDate && (
                              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                                Fin: {formatDate(apprentice.contractEndDate)}
                              </div>
                            )}
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                              Formation: {apprentice.trainingDays?.join(', ') || 'Aucune'}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                              Statut: 
                              <span style={{
                                color: apprentice.isActive ? '#28a745' : '#dc3545',
                                fontWeight: 'bold',
                                marginLeft: '0.25rem'
                              }}>
                                {apprentice.isActive ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>📊 Statistiques</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
              {tutorsData.length}
            </div>
            <div style={{ color: '#6c757d' }}>Tuteurs actifs</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
              {employees.filter(emp => emp.contractType === 'Apprentissage').length}
            </div>
            <div style={{ color: '#6c757d' }}>Apprentis total</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
              {employees.filter(emp => emp.contractType === 'Apprentissage' && !emp.tutor).length}
            </div>
            <div style={{ color: '#6c757d' }}>Sans tuteur</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutors;
