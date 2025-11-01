import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import DocumentsSection from '../components/DocumentsSection';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [generalDocuments, setGeneralDocuments] = useState([]);
  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Charger les documents généraux
      const generalResponse = await api.get('/documents/general');
      if (generalResponse.data.success) {
        setGeneralDocuments(generalResponse.data.data);
      }
      
      // Charger les documents personnels si l'utilisateur a un ID employé
      if (user.employeeId) {
        const personalResponse = await api.get(`/documents/personal/${user.employeeId}`);
        if (personalResponse.data.success) {
          setPersonalDocuments(personalResponse.data.data);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, documentTitle) => {
    try {
      console.log('⬇️ Téléchargement document:', documentId);
      
      // Construire l'URL de téléchargement avec l'ID employé si nécessaire
      let downloadUrl = `/documents/${documentId}/download`;
      if (user.employeeId) {
        downloadUrl += `?employeeId=${user.employeeId}`;
      }
      
      // Créer un lien de téléchargement temporaire
      const link = document.createElement('a');
      link.href = `${import.meta.env.VITE_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api'}${downloadUrl}`;
      link.download = documentTitle;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`📥 Téléchargement de "${documentTitle}" démarré`);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du document');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'notice': '📋',
      'procedure': '📝',
      'formation': '🎓',
      'payslip': '💰',
      'contract': '📄',
      'other': '📁'
    };
    return icons[category] || '📄';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'notice': 'Notice',
      'procedure': 'Procédure',
      'formation': 'Formation',
      'payslip': 'Fiche de paie',
      'contract': 'Contrat',
      'other': 'Autre'
    };
    return labels[category] || category;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="employee-dashboard">
        <div className="loading-container">
          <div className="loading"></div>
          <p>Chargement de vos documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <h1>📁 Mes Documents</h1>
        <p>Bienvenue {user?.name || 'Employé'}, consultez vos documents personnels et généraux</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          📋 Documents Généraux ({generalDocuments.length})
        </button>
        <button 
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          👤 Mes Documents ({personalDocuments.length})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'general' ? (
          <DocumentsSection
            title="📋 Documents Généraux"
            description="Documents accessibles à tous les employés"
            documents={generalDocuments}
            onDownload={handleDownload}
            getCategoryIcon={getCategoryIcon}
            getCategoryLabel={getCategoryLabel}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
            emptyMessage="Aucun document général disponible"
          />
        ) : (
          <DocumentsSection
            title="👤 Mes Documents Personnels"
            description="Vos documents personnels (fiches de paie, contrats, etc.)"
            documents={personalDocuments}
            onDownload={handleDownload}
            getCategoryIcon={getCategoryIcon}
            getCategoryLabel={getCategoryLabel}
            formatFileSize={formatFileSize}
            formatDate={formatDate}
            emptyMessage="Aucun document personnel disponible"
            isPersonal={true}
          />
        )}
      </div>

      <div className="dashboard-footer">
        <div className="info-box">
          <h3>ℹ️ Informations importantes</h3>
          <ul>
            <li>📋 Les <strong>documents généraux</strong> sont accessibles à tous les employés</li>
            <li>👤 Les <strong>documents personnels</strong> sont spécifiques à votre compte</li>
            <li>⏰ Les documents personnels sont automatiquement supprimés après 1 mois</li>
            <li>📥 Cliquez sur "Télécharger" pour sauvegarder un document sur votre appareil</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
