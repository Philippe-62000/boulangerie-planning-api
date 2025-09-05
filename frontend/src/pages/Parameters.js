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
      await api.put('/parameters/batch', {
        parameters: parameters.map(param => ({
          _id: param._id,
          displayName: param.displayName,
          kmValue: parseFloat(param.kmValue) || 0
        }))
      });
      
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
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
        <div className="parameters-info">
          <p>Configurez les paramètres pour le calcul des frais kilométriques.</p>
          <p><strong>Ligne 1 :</strong> Numéros des paramètres (1 à 12)</p>
          <p><strong>Ligne 2 :</strong> Intitulé affiché (nom du trajet)</p>
          <p><strong>Ligne 3 :</strong> Valeur en kilomètres</p>
        </div>
        
        <div className="table-container">
          <table className="parameters-table">
            <thead>
              <tr>
                <th className="row-header">Paramètre</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i + 1} className="param-header">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Ligne 1: Numéros des paramètres */}
              <tr className="param-numbers-row">
                <td className="row-label">Numéro</td>
                {Array.from({ length: 12 }, (_, i) => (
                  <td key={i + 1} className="param-number">
                    {i + 1}
                  </td>
                ))}
              </tr>
              
              {/* Ligne 2: Intitulés */}
              <tr className="param-display-row">
                <td className="row-label">Intitulé</td>
                {parameters.map((param, index) => (
                  <td key={param._id} className="param-display">
                    <input
                      type="text"
                      value={param.displayName}
                      onChange={(e) => handleParameterChange(index, 'displayName', e.target.value)}
                      className="param-input"
                      placeholder={`Paramètre ${index + 1}`}
                    />
                  </td>
                ))}
              </tr>
              
              {/* Ligne 3: Valeurs KM */}
              <tr className="param-values-row">
                <td className="row-label">KM</td>
                {parameters.map((param, index) => (
                  <td key={param._id} className="param-value">
                    <input
                      type="number"
                      value={param.kmValue}
                      onChange={(e) => handleParameterChange(index, 'kmValue', e.target.value)}
                      className="param-input"
                      min="0"
                      step="0.1"
                      placeholder="0"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>📋 Aperçu des paramètres</h3>
        <div className="parameters-preview">
          {parameters.map((param, index) => (
            <div key={param._id} className="param-preview">
              <strong>{index + 1}.</strong> {param.displayName} - {param.kmValue} km
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Parameters;

