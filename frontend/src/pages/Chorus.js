import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Chorus.css';

const STATUT_OPTIONS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'realisee', label: 'Réalisée' },
  { value: 'annulee', label: 'Annulée' }
];

const Chorus = () => {
  const site = window.location.pathname.startsWith('/lon') ? 'longuenesse' : 'arras';

  const [clients, setClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState({ nom: '', remarques: '' });

  const [newCmdDate, setNewCmdDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newCmdClientId, setNewCmdClientId] = useState('');
  const [newCmdStatut, setNewCmdStatut] = useState('en_cours');

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, cmdRes] = await Promise.all([
        api.get('/chorus/clients', { params: { site } }),
        api.get('/chorus/commandes', { params: { site } })
      ]);
      setClients(cRes.data?.data || []);
      setCommandes(cmdRes.data?.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Erreur chargement Chorus');
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openNewClient = () => {
    setEditingClient(null);
    setClientForm({ nom: '', remarques: '' });
    setShowClientModal(true);
  };

  const openEditClient = (c) => {
    setEditingClient(c);
    setClientForm({ nom: c.nom, remarques: c.remarques || '' });
    setShowClientModal(true);
  };

  const saveClient = async () => {
    if (!clientForm.nom.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    try {
      if (editingClient) {
        await api.put(`/chorus/clients/${editingClient._id}`, clientForm, { params: { site } });
        toast.success('Client modifié');
      } else {
        await api.post('/chorus/clients', clientForm, { params: { site } });
        toast.success('Client créé');
      }
      setShowClientModal(false);
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur enregistrement');
    }
  };

  const deleteClient = async (c) => {
    if (!window.confirm(`Supprimer le client « ${c.nom} » ?`)) return;
    try {
      await api.delete(`/chorus/clients/${c._id}`, { params: { site } });
      toast.success('Client supprimé');
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur suppression');
    }
  };

  const createCommande = async (e) => {
    e.preventDefault();
    if (!newCmdClientId) {
      toast.error('Choisissez un client');
      return;
    }
    try {
      await api.post(
        '/chorus/commandes',
        {
          dateCommande: newCmdDate,
          clientId: newCmdClientId,
          statut: newCmdStatut
        },
        { params: { site } }
      );
      toast.success('Commande créée');
      setNewCmdStatut('en_cours');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur création');
    }
  };

  const updateCommandeField = async (id, patch) => {
    try {
      await api.put(`/chorus/commandes/${id}`, patch, { params: { site } });
      setCommandes((prev) =>
        prev.map((row) => (row._id === id ? { ...row, ...patch } : row))
      );
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur mise à jour');
      loadAll();
    }
  };

  const uploadBon = async (commandeId, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/chorus/commandes/${commandeId}/bon-de-commande`, fd, {
        params: { site },
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Bon de commande enregistré sur le NAS');
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Erreur upload');
    }
  };

  const downloadBon = async (commandeId, fileName) => {
    try {
      const res = await api.get(`/chorus/commandes/${commandeId}/bon-de-commande/download`, {
        params: { site },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'bon-de-commande';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Téléchargement impossible');
    }
  };

  const deleteCommande = async (row) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    try {
      await api.delete(`/chorus/commandes/${row._id}`, { params: { site } });
      toast.success('Commande supprimée');
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const x = new Date(d);
    return x.toLocaleDateString('fr-FR');
  };

  if (loading && commandes.length === 0 && clients.length === 0) {
    return (
      <div className="chorus-page">
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="chorus-page">
      <div className="chorus-header">
        <h1>🎵 Chorus</h1>
        <p className="chorus-sub">
          Commandes et bons de commande — site : <strong>{site === 'longuenesse' ? 'Longuenesse' : 'Arras'}</strong>
        </p>
      </div>

      <div className="chorus-info-nas card-like">
        <h3>📁 Répertoire NAS (à créer manuellement)</h3>
        <p>
          Sous la racine documents du site (déjà <code>documents-longuenesse</code> pour Longuenesse), créez uniquement :
        </p>
        <p className="chorus-nas-example">
          <code>/n8n/uploads/documents-longuenesse/chorus/</code>
        </p>
        <p className="chorus-sub" style={{ marginTop: '0.5rem' }}>
          Pas de sous-dossier « longuenesse » : la racine NAS est déjà celle du site.
        </p>
      </div>

      <div className="chorus-toolbar">
        <button type="button" className="btn btn-primary" onClick={openNewClient}>
          + Client
        </button>
      </div>

      <section className="chorus-section card-like">
        <h2>Nouvelle commande</h2>
        <form className="chorus-form-new" onSubmit={createCommande}>
          <label>
            Date de la commande
            <input
              type="date"
              value={newCmdDate}
              onChange={(e) => setNewCmdDate(e.target.value)}
              required
            />
          </label>
          <label>
            Client
            <select
              value={newCmdClientId}
              onChange={(e) => setNewCmdClientId(e.target.value)}
              required
            >
              <option value="">— Choisir un client —</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>
          <label>
            Réalisé
            <select value={newCmdStatut} onChange={(e) => setNewCmdStatut(e.target.value)}>
              {STATUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-success">
            Créer la commande
          </button>
        </form>
      </section>

      <section className="chorus-section card-like">
        <h2>Liste des commandes</h2>
        <div className="chorus-table-wrap">
          <table className="chorus-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Réalisé</th>
                <th>Bon de commande</th>
                <th>Déposé sur Chorus</th>
                <th>Mis en caisse</th>
                <th>Paiement reçu</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {commandes.length === 0 && (
                <tr>
                  <td colSpan={8} className="chorus-empty">
                    Aucune commande
                  </td>
                </tr>
              )}
              {commandes.map((row) => {
                const client = row.clientId;
                const nomClient = client?.nom || '—';
                return (
                  <tr key={row._id}>
                    <td>{formatDate(row.dateCommande)}</td>
                    <td>
                      <div className="chorus-client-cell">{nomClient}</div>
                      {client?.remarques && (
                        <div className="chorus-remarques">{client.remarques}</div>
                      )}
                    </td>
                    <td>
                      <select
                        value={row.statut}
                        onChange={(e) =>
                          updateCommandeField(row._id, { statut: e.target.value })
                        }
                      >
                        {STATUT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="chorus-bon-cell">
                      <label className="chorus-upload-label">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) uploadBon(row._id, f);
                          }}
                        />
                        <span className="btn btn-sm btn-outline">Uploader</span>
                      </label>
                      {row.bonDeCommandeFilePath && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link"
                          onClick={() =>
                            downloadBon(row._id, row.bonDeCommandeFileName)
                          }
                        >
                          Télécharger
                        </button>
                      )}
                    </td>
                    <td className="chorus-check">
                      <input
                        type="checkbox"
                        checked={!!row.deposedChorus}
                        onChange={(e) =>
                          updateCommandeField(row._id, {
                            deposedChorus: e.target.checked
                          })
                        }
                      />
                    </td>
                    <td className="chorus-check">
                      <input
                        type="checkbox"
                        checked={!!row.misEnCaisse}
                        onChange={(e) =>
                          updateCommandeField(row._id, {
                            misEnCaisse: e.target.checked
                          })
                        }
                      />
                    </td>
                    <td className="chorus-check">
                      <input
                        type="checkbox"
                        checked={!!row.paiementRecu}
                        onChange={(e) =>
                          updateCommandeField(row._id, {
                            paiementRecu: e.target.checked
                          })
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteCommande(row)}
                      >
                        Suppr.
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="chorus-section card-like">
        <h2>Clients ({clients.length})</h2>
        <ul className="chorus-client-list">
          {clients.map((c) => (
            <li key={c._id}>
              <strong>{c.nom}</strong>
              {c.remarques ? <span className="chorus-rem"> — {c.remarques}</span> : null}
              <button type="button" className="btn btn-xs" onClick={() => openEditClient(c)}>
                Modifier
              </button>
              <button
                type="button"
                className="btn btn-xs btn-danger"
                onClick={() => deleteClient(c)}
              >
                Effacer
              </button>
            </li>
          ))}
        </ul>
      </section>

      {showClientModal && (
        <div className="chorus-modal-overlay" onClick={() => setShowClientModal(false)}>
          <div className="chorus-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingClient ? 'Modifier le client' : 'Nouveau client'}</h3>
            <label>
              Nom *
              <input
                value={clientForm.nom}
                onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
              />
            </label>
            <label>
              Remarques
              <textarea
                rows={3}
                value={clientForm.remarques}
                onChange={(e) => setClientForm({ ...clientForm, remarques: e.target.value })}
              />
            </label>
            <div className="chorus-modal-actions">
              <button type="button" className="btn" onClick={() => setShowClientModal(false)}>
                Annuler
              </button>
              <button type="button" className="btn btn-primary" onClick={saveClient}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chorus;
