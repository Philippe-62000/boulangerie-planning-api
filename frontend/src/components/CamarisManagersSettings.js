import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { getCamarisPublicPageUrl } from '../config/camarisPublicUrl';
import CamarisVisitStatsPanel from './CamarisVisitStatsPanel';

const emptyForm = () => ({ login: '', password: '', displayName: '' });

const CamarisManagersSettings = ({ embedded = false }) => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/camaris/admin/managers');
      setManagers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      setManagers([]);
      setMessage({ type: 'error', text: 'Impossible de charger les comptes manager Camaris.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setMessage(null);
    if (editId && form.password && form.password.trim().length > 0 && form.password.trim().length < 6) {
      setMessage({ type: 'error', text: 'Mot de passe : 6 caractères minimum.' });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const payload = {
          login: form.login.trim().toLowerCase(),
          displayName: form.displayName,
          isActive: true
        };
        if (form.password && form.password.trim().length >= 6) {
          payload.password = form.password.trim();
        }
        await api.put(`/camaris/admin/managers/${editId}`, payload);
        setMessage({ type: 'success', text: 'Compte manager mis à jour.' });
      } else {
        await api.post('/camaris/admin/managers', {
          login: form.login.trim().toLowerCase(),
          password: form.password.trim(),
          displayName: form.displayName
        });
        setMessage({ type: 'success', text: 'Compte manager créé.' });
      }
      setForm(emptyForm());
      setEditId(null);
      await load();
    } catch (e) {
      setMessage({
        type: 'error',
        text: e.response?.data?.error || 'Erreur enregistrement'
      });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditId(m.id);
    setForm({ login: m.login, password: '', displayName: m.displayName || '' });
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce compte manager ?')) return;
    try {
      await api.delete(`/camaris/admin/managers/${id}`);
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Erreur suppression' });
    }
  };

  const pageUrl = getCamarisPublicPageUrl();

  return (
    <div
      className="camaris-managers-settings"
      style={
        embedded
          ? undefined
          : { marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e0e0e0' }
      }
    >
      {!embedded ? (
        <h4 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>🥐 Page « Cette Semaine à Camaris »</h4>
      ) : null}
      <p style={{ marginBottom: '1rem', color: '#555', fontSize: '0.95rem' }}>
        Page publique clients :{' '}
        <a href={pageUrl} target="_blank" rel="noopener noreferrer">
          {pageUrl}
        </a>
      </p>

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Login</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nom affiché</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '0.75rem', color: '#888' }}>
                    Aucun compte manager — créez-en un ci-dessous.
                  </td>
                </tr>
              ) : (
                managers.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem' }}>{m.login}</td>
                    <td style={{ padding: '0.5rem' }}>{m.displayName}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(m)}>
                        Modifier
                      </button>{' '}
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="password-item">
            <label>
              <span className="password-icon">👤</span>
              {editId ? 'Modifier le compte' : 'Nouveau manager'}
            </label>
            <input
              type="text"
              className="password-input"
              placeholder="Login"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              style={{ marginBottom: '0.5rem' }}
            />
            <input
              type="text"
              className="password-input"
              placeholder="Nom affiché (optionnel)"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              style={{ marginBottom: '0.5rem' }}
            />
            <input
              type="password"
              className="password-input"
              placeholder={editId ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe (min. 6 car.)'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="password-actions" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {editId ? 'Mettre à jour' : 'Créer le compte'}
            </button>
            {editId ? (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginLeft: '0.5rem' }}
                onClick={() => {
                  setEditId(null);
                  setForm(emptyForm());
                }}
              >
                Annuler
              </button>
            ) : null}
          </div>
        </>
      )}
      {message ? (
        <p style={{ marginTop: '0.75rem', color: message.type === 'error' ? '#c00' : '#2d6a4f' }}>{message.text}</p>
      ) : null}

      <CamarisVisitStatsPanel />
    </div>
  );
};

export default CamarisManagersSettings;
