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

  useEffect(() => {
    load();
  }, [load]);

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
        <button type="button" className="ccd-refresh" onClick={load} disabled={loading}>
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
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
                <th>TPE</th>
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
                  <td data-label="TPE">{row.tpeAuthNumber || '—'}</td>
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
    </div>
  );
};

export default CompteClientDepots;
