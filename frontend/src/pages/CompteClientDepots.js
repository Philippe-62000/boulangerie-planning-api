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
  const [remiseLoading, setRemiseLoading] = useState(false);
  const [remiseError, setRemiseError] = useState('');
  const [remiseSummary, setRemiseSummary] = useState(null);
  const [declaredTicketCount, setDeclaredTicketCount] = useState('');
  const [finishingRemise, setFinishingRemise] = useState(false);
  const [resumingRemise, setResumingRemise] = useState(false);

  const [clientsModalOpen, setClientsModalOpen] = useState(false);
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [deletingDepositId, setDeletingDepositId] = useState(null);

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

  const loadRemiseSummary = useCallback(async () => {
    setRemiseLoading(true);
    setRemiseError('');
    try {
      const { data } = await api.get('/account-deposit-remises/dashboard', { params: { site } });
      const s = data?.data || null;
      setRemiseSummary(s);
      const todayRemise = s?.todayRemise;
      if (todayRemise && typeof todayRemise.declaredTicketCount === 'number') {
        setDeclaredTicketCount(String(todayRemise.declaredTicketCount));
      }
    } catch (e) {
      setRemiseError(e.response?.data?.error || 'Impossible de charger la remise');
      setRemiseSummary(null);
    } finally {
      setRemiseLoading(false);
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
    loadRemiseSummary();
  }, [loadRemiseSummary]);

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

  const createPreset = async (e) => {
    e.preventDefault();
    const fn = newFirst.trim();
    const ln = newLast.trim();
    if (!fn || !ln) {
      alert('Prénom et nom requis');
      return;
    }
    setCreateBusy(true);
    try {
      await api.post('/account-client-presets', { site, firstName: fn, lastName: ln });
      setNewFirst('');
      setNewLast('');
      await loadPresets();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur à la création');
    } finally {
      setCreateBusy(false);
    }
  };

  const deleteDeposit = async (id) => {
    if (!window.confirm('Supprimer ce dépôt ? (erreur de saisie)')) return;
    setDeletingDepositId(id);
    try {
      await api.delete(`/account-deposits/${id}`);
      setItems((prev) => prev.filter((row) => row._id !== id));
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    } finally {
      setDeletingDepositId(null);
    }
  };

  const formatVendeur = (row) => {
    const name = row.createdByName || row.createdByEmail || '—';
    const code = row.registeredSaleCode;
    if (code) {
      return (
        <>
          {name}
          <span className="ccd-sale-code"> · {code}</span>
        </>
      );
    }
    return name;
  };

  const pending = items.filter((r) => !r.accountCredited || !r.putInRegister).length;

  const todayDepositsCount = remiseSummary?.todayDeposits?.depositsCount ?? 0;
  const todayDepositsTotal = remiseSummary?.todayDeposits?.depositsTotal ?? 0;
  const todayDepositsSnapshot = remiseSummary?.todayDeposits?.snapshot || [];
  const todayRemise = remiseSummary?.todayRemise || null;
  const remiseStatus = todayRemise?.status || 'draft';
  const isFinished = remiseStatus === 'finished';

  const normalizedTickets = declaredTicketCount === '' ? null : Math.max(0, Math.floor(Number(declaredTicketCount)));
  const mismatch =
    normalizedTickets != null && Number.isFinite(normalizedTickets) ? normalizedTickets !== (isFinished ? todayRemise?.depositsCount : todayDepositsCount) : false;

  const saveDraftTicketCount = async () => {
    try {
      await api.put('/account-deposit-remises/today/draft', {
        site,
        declaredTicketCount: declaredTicketCount === '' ? null : Number(declaredTicketCount)
      });
      await loadRemiseSummary();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur enregistrement');
    }
  };

  const finishRemise = async () => {
    if (!window.confirm('Terminer la remise du jour ? Cela fige la liste des dépôts et le total.')) return;
    setFinishingRemise(true);
    try {
      await api.post('/account-deposit-remises/today/finish', {
        site,
        declaredTicketCount: declaredTicketCount === '' ? null : Number(declaredTicketCount)
      });
      await loadRemiseSummary();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    } finally {
      setFinishingRemise(false);
    }
  };

  const resumeRemise = async () => {
    if (!window.confirm('Reprendre la remise du jour ? (si un dépôt manque ou erreur de validation)')) return;
    setResumingRemise(true);
    try {
      await api.post('/account-deposit-remises/today/resume', { site });
      await loadRemiseSummary();
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    } finally {
      setResumingRemise(false);
    }
  };

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
          <button type="button" className="ccd-refresh" onClick={loadRemiseSummary} disabled={remiseLoading}>
            {remiseLoading ? 'Remise…' : 'Actualiser remise'}
          </button>
          <button type="button" className="ccd-refresh" onClick={load} disabled={loading}>
            {loading ? 'Chargement…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {error && <div className="ccd-error">{error}</div>}
      {remiseError && <div className="ccd-error">{remiseError}</div>}

      <div className="ccd-remise-card">
        <div className="ccd-remise-head">
          <h2>Remise du jour</h2>
          <span className={`ccd-remise-pill ${isFinished ? 'done' : 'draft'}`}>
            {isFinished ? 'Terminée' : 'En cours'}
          </span>
        </div>

        <div className="ccd-remise-grid">
          <div className="ccd-remise-metrics">
            <div className="ccd-remise-metric">
              <span>Personnes</span>
              <strong>{isFinished ? (todayRemise?.depositsCount ?? 0) : todayDepositsCount}</strong>
            </div>
            <div className="ccd-remise-metric">
              <span>Total</span>
              <strong>{Number(isFinished ? (todayRemise?.depositsTotal ?? 0) : todayDepositsTotal).toFixed(2)} €</strong>
            </div>
            <div className="ccd-remise-metric">
              <span>Tickets TPE</span>
              <strong>{todayRemise?.declaredTicketCount ?? (declaredTicketCount === '' ? '—' : declaredTicketCount)}</strong>
            </div>
          </div>

          <div className="ccd-remise-actions">
            <label className="ccd-remise-ticket">
              Nombre de tickets TPE (pour comparer)
              <input
                type="number"
                min={0}
                value={declaredTicketCount}
                onChange={(e) => setDeclaredTicketCount(e.target.value)}
                onBlur={saveDraftTicketCount}
                disabled={isFinished}
              />
            </label>
            {mismatch && (
              <div className="ccd-remise-warn">
                Attention : tickets ({normalizedTickets}) ≠ personnes ({isFinished ? todayRemise?.depositsCount : todayDepositsCount})
              </div>
            )}
            <div className="ccd-remise-buttons">
              {!isFinished ? (
                <button
                  type="button"
                  className="ccd-remise-finish"
                  disabled={finishingRemise || todayDepositsCount === 0}
                  onClick={finishRemise}
                >
                  {finishingRemise ? '…' : 'Terminer la remise du jour'}
                </button>
              ) : (
                <button type="button" className="ccd-remise-resume" disabled={resumingRemise} onClick={resumeRemise}>
                  {resumingRemise ? '…' : 'Reprendre la remise (erreur)'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="ccd-remise-list">
          <p className="ccd-remise-list-title">Noms et montants</p>
          {(isFinished ? todayRemise?.depositsSnapshot : todayDepositsSnapshot).length === 0 ? (
            <p className="ccd-muted">Aucun dépôt aujourd’hui.</p>
          ) : (
            <ul>
              {(isFinished ? todayRemise?.depositsSnapshot : todayDepositsSnapshot).map((x) => (
                <li key={String(x.depositId || `${x.lastName}-${x.firstName}-${x.amount}`)}>
                  <strong>
                    {String(x.lastName || '').toUpperCase()} {x.firstName}
                  </strong>{' '}
                  — {Number(x.amount || 0).toFixed(2)} €
                </li>
              ))}
            </ul>
          )}
          {isFinished && todayRemise?.finishedAt && (
            <p className="ccd-mini">
              Terminée le {formatDate(todayRemise.finishedAt)} {todayRemise.finishedByName ? `par ${todayRemise.finishedByName}` : ''}
            </p>
          )}
        </div>
      </div>

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
                <th />
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
                  <td data-label="Vendeur·se">{formatVendeur(row)}</td>
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
                  <td data-label="">
                    <button
                      type="button"
                      className="ccd-row-delete"
                      disabled={deletingDepositId === row._id}
                      onClick={() => deleteDeposit(row._id)}
                    >
                      Supprimer
                    </button>
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
            <form className="ccd-create-preset" onSubmit={createPreset}>
              <span className="ccd-create-label">Nouveau client</span>
              <input
                className="ccd-preset-input"
                placeholder="Nom"
                value={newLast}
                onChange={(e) => setNewLast(e.target.value)}
              />
              <input
                className="ccd-preset-input"
                placeholder="Prénom"
                value={newFirst}
                onChange={(e) => setNewFirst(e.target.value)}
              />
              <button type="submit" className="ccd-create-btn" disabled={createBusy}>
                {createBusy ? '…' : 'Créer'}
              </button>
            </form>
            {presetsError && <div className="ccd-error">{presetsError}</div>}
            {presetsLoading ? (
              <p className="ccd-muted">Chargement…</p>
            ) : !presets.length ? (
              <p className="ccd-muted">Aucun autre client dans la liste — utilisez le formulaire ci-dessus pour en ajouter.</p>
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
