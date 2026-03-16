import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './PlateauxRepas.css';

const getSite = () => (window.location.pathname.startsWith('/lon') ? 'lon' : 'plan');
const params = (site) => ({ params: { site } });

const TYPES_PRODUIT = [
  { value: 'entree', label: 'Entrée' },
  { value: 'plat', label: 'Plat' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'gouter', label: 'Goûter' },
  { value: 'boisson', label: 'Boisson' },
  { value: 'fromage', label: 'Fromage' },
  { value: 'autre', label: 'Autre' }
];

const STATUTS = { en_attente: 'En attente', confirmee: 'Confirmée', livree: 'Livrée', annulee: 'Annulée' };

const PlateauxRepas = () => {
  const site = getSite();
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [formules, setFormules] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [activeTab, filterDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'clients') {
        const r = await api.get('/meal-reservations/clients', params(site));
        setClients(r.data?.data || []);
      } else if (activeTab === 'produits') {
        const r = await api.get('/meal-reservations/produits', params(site));
        setProduits(r.data?.data || []);
      } else if (activeTab === 'formules') {
        const r = await api.get('/meal-reservations/formules', params(site));
        setFormules(r.data?.data || []);
      } else {
        const r = await api.get('/meal-reservations/reservations', { params: { site, date: filterDate } });
        setReservations(r.data?.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  // --- Clients ---
  const [formClient, setFormClient] = useState({ nom: '', adresse: '', contact: '', telephones: [], login: '', password: '' });
  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/meal-reservations/clients/${editItem._id}`, { ...formClient, site });
        toast.success('Client mis à jour');
      } else {
        await api.post('/meal-reservations/clients', { ...formClient, site });
        toast.success('Client créé');
      }
      setShowModal(null);
      setEditItem(null);
      setFormClient({ nom: '', adresse: '', contact: '', telephones: [], login: '', password: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };
  const openEditClient = (c) => {
    setEditItem(c);
    setFormClient({
      nom: c.nom,
      adresse: c.adresse || '',
      contact: c.contact || '',
      telephones: c.telephones || [],
      login: c.login,
      password: ''
    });
    setShowModal('client');
  };

  // --- Produits ---
  const [formProduit, setFormProduit] = useState({ nom: '', type: 'plat', enRupture: false, visible: true, ordre: 0 });
  const handleSaveProduit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/meal-reservations/produits/${editItem._id}`, { ...formProduit, site });
        toast.success('Produit mis à jour');
      } else {
        await api.post('/meal-reservations/produits', { ...formProduit, site });
        toast.success('Produit créé');
      }
      setShowModal(null);
      setEditItem(null);
      setFormProduit({ nom: '', type: 'plat', enRupture: false, visible: true, ordre: 0 });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };
  const toggleRupture = async (p) => {
    try {
      await api.put(`/meal-reservations/produits/${p._id}`, { ...p, enRupture: !p.enRupture, site });
      toast.success(p.enRupture ? 'Produit remis en stock' : 'Produit marqué en rupture');
      loadData();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  // --- Formules ---
  const [formFormule, setFormFormule] = useState({ nom: '', description: '', prix: 0, options: [], produitsInclus: [] });
  const handleSaveFormule = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/meal-reservations/formules/${editItem._id}`, { ...formFormule, site });
        toast.success('Formule mise à jour');
      } else {
        await api.post('/meal-reservations/formules', { ...formFormule, site });
        toast.success('Formule créée');
      }
      setShowModal(null);
      setEditItem(null);
      setFormFormule({ nom: '', description: '', prix: 0, options: [], produitsInclus: [] });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="plateaux-repas">
      <div className="plateaux-header">
        <h2>🍽️ Plateaux repas</h2>
        <span className="site-badge">{site === 'lon' ? 'Longuenesse' : 'Arras'}</span>
      </div>
      <div className="plateaux-tabs">
        {['clients', 'produits', 'formules', 'reservations'].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'clients' && '👥 Clients'}
            {tab === 'produits' && '📦 Produits'}
            {tab === 'formules' && '📋 Formules'}
            {tab === 'reservations' && '📅 Réservations'}
          </button>
        ))}
      </div>

      {activeTab === 'reservations' && (
        <div className="filter-date">
          <label>Date :</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <p className="loading">Chargement...</p>
      ) : (
        <>
          {activeTab === 'clients' && (
            <div className="plateaux-list">
              <button className="btn-add" onClick={() => { setEditItem(null); setFormClient({ nom: '', adresse: '', contact: '', telephones: [], login: '', password: '' }); setShowModal('client'); }}>
                + Ajouter un client
              </button>
              <table>
                <thead>
                  <tr><th>Nom</th><th>Contact</th><th>Login</th><th></th></tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c._id}>
                      <td>{c.nom}</td>
                      <td>{c.contact}</td>
                      <td>{c.login}</td>
                      <td>
                        <button className="btn-sm" onClick={() => openEditClient(c)}>Modifier</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'produits' && (
            <div className="plateaux-list">
              <button className="btn-add" onClick={() => { setEditItem(null); setFormProduit({ nom: '', type: 'plat', enRupture: false, visible: true, ordre: 0 }); setShowModal('produit'); }}>
                + Ajouter un produit
              </button>
              <table>
                <thead>
                  <tr><th>Nom</th><th>Type</th><th>Rupture</th><th></th></tr>
                </thead>
                <tbody>
                  {produits.map((p) => (
                    <tr key={p._id}>
                      <td>{p.nom}</td>
                      <td>{TYPES_PRODUIT.find(t => t.value === p.type)?.label || p.type}</td>
                      <td>
                        <button className={`btn-sm ${p.enRupture ? 'rupture' : ''}`} onClick={() => toggleRupture(p)}>
                          {p.enRupture ? 'En rupture' : 'Disponible'}
                        </button>
                      </td>
                      <td>
                        <button className="btn-sm" onClick={() => { setEditItem(p); setFormProduit(p); setShowModal('produit'); }}>Modifier</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'formules' && (
            <div className="plateaux-list">
              <button className="btn-add" onClick={() => { setEditItem(null); setFormFormule({ nom: '', description: '', prix: 0, options: [], produitsInclus: [] }); setShowModal('formule'); }}>
                + Ajouter une formule
              </button>
              <table>
                <thead>
                  <tr><th>Nom</th><th>Prix</th><th></th></tr>
                </thead>
                <tbody>
                  {formules.map((f) => (
                    <tr key={f._id}>
                      <td>{f.nom}</td>
                      <td>{f.prix}€</td>
                      <td>
                        <button className="btn-sm" onClick={() => { setEditItem(f); setFormFormule({ ...f, produitsInclus: (f.produitsInclus || []).map(x => x._id || x) }); setShowModal('formule'); }}>Modifier</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="plateaux-list">
              <table>
                <thead>
                  <tr><th>Client</th><th>Date</th><th>Formule</th><th>Qté</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r._id}>
                      <td>{r.clientProId?.nom}</td>
                      <td>{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                      <td>{r.formuleId?.nom}</td>
                      <td>{r.quantite}</td>
                      <td>{STATUTS[r.statut] || r.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reservations.length === 0 && <p className="empty">Aucune réservation pour cette date.</p>}
            </div>
          )}
        </>
      )}

      {/* Modal Client */}
      {showModal === 'client' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editItem ? 'Modifier le client' : 'Nouveau client'}</h3>
            <form onSubmit={handleSaveClient}>
              <label>Nom (raison sociale)</label>
              <input required value={formClient.nom} onChange={(e) => setFormClient({ ...formClient, nom: e.target.value })} />
              <label>Adresse</label>
              <input value={formClient.adresse} onChange={(e) => setFormClient({ ...formClient, adresse: e.target.value })} />
              <label>Contact (email)</label>
              <input required type="email" value={formClient.contact} onChange={(e) => setFormClient({ ...formClient, contact: e.target.value })} />
              <label>Login</label>
              <input required value={formClient.login} onChange={(e) => setFormClient({ ...formClient, login: e.target.value })} disabled={!!editItem} />
              {!editItem && <><label>Mot de passe</label><input required type="password" value={formClient.password} onChange={(e) => setFormClient({ ...formClient, password: e.target.value })} /></>}
              {editItem && formClient.password && <><label>Nouveau mot de passe (laisser vide pour garder)</label><input type="password" value={formClient.password} onChange={(e) => setFormClient({ ...formClient, password: e.target.value })} /></>}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(null)}>Annuler</button>
                <button type="submit">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Produit */}
      {showModal === 'produit' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editItem ? 'Modifier le produit' : 'Nouveau produit'}</h3>
            <form onSubmit={handleSaveProduit}>
              <label>Nom</label>
              <input required value={formProduit.nom} onChange={(e) => setFormProduit({ ...formProduit, nom: e.target.value })} />
              <label>Type</label>
              <select value={formProduit.type} onChange={(e) => setFormProduit({ ...formProduit, type: e.target.value })}>
                {TYPES_PRODUIT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <label><input type="checkbox" checked={formProduit.enRupture} onChange={(e) => setFormProduit({ ...formProduit, enRupture: e.target.checked })} /> En rupture</label>
              <label><input type="checkbox" checked={formProduit.visible} onChange={(e) => setFormProduit({ ...formProduit, visible: e.target.checked })} /> Visible</label>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(null)}>Annuler</button>
                <button type="submit">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Formule */}
      {showModal === 'formule' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editItem ? 'Modifier la formule' : 'Nouvelle formule'}</h3>
            <form onSubmit={handleSaveFormule}>
              <label>Nom</label>
              <input required value={formFormule.nom} onChange={(e) => setFormFormule({ ...formFormule, nom: e.target.value })} />
              <label>Description</label>
              <input value={formFormule.description} onChange={(e) => setFormFormule({ ...formFormule, description: e.target.value })} />
              <label>Prix (€)</label>
              <input type="number" step="0.01" min="0" required value={formFormule.prix} onChange={(e) => setFormFormule({ ...formFormule, prix: parseFloat(e.target.value) || 0 })} />
              <label>Produits inclus</label>
              <select multiple value={formFormule.produitsInclus || []} onChange={(e) => setFormFormule({ ...formFormule, produitsInclus: Array.from(e.target.selectedOptions, o => o.value) })}>
                {(produits || []).filter(p => !p.enRupture).map((p) => <option key={p._id} value={p._id}>{p.nom}</option>)}
              </select>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(null)}>Annuler</button>
                <button type="submit">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlateauxRepas;
