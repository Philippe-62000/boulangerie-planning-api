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
  const [nonEnregistre, setNonEnregistre] = useState(false);
  const [selectedDeplacementId, setSelectedDeplacementId] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [diversDetail, setDiversDetail] = useState('');
  const [diversKm, setDiversKm] = useState('');
  const [diversPresetId, setDiversPresetId] = useState('');
  const [comment, setComment] = useState('');
  const [displacementDate, setDisplacementDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (site) {
      setApiUrl(API_URLS[site] || baseApi);
      setSelectedDeplacementId('');
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
  const selectedDeplacement = nonEnregistre ? null : tripTypes.find(t => (t._id || '').toString() === (selectedDeplacementId || '').toString());
  const isSelectedDivers = selectedDeplacement?.name === 'divers';
  const isToDivers = toId && tripTypes.find(t => t._id === toId || t._id?.toString?.() === toId)?.name === 'divers';
  const isDivers = nonEnregistre ? isToDivers : isSelectedDivers;

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
    const toIdFinal = nonEnregistre ? toId : selectedDeplacementId;
    if (!site || !toIdFinal) {
      setMessage(nonEnregistre ? 'Sélectionnez le site et la destination (Pour)' : 'Sélectionnez le site et le déplacement');
      setMessageType('error');
      return;
    }
    if (isDivers && !diversDetail.trim()) {
      setMessage('Précisez le détail pour Divers');
      setMessageType('error');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const d = displacementDate ? new Date(displacementDate) : new Date();
      const token = getStoredToken();
      await axios.post(
        `${API_URLS[site] || apiUrl}/responsable-km/log-displacement`,
        {
          site,
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          day: d.getDate(),
          fromTripTypeId: nonEnregistre ? (fromId || undefined) : undefined,
          toTripTypeId: toIdFinal,
          diversDetail: isDivers ? diversDetail.trim() : '',
          diversKm: isDivers && diversKm !== '' ? parseFloat(diversKm) : undefined,
          comment: comment.trim() || undefined
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setMessage('Déplacement enregistré !');
      setMessageType('success');
      setSelectedDeplacementId('');
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
                <label>Date du déplacement</label>
                <input
                  type="date"
                  value={displacementDate}
                  onChange={e => setDisplacementDate(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group form-group-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={nonEnregistre}
                    onChange={e => {
                      setNonEnregistre(e.target.checked);
                      setSelectedDeplacementId('');
                      setFromId('');
                      setToId('');
                      setDiversDetail('');
                      setDiversKm('');
                      setDiversPresetId('');
                    }}
                  />
                  <span>Déplacement non enregistré</span>
                </label>
                <p className="checkbox-hint">Cochez pour saisir un déplacement De/Pour personnalisé</p>
              </div>

              {!nonEnregistre ? (
                <div className="form-group">
                  <label>Quel déplacement ?</label>
                  <select
                    value={selectedDeplacementId}
                    onChange={e => {
                      setSelectedDeplacementId(e.target.value);
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
                        {t.displayName} {t.km != null ? `(${t.km} km)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
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
                </>
              )}

              {isDivers && (
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
