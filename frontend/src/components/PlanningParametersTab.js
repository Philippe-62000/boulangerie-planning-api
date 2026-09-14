import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import '../pages/StaffPlanning.css';

const CATEGORIES = [
  { value: 'repos', label: 'Repos' },
  { value: 'formation', label: 'Formation / CFA' },
  { value: 'cp', label: 'Congés payés' },
  { value: 'maladie', label: 'Maladie' },
  { value: 'absence', label: 'Absence' },
  { value: 'autre', label: 'Autre' }
];

const emptyWord = () => ({
  code: '',
  hours: 0,
  category: 'autre',
  countsInTotal: false,
  countsAsSick: false
});

const PlanningParametersTab = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/staff-planning/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger les paramètres planning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (name, value) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const updateWord = (index, patch) => {
    setSettings((prev) => {
      const words = [...(prev.words || [])];
      words[index] = { ...words[index], ...patch };
      if (patch.category === 'maladie') words[index].countsAsSick = true;
      return { ...prev, words };
    });
  };

  const addWord = () => {
    setSettings((prev) => ({ ...prev, words: [...(prev.words || []), emptyWord()] }));
  };

  const removeWord = (index) => {
    setSettings((prev) => ({
      ...prev,
      words: (prev.words || []).filter((_, i) => i !== index)
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await api.put('/staff-planning/settings', settings);
      setSettings(response.data.settings);
      toast.success('Paramètres planning enregistrés');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <p>Chargement des paramètres planning…</p>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Planning salariés</h3>
        <p>Règles utilisées par la grille hebdomadaire, l’impression et les compteurs du mois.</p>
      </div>
      <div className="card-body">
        <div className="sp-params-grid">
          <label>
            Ouverture le dimanche
            <select
              className="form-control"
              value={settings.sundayOpen ? 'yes' : 'no'}
              onChange={(e) => updateField('sundayOpen', e.target.value === 'yes')}
            >
              <option value="no">Non — Repos pour tout le monde</option>
              <option value="yes">Oui</option>
            </select>
          </label>
          <label>
            Pause non payée à partir de
            <input
              className="form-control"
              type="number"
              min="0"
              step="0.5"
              value={settings.breakThresholdHours}
              onChange={(e) => updateField('breakThresholdHours', Number(e.target.value))}
            />
            <small>heures d’amplitude (défaut 5h). Au-delà : −30 min.</small>
          </label>
          <label>
            Durée de la pause (min)
            <input
              className="form-control"
              type="number"
              min="0"
              value={settings.breakMinutes}
              onChange={(e) => updateField('breakMinutes', Number(e.target.value))}
            />
          </label>
          <label>
            Alerte journée à partir de
            <input
              className="form-control"
              type="number"
              min="1"
              step="0.5"
              value={settings.maxDayHours}
              onChange={(e) => updateField('maxDayHours', Number(e.target.value))}
            />
            <small>heures de travail (défaut 10h)</small>
          </label>
          <label>
            Repos mini entre deux jours
            <input
              className="form-control"
              type="number"
              min="0"
              step="0.5"
              value={settings.minRestHours}
              onChange={(e) => updateField('minRestHours', Number(e.target.value))}
            />
            <small>heures (défaut 11h)</small>
          </label>
          <label>
            Coupure max entre 2 créneaux
            <input
              className="form-control"
              type="number"
              min="0"
              step="0.5"
              value={settings.maxSplitGapHours}
              onChange={(e) => updateField('maxSplitGapHours', Number(e.target.value))}
            />
            <small>heures (défaut 3h)</small>
          </label>
          <label>
            Début heures de nuit
            <input
              className="form-control"
              type="time"
              value={settings.nightStart}
              onChange={(e) => updateField('nightStart', e.target.value)}
            />
          </label>
          <label>
            Fin heures de nuit
            <input
              className="form-control"
              type="time"
              value={settings.nightEnd}
              onChange={(e) => updateField('nightEnd', e.target.value)}
            />
          </label>
          <label>
            HS 25 % à partir de la
            <input
              className="form-control"
              type="number"
              min="1"
              value={settings.ot25FromHour}
              onChange={(e) => updateField('ot25FromHour', Number(e.target.value))}
            />
            <small>heure (36 = à partir de la 36e, pour tous les contrats)</small>
          </label>
          <label>
            HS 25 % jusqu’à la
            <input
              className="form-control"
              type="number"
              min="1"
              value={settings.ot25ToHour}
              onChange={(e) => updateField('ot25ToHour', Number(e.target.value))}
            />
            <small>heure (43)</small>
          </label>
          <label>
            Mot CFA par défaut
            <input
              className="form-control"
              value={settings.defaultCfaCode || 'CFA8'}
              onChange={(e) => updateField('defaultCfaCode', e.target.value.toUpperCase())}
            />
          </label>
        </div>

        <h4 style={{ marginTop: '1.5rem' }}>Mots-codes</h4>
        <p style={{ color: '#555' }}>
          Un mot peut compter dans le total de la semaine (ex. CFA8 = 8h). MAL ne compte pas dans le total
          et alimente le compteur maladie du mois. Les congés payés (CP) valent le volume du contrat divisé
          par 6 : une semaine complète = 6 jours de CP + 1 repos (0 h), soit 35 h ou 39 h selon le contrat.
          Les jours fériés officiels français sont cochés automatiquement à chaque nouvelle année
          (Pâques, 1er mai, 14 juillet, etc.). On peut toujours décocher un jour dans la grille : les heures
          travaillées un jour férié sont majorées.
        </p>
        <div className="table-container">
          <table className="sp-words-table">
            <thead>
              <tr>
                <th>Mot</th>
                <th>Heures</th>
                <th>Catégorie</th>
                <th>Dans le total semaine</th>
                <th>Compteur maladie</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(settings.words || []).map((word, index) => {
                if (String(word.code).toUpperCase() === 'FERIE' || word.category === 'ferie') return null;
                return (
                <tr key={`${word.code}-${index}`}>
                  <td>
                    <input
                      className="form-control"
                      value={word.code}
                      onChange={(e) => updateWord(index, { code: e.target.value.toUpperCase() })}
                    />
                  </td>
                  <td>
                    {String(word.code).toUpperCase() === 'CP' || word.category === 'cp' ? (
                      <span style={{ color: '#555', whiteSpace: 'nowrap' }}>contrat / 6</span>
                    ) : (
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        step="0.5"
                        value={word.hours}
                        onChange={(e) => updateWord(index, { hours: Number(e.target.value) })}
                      />
                    )}
                  </td>
                  <td>
                    <select
                      className="form-control"
                      value={word.category}
                      onChange={(e) => updateWord(index, { category: e.target.value })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!word.countsInTotal}
                      onChange={(e) => updateWord(index, { countsInTotal: e.target.checked })}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!word.countsAsSick}
                      onChange={(e) => updateWord(index, { countsAsSick: e.target.checked })}
                    />
                  </td>
                  <td>
                    <button type="button" className="btn btn-secondary" onClick={() => removeWord(index)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={addWord}>Ajouter un mot</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanningParametersTab;
