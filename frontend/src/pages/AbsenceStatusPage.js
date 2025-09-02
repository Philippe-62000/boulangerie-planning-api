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
