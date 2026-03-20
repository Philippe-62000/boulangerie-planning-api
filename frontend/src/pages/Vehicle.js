import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Vehicle.css';

const Vehicle = () => {
  const site = window.location.pathname.startsWith('/lon') ? 'longuenesse' : 'arras';

  const now = new Date();
  const [yearMonth, setYearMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1
  });

  const [stats, setStats] = useState(null);
  const [trips, setTrips] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [sRes, tRes, cRes] = await Promise.all([
        api.get('/vehicle/stats', { params: { site } }),
        api.get('/vehicle/trips', {
          params: { site, limit: 500, year: yearMonth.year, month: yearMonth.month }
        }),
        api.get('/vehicle/config', { params: { site } })
      ]);
      setStats(sRes.data?.data || null);
      setTrips(tRes.data?.data || []);
      setConfig(cRes.data?.data || null);
    } catch (e) {
      console.error(e);
      toast.error('Erreur chargement véhicule');
    } finally {
      setLoading(false);
    }
  }, [site, yearMonth]);

  useEffect(() => {
    load();
  }, [load]);

  const saveConfig = async () => {
    if (!config) return;
    try {
      await api.put(
        '/vehicle/config',
        {
          controleTechniqueDate: config.controleTechniqueDate || null,
          dateRenouvellement: config.dateRenouvellement || null,
          prochaineRevisionKm: config.prochaineRevisionKm,
          prochaineRevisionDate: config.prochaineRevisionDate || null,
          rappelKmAvantRevision: config.rappelKmAvantRevision,
          rappelJoursAvantRevision: config.rappelJoursAvantRevision,
          rappelJoursAvantCT: config.rappelJoursAvantCT,
          rappelJoursAvantRenouvellement: config.rappelJoursAvantRenouvellement
        },
        { params: { site } }
      );
      toast.success('Paramètres véhicule enregistrés');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur sauvegarde');
    }
  };

  const updateTripAdmin = async (tripId, body) => {
    try {
      await api.put(`/vehicle/trips/${tripId}`, body, { params: { site } });
      toast.success('Enregistré');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    }
  };

  const dismissProblem = (tripId) => {
    updateTripAdmin(tripId, { problemesIgnores: true });
  };

  const toggleFait = (trip, field) => {
    const next = !trip[field];
    updateTripAdmin(trip._id, { [field]: next });
  };

  const openPhoto = async (tripId) => {
    try {
      const r = await api.get(`/vehicle/trips/${tripId}/photo-retour/download`, {
        params: { site },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(r.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (e) {
      toast.error("Impossible d'ouvrir la photo");
    }
  };

  const openStandalone = () => {
    const base = window.location.pathname.startsWith('/lon') ? '/lon' : '/plan';
    window.open(`${window.location.origin}${base}/vehicle-standalone.html`, '_blank');
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleString('fr-FR') : '—');
  const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

  const monthValue = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`;

  if (loading && !config) {
    return (
      <div className="vehicle-page">
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="vehicle-page">
      <h1>🚗 Véhicule</h1>
      <p style={{ color: '#555', marginBottom: '1rem' }}>
        Suivi des trajets, pleins, problèmes et échéances (CT, révision, renouvellement).
      </p>

      <a href="#standalone" className="vehicle-link-standalone" onClick={(e) => { e.preventDefault(); openStandalone(); }}>
        Ouvrir la page salariés (mobile)
      </a>

      {stats?.warnings?.length > 0 && (
        <div className="vehicle-banner" role="alert">
          <strong>⚠️ Rappels</strong>
          <ul>
            {stats.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="vehicle-stats">
        <div className="vehicle-stat-card">
          <span>Km parcourus (total)</span>
          <strong>{stats?.totalKm != null ? `${Math.round(stats.totalKm)} km` : '—'}</strong>
        </div>
        <div className="vehicle-stat-card">
          <span>Trajets terminés</span>
          <strong>{stats?.tripCount ?? '—'}</strong>
        </div>
        <div className="vehicle-stat-card">
          <span>Dernier km connu</span>
          <strong>{stats?.lastOdometer != null ? `${stats.lastOdometer} km` : '—'}</strong>
        </div>
        <div className="vehicle-stat-card">
          <span>Km moyen entre pleins</span>
          <strong>
            {stats?.avgKmBetweenPleins != null ? `${stats.avgKmBetweenPleins} km` : '—'}
          </strong>
        </div>
      </div>

      {stats?.pleinByEmployee && Object.keys(stats.pleinByEmployee).length > 0 && (
        <div className="vehicle-section">
          <h2>Pleins enregistrés par personne</h2>
          <ul>
            {Object.entries(stats.pleinByEmployee).map(([name, n]) => (
              <li key={name}>
                <strong>{name}</strong> : {n} plein(s)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="vehicle-section">
        <h2>Échéances & révision (paramètres)</h2>
        {config && (
          <div className="vehicle-config-grid">
            <label>
              Date contrôle technique
              <input
                type="date"
                value={
                  config.controleTechniqueDate
                    ? new Date(config.controleTechniqueDate).toISOString().slice(0, 10)
                    : ''
                }
                onChange={(e) =>
                  setConfig({
                    ...config,
                    controleTechniqueDate: e.target.value ? new Date(e.target.value).toISOString() : null
                  })
                }
              />
            </label>
            <label>
              Date renouvellement (assurance / doc.)
              <input
                type="date"
                value={
                  config.dateRenouvellement
                    ? new Date(config.dateRenouvellement).toISOString().slice(0, 10)
                    : ''
                }
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dateRenouvellement: e.target.value ? new Date(e.target.value).toISOString() : null
                  })
                }
              />
            </label>
            <label>
              Prochaine révision (date)
              <input
                type="date"
                value={
                  config.prochaineRevisionDate
                    ? new Date(config.prochaineRevisionDate).toISOString().slice(0, 10)
                    : ''
                }
                onChange={(e) =>
                  setConfig({
                    ...config,
                    prochaineRevisionDate: e.target.value ? new Date(e.target.value).toISOString() : null
                  })
                }
              />
            </label>
            <label>
              Prochaine révision (km)
              <input
                type="number"
                min={0}
                placeholder="ex. 150000"
                value={config.prochaineRevisionKm ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    prochaineRevisionKm: e.target.value === '' ? null : Number(e.target.value)
                  })
                }
              />
            </label>
            <label>
              Rappel km avant révision
              <input
                type="number"
                min={1}
                value={config.rappelKmAvantRevision ?? 500}
                onChange={(e) =>
                  setConfig({ ...config, rappelKmAvantRevision: Number(e.target.value) || 500 })
                }
              />
            </label>
            <label>
              Rappel jours (révision / CT / renouv.)
              <input
                type="number"
                min={1}
                value={config.rappelJoursAvantRevision ?? 30}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rappelJoursAvantRevision: Number(e.target.value) || 30,
                    rappelJoursAvantCT: Number(e.target.value) || 30,
                    rappelJoursAvantRenouvellement: Number(e.target.value) || 30
                  })
                }
              />
            </label>
          </div>
        )}
        <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={saveConfig}>
          Enregistrer les paramètres
        </button>
      </div>

      {stats?.problemTrips?.length > 0 && (
        <div className="vehicle-section">
          <h2>Périodes avec problèmes signalés (récent)</h2>
          <div className="vehicle-table-wrap">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Date retour</th>
                  <th>Conducteur</th>
                  <th>Problème</th>
                  <th>Remarque</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.problemTrips.map((t) => (
                  <tr key={t._id}>
                    <td>{fmtDate(t.dateRetour)}</td>
                    <td>{t.driverId?.name || '—'}</td>
                    <td className="vehicle-problem">
                      {[t.problemeVoyantMoteur && 'Voyant moteur', t.problemeAutre && 'Autre']
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </td>
                    <td>{t.problemeRemarque || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="vehicle-btn-dismiss"
                        onClick={() => dismissProblem(t._id)}
                        title="Masquer cette ligne de la liste"
                      >
                        Effacer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="vehicle-section">
        <div className="vehicle-history-header">
          <h2>Historique des trajets</h2>
          <label className="vehicle-month-picker">
            <span>Mois affiché</span>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                const [y, m] = v.split('-').map(Number);
                setYearMonth({ year: y, month: m });
              }}
            />
          </label>
        </div>
        <p className="vehicle-hint">
          La ligne est surlignée en rouge si l’écart entre le km retour du trajet précédent (chronologie) et le km
          départ du suivant est ≥ 2 km.
        </p>
        <div className="vehicle-table-wrap">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>Départ</th>
                <th>Conducteur</th>
                <th>Km dép. / ret.</th>
                <th>Distance</th>
                <th>Destination</th>
                <th>États</th>
                <th>Plein</th>
                <th>À faire</th>
                <th>Fait</th>
                <th>Photo</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: '#888' }}>
                    Aucun trajet pour ce mois
                  </td>
                </tr>
              )}
              {trips.map((t) => {
                const dist =
                  t.status === 'termine' && t.kmRetour != null && t.kmDepart != null
                    ? t.kmRetour - t.kmDepart
                    : null;
                return (
                  <tr key={t._id} className={t.kmGapWarn ? 'vehicle-row-km-warn' : ''}>
                    <td>{fmtDay(t.dateDepart)}</td>
                    <td>{t.driverId?.name || '—'}</td>
                    <td>
                      {t.kmDepart} → {t.kmRetour != null ? t.kmRetour : '…'}
                    </td>
                    <td>{dist != null ? `${dist} km` : '—'}</td>
                    <td>{t.destination || (t.status === 'en_cours' ? 'En cours' : '—')}</td>
                    <td>
                      {t.status === 'termine' ? (
                        <>
                          int. {t.etatInterieur}/5 ext. {t.etatExterieur}/5
                        </>
                      ) : (
                        <span className="vehicle-badge">En cours</span>
                      )}
                    </td>
                    <td>
                      {t.pleinEffectue ? (
                        <>
                          Oui ({fmtDay(t.pleinDate)} — {t.pleinParEmployeeId?.name || '?'})
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {[t.todoLaveGlace && 'Lave-glace', t.todoPneu && 'Pneu', t.todoRevision && 'Révision', t.todoPlein && 'Plein']
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </td>
                    <td className="vehicle-fait-cells">
                      {t.status !== 'termine' ? (
                        '—'
                      ) : (
                        <div className="vehicle-fait-grid">
                          {t.todoLaveGlace && (
                            <label title="Lave-glace">
                              <input
                                type="checkbox"
                                checked={!!t.todoLaveGlaceFait}
                                onChange={() => toggleFait(t, 'todoLaveGlaceFait')}
                              />{' '}
                              L
                            </label>
                          )}
                          {t.todoPneu && (
                            <label title="Pneu">
                              <input
                                type="checkbox"
                                checked={!!t.todoPneuFait}
                                onChange={() => toggleFait(t, 'todoPneuFait')}
                              />{' '}
                              P
                            </label>
                          )}
                          {t.todoRevision && (
                            <label title="Révision">
                              <input
                                type="checkbox"
                                checked={!!t.todoRevisionFait}
                                onChange={() => toggleFait(t, 'todoRevisionFait')}
                              />{' '}
                              R
                            </label>
                          )}
                          {t.todoPlein && (
                            <label title="Plein à faire">
                              <input
                                type="checkbox"
                                checked={!!t.todoPleinFait}
                                onChange={() => toggleFait(t, 'todoPleinFait')}
                              />{' '}
                              Pl
                            </label>
                          )}
                          {!t.todoLaveGlace && !t.todoPneu && !t.todoRevision && !t.todoPlein && '—'}
                        </div>
                      )}
                    </td>
                    <td>
                      {t.photoRetourPath ? (
                        <button type="button" className="vehicle-link-photo" onClick={() => openPhoto(t._id)}>
                          Voir
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vehicle;
