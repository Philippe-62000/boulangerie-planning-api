import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Parameters.css';

const Parameters = () => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchParameters();
  }, []);

  const fetchParameters = async () => {
    setLoading(true);
    try {
      const response = await api.get('/parameters');
      setParameters(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (index, field, value) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const saveParameters = async () => {
    setSaving(true);
    try {
      console.log('📊 Paramètres à sauvegarder:', parameters);
      
      // Validation des données
      const parametersToSave = parameters.map(param => {
        if (!param._id) {
          console.error('❌ Paramètre sans ID:', param);
          throw new Error('Paramètre sans ID détecté');
        }
        
        const displayName = param.displayName?.trim() || '';
        const kmValue = parseFloat(param.kmValue) || 0;
        
        // Vérifier qu'au moins un champ a une valeur
        if (!displayName && kmValue === 0) {
          console.warn('⚠️ Paramètre sans valeur:', param);
          // Ne pas exclure, mais donner des valeurs par défaut
        }
        
        return {
          _id: param._id,
          displayName: displayName || `Paramètre ${param.name || 'inconnu'}`,
          kmValue: kmValue
        };
      });
      
      console.log('📤 Données envoyées:', parametersToSave);
      console.log('📤 URL de la requête:', '/api/parameters/batch');
      
      // Debug détaillé de chaque paramètre
      parametersToSave.forEach((param, index) => {
        console.log(`📋 Paramètre ${index + 1}:`, {
          _id: param._id,
          displayName: param.displayName,
          kmValue: param.kmValue,
          displayNameLength: param.displayName?.length || 0,
          kmValueType: typeof param.kmValue,
          kmValueIsNaN: isNaN(param.kmValue)
        });
      });
      
      const response = await api.put('/parameters/batch', {
        parameters: parametersToSave
      });
      
      console.log('✅ Réponse reçue:', response.data);
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="parameters fade-in">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading"></div>
            <p>Chargement des paramètres...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="parameters fade-in">
      <div className="page-header">
        <h2>⚙️ Paramètres - Frais KM</h2>
        <div className="header-actions">
          <button
            className="btn btn-success"
            onClick={saveParameters}
            disabled={saving}
          >
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>📋 Configuration des paramètres</h3>
        <div className="parameters-list">
          {parameters.map((param, index) => (
            <div key={param._id} className="parameter-item">
              <div className="parameter-info">
                <span className="parameter-number">{index + 1}.</span>
                <input
                  type="text"
                  value={param.displayName}
                  onChange={(e) => handleParameterChange(index, 'displayName', e.target.value)}
                  className="parameter-name-input"
                  placeholder={`Paramètre ${index + 1}`}
                />
              </div>
              <div className="parameter-value">
                <input
                  type="number"
                  value={param.kmValue}
                  onChange={(e) => handleParameterChange(index, 'kmValue', e.target.value)}
                  className="parameter-km-input"
                  min="0"
                  step="0.1"
                  placeholder="0"
                />
                <span className="km-unit">km</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Parameters;

