import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import AbsenceStatus from '../components/AbsenceStatus';
import DeclarationModal from '../components/DeclarationModal';
import DelayModal from '../components/DelayModal';
import './AbsenceStatusPage.css';

const AbsenceStatusPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);

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
      
      // Vérifier que response.data.data est un tableau
      if (response.data.success && Array.isArray(response.data.data)) {
        setEmployees(response.data.data);
      } else {
        console.error('❌ response.data.data n\'est pas un tableau:', response.data);
        setEmployees([]);
      }
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

  const handleSaveDeclaration = async (declarationData) => {
    try {
      console.log('📋 Sauvegarde déclaration:', declarationData);
      
      if (declarationData.type === 'maladie') {
        await api.post('/sick-leaves', declarationData);
        toast.success('Arrêt maladie déclaré avec succès');
      } else {
        await api.post('/absences', declarationData);
        toast.success('Absence déclarée avec succès');
      }
      
      // Recharger les données
      fetchEmployees();
    } catch (error) {
      console.error('❌ Erreur sauvegarde déclaration:', error);
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
    } catch (error) {
      console.error('❌ Erreur sauvegarde retard:', error);
      toast.error('Erreur lors de la déclaration du retard');
    }
  };

  return (
    <div className="absence-status-page">
      {/* Onglets */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            📊 État des absences
          </button>
          <button
            className={`tab-button ${activeTab === 'declare-maladie' ? 'active' : ''}`}
            onClick={() => setActiveTab('declare-maladie')}
          >
            🏥 Déclarer maladie/absence
          </button>
          <button
            className={`tab-button ${activeTab === 'declare-delay' ? 'active' : ''}`}
            onClick={() => setActiveTab('declare-delay')}
          >
            🕐 Déclarer retard
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === 'status' && (
          <AbsenceStatus employees={employees} />
        )}
        
        {activeTab === 'declare-maladie' && (
          <div className="declaration-section">
            <div className="declaration-header">
              <h2>🏥 Déclaration d'arrêt maladie ou d'absence</h2>
              <p>Utilisez ce formulaire pour déclarer un arrêt maladie ou une absence pour un employé.</p>
            </div>
            <button
              className="btn btn-primary declaration-btn"
              onClick={() => setShowDeclarationModal(true)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              Ouvrir le formulaire de déclaration
            </button>
          </div>
        )}
        
        {activeTab === 'declare-delay' && (
          <div className="declaration-section">
            <div className="declaration-header">
              <h2>🕐 Déclaration de retard</h2>
              <p>Utilisez ce formulaire pour déclarer un retard pour un employé.</p>
            </div>
            <button
              className="btn btn-primary declaration-btn"
              onClick={() => setShowDelayModal(true)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Ouvrir le formulaire de retard
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeclarationModal
        show={showDeclarationModal}
        onClose={() => setShowDeclarationModal(false)}
        onSave={handleSaveDeclaration}
        employees={employees}
      />
      
      <DelayModal
        show={showDelayModal}
        onClose={() => setShowDelayModal(false)}
        onSave={handleSaveDelay}
        employees={employees}
      />
    </div>
  );
};

export default AbsenceStatusPage;
