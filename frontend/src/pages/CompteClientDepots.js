import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './CompteClientDepots.css';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    const x = new Date(d);
    return x.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
};

const CompteClientDepots = () => {
  const site = typeof window !== 'undefined' && window.location.pathname.startsWith('/lon') ? 'longuenesse' : 'arras';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [clientsModalOpen, setClientsModalOpen] = useState(false);
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/account-deposits', { params: { site } });
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e.response?.data?.error || 'Impossible de charger les dépôts');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [site]);

  const loadPresets = useCallback(async () => {
    setPresetsLoading(true);
    setPresetsError('');
    try {
      const { data } = await api.get('/account-client-presets', { params: { site } });
      setPresets(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setPresetsError(e.response?.data?.error || 'Impossible de charger la liste');
      setPresets([]);
    } finally {
      setPresetsLoading(false);
    }
  }, [site]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (clientsModalOpen) {
      loadPresets();
    }
  }, [clientsModalOpen, loadPresets]);

  const patch = async (id, body) => {
    setUpdatingId(id);
    try {
      const { data } = await api.patch(`/account-deposits/${id}`, body);
      if (data?.data) {
        setItems((prev) => prev.map((row) => (row._id === id ? { ...row, ...data.data } : row)));
      } else {
        await load();
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setEditFirst(p.firstName);
    setEditLast(p.lastName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFirst('');
    setEditLast('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const fn = editFirst.trim();
    const ln = editLast.trim();
    if (!fn || !ln) {
      alert('Prénom et nom requis');
      return;
    }
    try {
      await api.patch(`/account-client-presets/${editingId}`, { firstName: fn, lastName: ln });
      cancelEdit();
      await loadPresets();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    }
  };

  const deletePreset = async (id) => {
    if (!window.confirm('Supprimer ce client de la liste ?')) return;
    try {
      await api.delete(`/account-client-presets/${id}`);
      await loadPresets();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    }
  };

  const pending = items.filter((r) => !r.accountCredited || !r.putInRegister).length;

  return (
    <div className="compte-client-depots-page">
      <div className="ccd-header">
        <h1>Dépôts compte client</h1>
        <p className="ccd-sub">
          Crédits saisis en déplacement (signature client). Cochez <strong>Compte crédité</strong> puis{' '}
          <strong>Mis en caisse</strong> lorsque c’est fait.
          {pending > 0 && <span className="ccd-badge">{pending} à traiter</span>}
        </p>
        <div className="ccd-header-actions">
          <button type="button" className="ccd-manage-clients" onClick={() => setClientsModalOpen(true)}>
            Gérer les clients
          </button>
          <button type="button" className="ccd-refresh" onClick={load} disabled={loading}>
            {loading ? 'Chargement…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {error && <div className="ccd-error">{error}</div>}

      {loading && !items.length ? (
        <p className="ccd-muted">Chargement…</p>
      ) : !items.length ? (
        <p className="ccd-muted">Aucun dépôt enregistré pour ce site.</p>
      ) : (
        <div className="ccd-table-wrap">
          <table className="ccd-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Vendeur·se</th>
                <th>Signature</th>
                <th>Crédité</th>
                <th>Caisse</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id} className={!row.accountCredited ? 'ccd-row-pending' : ''}>
                  <td data-label="Date">{formatDate(row.createdAt)}</td>
                  <td data-label="Client">
                    <strong>
                      {row.lastName} {row.firstName}
                    </strong>
                  </td>
                  <td data-label="Montant">{Number(row.amount).toFixed(2)} €</td>
                  <td data-label="Vendeur·se">{row.createdByName || row.createdByEmail || '—'}</td>
                  <td data-label="Signature" className="ccd-sig-cell">
                    {row.signatureImage ? (
                      <img src={row.signatureImage} alt="" className="ccd-sig-thumb" />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="Crédité">
                    <label className="ccd-check">
                      <input
                        type="checkbox"
                        checked={!!row.accountCredited}
                        disabled={updatingId === row._id}
                        onChange={(e) => patch(row._id, { accountCredited: e.target.checked })}
                      />
                    </label>
                    {row.accountCreditedAt && (
                      <span className="ccd-mini">{formatDate(row.accountCreditedAt)}</span>
                    )}
                  </td>
                  <td data-label="Caisse">
                    <label className="ccd-check">
                      <input
                        type="checkbox"
                        checked={!!row.putInRegister}
                        disabled={updatingId === row._id}
                        onChange={(e) => patch(row._id, { putInRegister: e.target.checked })}
                      />
                    </label>
                    {row.putInRegisterAt && <span className="ccd-mini">{formatDate(row.putInRegisterAt)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {clientsModalOpen && (
        <div className="ccd-modal-overlay" role="presentation" onClick={() => setClientsModalOpen(false)}>
          <div
            className="ccd-modal"
            role="dialog"
            aria-labelledby="ccd-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ccd-modal-head">
              <h2 id="ccd-modal-title">Clients enregistrés (liste rapide)</h2>
              <button type="button" className="ccd-modal-close" onClick={() => setClientsModalOpen(false)} aria-label="Fermer">
                ×
              </button>
            </div>
            <p className="ccd-modal-desc">
              Liste utilisée sur la page <strong>Crédit compte client</strong> (même site). Les vendeuses peuvent aussi
              ajouter des clients depuis le téléphone.
            </p>
            {presetsError && <div className="ccd-error">{presetsError}</div>}
            {presetsLoading ? (
              <p className="ccd-muted">Chargement…</p>
            ) : !presets.length ? (
              <p className="ccd-muted">Aucun client enregistré pour l’instant.</p>
            ) : (
              <div className="ccd-preset-table-wrap">
                <table className="ccd-preset-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {presets.map((p) => (
                      <tr key={p._id}>
                        <td>
                          {editingId === p._id ? (
                            <input
                              className="ccd-preset-input"
                              value={editLast}
                              onChange={(e) => setEditLast(e.target.value)}
                              placeholder="Nom"
                            />
                          ) : (
                            p.lastName
                          )}
                        </td>
                        <td>
                          {editingId === p._id ? (
                            <input
                              className="ccd-preset-input"
                              value={editFirst}
                              onChange={(e) => setEditFirst(e.target.value)}
                              placeholder="Prénom"
                            />
                          ) : (
                            p.firstName
                          )}
                        </td>
                        <td className="ccd-preset-actions">
                          {editingId === p._id ? (
                            <>
                              <button type="button" className="ccd-preset-save" onClick={saveEdit}>
                                Enregistrer
                              </button>
                              <button type="button" className="ccd-preset-cancel" onClick={cancelEdit}>
                                Annuler
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="ccd-preset-edit" onClick={() => startEdit(p)}>
                                Modifier
                              </button>
                              <button type="button" className="ccd-preset-del" onClick={() => deletePreset(p._id)}>
                                Supprimer
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompteClientDepots;
