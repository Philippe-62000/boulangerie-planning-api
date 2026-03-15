import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl, getStoredToken } from '../config/apiConfig';
import './DeplacementStandalone.css';

const API_URLS = {
  longuenesse: 'https://boulangerie-planning-api-3.onrender.com/api',
  arras: 'https://boulangerie-planning-api-4-pbfy.onrender.com/api'
};

const DeplacementStandalone = () => {
  const baseApi = getApiUrl();
  const [site, setSite] = useState('');
  const [apiUrl, setApiUrl] = useState(baseApi);
  const [tripTypes, setTripTypes] = useState([]);
  const [diversPresets, setDiversPresets] = useState([]);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [diversDetail, setDiversDetail] = useState('');
  const [diversKm, setDiversKm] = useState('');
  const [diversPresetId, setDiversPresetId] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (site) {
      setApiUrl(API_URLS[site] || baseApi);
      setFromId('');
      setToId('');
      setDiversDetail('');
      setDiversKm('');
      setDiversPresetId('');
    }
  }, [site, baseApi]);

  useEffect(() => {
    if (!site) return;
    const fetch = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [typesRes, presetsRes] = await Promise.all([
          axios.get(`${API_URLS[site] || apiUrl}/responsable-km/trip-types?site=${site}`),
          axios.get(`${API_URLS[site] || apiUrl}/responsable-km/divers-presets?site=${site}`)
        ]);
        setTripTypes(typesRes.data?.data || []);
        setDiversPresets(presetsRes.data?.data || []);
      } catch (e) {
        setMessage('Erreur chargement des données');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [site]);

  const toOptions = tripTypes.filter(t => !t.isToll);
  const isToDivers = toId && tripTypes.find(t => t._id === toId || t._id?.toString?.() === toId)?.name === 'divers';

  const handleDiversPresetChange = (presetId) => {
    setDiversPresetId(presetId);
    const p = diversPresets.find(x => (x._id || '').toString() === (presetId || '').toString());
    if (p) {
      setDiversDetail(p.name);
      setDiversKm(p.km !== undefined && p.km !== null ? String(p.km) : '');
    } else {
      setDiversDetail('');
      setDiversKm('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!site || !toId) {
      setMessage('Sélectionnez le site et la destination (Pour)');
      setMessageType('error');
      return;
    }
    if (isToDivers && !diversDetail.trim()) {
      setMessage('Précisez le détail pour Divers');
      setMessageType('error');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const now = new Date();
      const token = getStoredToken();
      const res = await axios.post(
        `${API_URLS[site] || apiUrl}/responsable-km/log-displacement`,
        {
          site,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          day: now.getDate(),
          fromTripTypeId: fromId || undefined,
          toTripTypeId: toId,
          diversDetail: isToDivers ? diversDetail.trim() : '',
          diversKm: isToDivers && diversKm !== '' ? parseFloat(diversKm) : undefined,
          comment: comment.trim() || undefined
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setMessage('Déplacement enregistré !');
      setMessageType('success');
      setFromId('');
      setToId('');
      setDiversDetail('');
      setDiversKm('');
      setDiversPresetId('');
      setComment('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Erreur enregistrement');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="deplacement-standalone">
      <div className="deplacement-container">
        <div className="deplacement-header">
          <h1>🚗 Déplacement KM</h1>
          <p>Enregistrez vos déplacements au fur et à mesure</p>
        </div>

        <form onSubmit={handleSubmit} className="deplacement-form">
          <div className="form-group">
            <label>Site</label>
            <select
              value={site}
              onChange={e => setSite(e.target.value)}
              required
              className="form-control"
            >
              <option value="">– Choisir –</option>
              <option value="longuenesse">Orcinus (Longuenesse)</option>
              <option value="arras">Vulpinus (Arras)</option>
            </select>
          </div>

          {loading && <p className="loading-msg">Chargement...</p>}

          {site && !loading && (
            <>
              <div className="form-group">
                <label>De (où partez-vous ?)</label>
                <select
                  value={fromId}
                  onChange={e => setFromId(e.target.value)}
                  className="form-control"
                >
                  <option value="">– Choisir –</option>
                  {toOptions.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Pour (où allez-vous ?)</label>
                <select
                  value={toId}
                  onChange={e => {
                    setToId(e.target.value);
                    setDiversPresetId('');
                    setDiversDetail('');
                    setDiversKm('');
                  }}
                  required
                  className="form-control"
                >
                  <option value="">– Choisir –</option>
                  {toOptions.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {isToDivers && (
                <>
                  <div className="form-group">
                    <label>Divers existant ou nouveau</label>
                    <select
                      value={diversPresetId}
                      onChange={e => handleDiversPresetChange(e.target.value)}
                      className="form-control"
                    >
                      <option value="">– Nouveau –</option>
                      {diversPresets.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.km != null ? `(${p.km} km)` : '(km à définir)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Détail / Précision</label>
                    <input
                      type="text"
                      value={diversDetail}
                      onChange={e => setDiversDetail(e.target.value)}
                      placeholder="Ex: livraison client X, formation..."
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Km</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={diversKm}
                      onChange={e => setDiversKm(e.target.value)}
                      placeholder="À définir si inconnu"
                      className="form-control"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Détail (commentaire)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Précisions sur le déplacement..."
                  rows={2}
                  className="form-control"
                />
              </div>

              <button type="submit" className="btn-submit" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer le déplacement'}
              </button>
            </>
          )}
        </form>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeplacementStandalone;
