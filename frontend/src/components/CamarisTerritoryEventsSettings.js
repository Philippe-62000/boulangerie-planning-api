import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

const SCOPES = [
  { v: 'audomarois', l: 'Audomarois / Saint-Omer' },
  { v: 'pas-de-calais', l: 'Pas-de-Calais' },
  { v: 'france', l: 'France' },
  { v: 'local', l: 'Local' }
];

const emptyEvent = () => ({
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  year: '',
  scope: 'audomarois',
  title: '',
  text: ''
});

const CamarisTerritoryEventsSettings = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyEvent());
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/camaris/admin/territory-events');
      setEvents(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      setMessage({ type: 'error', text: 'Impossible de charger les événements locaux.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        year: form.year === '' ? null : Number(form.year)
      };
      if (editId) {
        await api.put(`/camaris/admin/territory-events/${editId}`, payload);
        setMessage({ type: 'success', text: 'Événement mis à jour.' });
      } else {
        await api.post('/camaris/admin/territory-events', payload);
        setMessage({ type: 'success', text: 'Événement créé.' });
      }
      setForm(emptyEvent());
      setEditId(null);
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Erreur enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    await api.delete(`/camaris/admin/territory-events/${id}`);
    await load();
  };

  return (
    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px dashed #ccc' }}>
      <h4 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>📍 Événements locaux (bandeau page Camaris)</h4>
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem' }}>
        Affichés à la place du « Le savez-vous ? » le jour correspondant (priorité : Audomarois → Pas-de-Calais →
        France). Laissez l&apos;année vide pour répéter chaque année.
      </p>
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '0.4rem' }}>Date</th>
              <th style={{ padding: '0.4rem' }}>Périmètre</th>
              <th style={{ padding: '0.4rem' }}>Titre</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '0.5rem', color: '#888' }}>
                  Aucun événement personnalisé (fichier JSON par défaut utilisé).
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.4rem' }}>
                    {String(ev.day).padStart(2, '0')}/{String(ev.month).padStart(2, '0')}
                    {ev.year ? `/${ev.year}` : ' (chaque année)'}
                  </td>
                  <td style={{ padding: '0.4rem' }}>{ev.scope}</td>
                  <td style={{ padding: '0.4rem' }}>{ev.title}</td>
                  <td style={{ padding: '0.4rem' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                      setEditId(ev.id);
                      setForm({
                        month: ev.month,
                        day: ev.day,
                        year: ev.year || '',
                        scope: ev.scope,
                        title: ev.title,
                        text: ev.text
                      });
                    }}>
                      Modifier
                    </button>{' '}
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(ev.id)}>
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
        <label>
          Mois
          <input
            type="number"
            min={1}
            max={12}
            className="password-input"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
          />
        </label>
        <label>
          Jour
          <input
            type="number"
            min={1}
            max={31}
            className="password-input"
            value={form.day}
            onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
          />
        </label>
        <label>
          Année (opt.)
          <input
            type="number"
            className="password-input"
            placeholder="Toutes"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </label>
        <label>
          Périmètre
          <select
            className="password-input"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
          >
            {SCOPES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label style={{ display: 'block', marginTop: '0.5rem' }}>
        Titre
        <input
          className="password-input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </label>
      <label style={{ display: 'block', marginTop: '0.5rem' }}>
        Texte
        <textarea
          className="password-input"
          rows={3}
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
        />
      </label>
      <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={save} disabled={saving}>
        {editId ? 'Mettre à jour' : 'Ajouter l’événement'}
      </button>
      {message ? (
        <p style={{ marginTop: '0.5rem', color: message.type === 'error' ? '#c00' : '#2d6a4f' }}>{message.text}</p>
      ) : null}
    </div>
  );
};

export default CamarisTerritoryEventsSettings;
