import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';
import './VehicleStandalone.css';

const API_URLS = {
  longuenesse: 'https://boulangerie-planning-api-3.onrender.com/api',
  arras: 'https://boulangerie-planning-api-4-pbfy.onrender.com/api'
};

const VehicleStandalone = () => {
  const baseApi = getApiUrl();
  const [site, setSite] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);

  const [driverId, setDriverId] = useState('');
  const [kmDepart, setKmDepart] = useState('');
  const [ei, setEi] = useState(3);
  const [ee, setEe] = useState(3);
  const [remDep, setRemDep] = useState('');

  const [activeTrip, setActiveTrip] = useState(null);

  const [destination, setDestination] = useState('');
  const [kmRetour, setKmRetour] = useState('');
  const [pv, setPv] = useState(false);
  const [pa, setPa] = useState(false);
  const [probRem, setProbRem] = useState('');
  const [tdLav, setTdLav] = useState(false);
  const [tdPneu, setTdPneu] = useState(false);
  const [tdRev, setTdRev] = useState(false);
  const [tdPl, setTdPl] = useState(false);
  const [pleinEffectue, setPleinEffectue] = useState(false);
  const [pleinParId, setPleinParId] = useState('');

  const api = () => API_URLS[site] || baseApi;

  useEffect(() => {
    if (!site) return;
    (async () => {
      setLoading(true);
      setMsg('');
      try {
        const r = await axios.get(`${api()}/vehicle/drivers`, { params: { site } });
        setDrivers(r.data?.data || []);
        setDriverId('');
        setPleinParId('');
      } catch (e) {
        setMsg(e.response?.data?.error || 'Erreur chargement conducteurs');
        setMsgOk(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [site]);

  const startTrip = async (e) => {
    e.preventDefault();
    if (!site || !driverId || kmDepart === '') {
      setMsg('Site, conducteur et km départ requis');
      setMsgOk(false);
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const r = await axios.post(
        `${api()}/vehicle/trips`,
        {
          site,
          driverId,
          kmDepart: Number(String(kmDepart).replace(',', '.')),
          etatInterieur: ei,
          etatExterieur: ee,
          remarquesDepart: remDep
        }
      );
      const trip = r.data?.data;
      setActiveTrip(trip);
      setKmRetour('');
      setDestination('');
      setPv(false);
      setPa(false);
      setProbRem('');
      setTdLav(false);
      setTdPneu(false);
      setTdRev(false);
      setTdPl(false);
      setPleinEffectue(false);
      setPleinParId(driverId);
      setMsg('Départ enregistré — complétez le retour ci-dessous.');
      setMsgOk(true);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erreur');
      setMsgOk(false);
    } finally {
      setLoading(false);
    }
  };

  const completeReturn = async (e) => {
    e.preventDefault();
    if (!activeTrip?._id) return;
    if (!destination.trim()) {
      setMsg('Indiquez la destination');
      setMsgOk(false);
      return;
    }
    const kr = Number(String(kmRetour).replace(',', '.'));
    if (Number.isNaN(kr)) {
      setMsg('Km retour invalide');
      setMsgOk(false);
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      await axios.put(`${api()}/vehicle/trips/${activeTrip._id}/return`, {
        site,
        destination: destination.trim(),
        kmRetour: kr,
        problemeVoyantMoteur: pv,
        problemeAutre: pa,
        problemeRemarque: probRem,
        todoLaveGlace: tdLav,
        todoPneu: tdPneu,
        todoRevision: tdRev,
        todoPlein: tdPl,
        pleinEffectue,
        pleinParEmployeeId: pleinEffectue ? (pleinParId || driverId) : undefined
      });
      setMsg('Trajet terminé. Merci !');
      setMsgOk(true);
      setActiveTrip(null);
      setKmDepart('');
      setRemDep('');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erreur');
      setMsgOk(false);
    } finally {
      setLoading(false);
    }
  };

  const Rating = ({ value, onChange, label }) => (
    <div className="vs-field">
      <label>{label} (1 = mauvais, 5 = bon)</label>
      <div className="vs-rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={value === n ? 'active' : ''}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="vs-page">
      <h1>🚗 Véhicule</h1>
      <p style={{ color: '#555', fontSize: '0.95rem' }}>
        Enregistrement départ / retour (usage interne).
      </p>

      <div className="vs-site">
        <label>
          <strong>Site</strong>
          <select value={site} onChange={(e) => { setSite(e.target.value); setActiveTrip(null); }}>
            <option value="">— Choisir —</option>
            <option value="longuenesse">Longuenesse</option>
            <option value="arras">Arras</option>
          </select>
        </label>
      </div>

      {msg && (
        <div className={`vs-msg ${msgOk ? 'ok' : 'err'}`}>{msg}</div>
      )}

      {site && !loading && drivers.length === 0 && (
        <div className="vs-msg err">
          Aucun conducteur autorisé. Dans <strong>Gestion des employés</strong>, cochez « Autoriser à conduire le véhicule »
          sous le téléphone d’urgence.
        </div>
      )}

      {!site ? (
        <p>Sélectionnez le site pour continuer.</p>
      ) : loading && !drivers.length ? (
        <p>Chargement…</p>
      ) : (
        <>
          <div className="vs-card">
            <h2>Départ</h2>
            <form onSubmit={startTrip}>
              <div className="vs-field">
                <label>Conducteur</label>
                <select value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
                  <option value="">— Choisir —</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="vs-field">
                <label>Km départ (compteur)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={kmDepart}
                  onChange={(e) => setKmDepart(e.target.value)}
                  required
                />
              </div>
              <Rating label="État intérieur" value={ei} onChange={setEi} />
              <Rating label="État extérieur" value={ee} onChange={setEe} />
              <div className="vs-field">
                <label>Remarques (optionnel)</label>
                <textarea rows={2} value={remDep} onChange={(e) => setRemDep(e.target.value)} />
              </div>
              <button type="submit" className="vs-btn vs-btn-primary" disabled={loading || !!activeTrip}>
                {activeTrip ? 'Départ déjà enregistré' : 'Enregistrer le départ'}
              </button>
            </form>
          </div>

          {activeTrip && (
            <div className="vs-card">
              <h2>Retour</h2>
              <form onSubmit={completeReturn}>
                <div className="vs-field">
                  <label>Destination</label>
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
                <div className="vs-field">
                  <label>Km retour (compteur)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={kmRetour}
                    onChange={(e) => setKmRetour(e.target.value)}
                    required
                  />
                </div>

                <p style={{ fontWeight: 600, margin: '0.75rem 0 0.35rem' }}>Problème</p>
                <div className="vs-toggle-row">
                  <button
                    type="button"
                    className={`vs-toggle ${pv ? 'on' : ''}`}
                    onClick={() => setPv(!pv)}
                  >
                    Voyant moteur
                  </button>
                  <button
                    type="button"
                    className={`vs-toggle ${pa ? 'on' : ''}`}
                    onClick={() => setPa(!pa)}
                  >
                    Autre
                  </button>
                </div>
                <div className="vs-field">
                  <label>Remarque problème</label>
                  <textarea rows={2} value={probRem} onChange={(e) => setProbRem(e.target.value)} />
                </div>

                <p style={{ fontWeight: 600, margin: '0.75rem 0 0.35rem' }}>À faire</p>
                <div className="vs-toggle-row">
                  <button type="button" className={`vs-toggle ${tdLav ? 'on' : ''}`} onClick={() => setTdLav(!tdLav)}>
                    Lave-glace
                  </button>
                  <button type="button" className={`vs-toggle ${tdPneu ? 'on' : ''}`} onClick={() => setTdPneu(!tdPneu)}>
                    Pneu
                  </button>
                  <button type="button" className={`vs-toggle ${tdRev ? 'on' : ''}`} onClick={() => setTdRev(!tdRev)}>
                    Révision
                  </button>
                  <button type="button" className={`vs-toggle ${tdPl ? 'on' : ''}`} onClick={() => setTdPl(!tdPl)}>
                    Plein (à faire)
                  </button>
                </div>

                <p style={{ fontWeight: 600, margin: '0.75rem 0 0.35rem' }}>Plein effectué</p>
                <div className="vs-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={pleinEffectue}
                      onChange={(e) => {
                        setPleinEffectue(e.target.checked);
                        if (e.target.checked && !pleinParId) setPleinParId(driverId);
                      }}
                    />{' '}
                    Plein effectué maintenant (enregistre la date et le km retour)
                  </label>
                </div>
                {pleinEffectue && (
                  <div className="vs-field">
                    <label>Enregistré par</label>
                    <select value={pleinParId} onChange={(e) => setPleinParId(e.target.value)}>
                      {drivers.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="vs-btn vs-btn-primary" disabled={loading}>
                  Terminer le trajet
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VehicleStandalone;
