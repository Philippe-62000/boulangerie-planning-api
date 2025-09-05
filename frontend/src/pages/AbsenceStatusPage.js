import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import AbsenceStatus from '../components/AbsenceStatus';
import './AbsenceStatusPage.css';

const AbsenceStatusPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      console.log('📊 Données employés reçues:', response.data);
      
      // Vérifier la structure des données
      if (response.data && response.data.length > 0) {
        const firstEmployee = response.data[0];
        console.log('🔍 Premier employé:', {
          id: firstEmployee._id,
          name: firstEmployee.name,
          hasAbsences: !!firstEmployee.absences,
          hasSickLeaves: !!firstEmployee.sickLeaves,
          hasDelays: !!firstEmployee.delays,
          absencesCount: firstEmployee.absences?.length || 0,
          sickLeavesCount: firstEmployee.sickLeaves?.length || 0,
          delaysCount: firstEmployee.delays?.length || 0
        });
      }
      
      setEmployees(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des employés');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="absence-status-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données d'absences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absence-status-page">
      <AbsenceStatus employees={employees} />
    </div>
  );
};

export default AbsenceStatusPage;
