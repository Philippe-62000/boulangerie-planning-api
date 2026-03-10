import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './ProductExchanges.css';

const ProductExchanges = () => {
  const [activeTab, setActiveTab] = useState('exchanges');
  const [partners, setPartners] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [currentSite, setCurrentSite] = useState({ name: 'Ce site' });
  const [loading, setLoading] = useState(true);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingExchange, setEditingExchange] = useState(null);
  const [filterPartnerId, setFilterPartnerId] = useState('');

  const [partnerForm, setPartnerForm] = useState({ name: '', email: '' });
  const [exchangeForm, setExchangeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    productName: '',
    quantity: '',
    detail: '',
    fromPartnerId: '',
    toPartnerId: ''
  });
  const [exchangeEditForm, setExchangeEditForm] = useState({
    settledAt: '',
    invoicedAt: '',
    paidAt: '',
    valorisedAt: '',
    valorisedAmount: ''
  });

  const isLonguenesse = window.location.pathname.startsWith('/lon');

  useEffect(() => {
    fetchPartners();
    fetchCurrentSite();
    fetchExchanges();
  }, []);

  useEffect(() => {
    if (activeTab === 'exchanges') fetchExchanges();
  }, [activeTab, filterPartnerId]);

  const fetchPartners = async () => {
    try {
      const res = await api.get('/product-exchanges/partners');
      if (res.data.success) setPartners(res.data.data);
    } catch (err) {
      toast.error('Erreur chargement partenaires');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSite = async () => {
    try {
      const res = await api.get('/product-exchanges/current-site');
      if (res.data.success) setCurrentSite(res.data.data);
    } catch (err) {
      setCurrentSite({ name: isLonguenesse ? 'Boulangerie Longuenesse' : 'Boulangerie Arras' });
    }
  };

  const fetchExchanges = async () => {
    try {
      const params = {};
      if (filterPartnerId) params.partnerId = filterPartnerId;
      const res = await api.get('/product-exchanges', { params });
      if (res.data.success) setExchanges(res.data.data);
    } catch (err) {
      toast.error('Erreur chargement échanges');
    }
  };

  const handleSavePartner = async () => {
    if (!partnerForm.name.trim() || !partnerForm.email.trim()) {
      toast.error('Nom et email requis');
      return;
    }
    try {
      if (editingPartner) {
        await api.put(`/product-exchanges/partners/${editingPartner._id}`, partnerForm);
        toast.success('Partenaire modifié');
      } else {
        await api.post('/product-exchanges/partners', partnerForm);
        toast.success('Partenaire créé');
      }
      setShowPartnerModal(false);
      setEditingPartner(null);
      setPartnerForm({ name: '', email: '' });
      fetchPartners();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur sauvegarde');
    }
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm('Supprimer ce partenaire ?')) return;
    try {
      await api.delete(`/product-exchanges/partners/${id}`);
      toast.success('Partenaire supprimé');
      fetchPartners();
    } catch (err) {
      toast.error('Erreur suppression');
    }
  };

  const handleOpenEditPartner = (p) => {
    setEditingPartner(p);
    setPartnerForm({ name: p.name, email: p.email });
    setShowPartnerModal(true);
  };

  const handleSaveExchange = async () => {
    if (!exchangeForm.date || !exchangeForm.productName || exchangeForm.quantity === '') {
      toast.error('Date, produit et quantité requis');
      return;
    }
    const fromId = exchangeForm.fromPartnerId || null;
    const toId = exchangeForm.toPartnerId || null;
    if (!fromId && !toId) {
      toast.error('Sélectionnez au moins un partenaire (De ou À)');
      return;
    }
    if (fromId && toId && fromId === toId) {
      toast.error('De et À doivent être différents');
      return;
    }
    try {
      await api.post('/product-exchanges', {
        ...exchangeForm,
        fromPartnerId: fromId,
        toPartnerId: toId,
        quantity: Number(exchangeForm.quantity)
      });
      toast.success('Échange créé - Email envoyé au partenaire');
      setShowExchangeModal(false);
      setExchangeForm({
        date: new Date().toISOString().split('T')[0],
        productName: '',
        quantity: '',
        detail: '',
        fromPartnerId: '',
        toPartnerId: ''
      });
      fetchExchanges();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur création');
    }
  };

  const handleUpdateExchange = async () => {
    if (!editingExchange) return;
    try {
      const updates = {};
      if (exchangeEditForm.settledAt) updates.settledAt = exchangeEditForm.settledAt;
      if (exchangeEditForm.invoicedAt) updates.invoicedAt = exchangeEditForm.invoicedAt;
      if (exchangeEditForm.paidAt) updates.paidAt = exchangeEditForm.paidAt;
      if (exchangeEditForm.valorisedAt) updates.valorisedAt = exchangeEditForm.valorisedAt;
      if (exchangeEditForm.valorisedAmount !== '' && exchangeEditForm.valorisedAmount != null) updates.valorisedAmount = Number(exchangeEditForm.valorisedAmount);
      await api.put(`/product-exchanges/${editingExchange._id}`, updates);
      toast.success('Échange mis à jour - Email envoyé au partenaire');
      setShowExchangeModal(false);
      setEditingExchange(null);
      setExchangeEditForm({ settledAt: '', invoicedAt: '', paidAt: '', valorisedAt: '', valorisedAmount: '' });
      fetchExchanges();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur mise à jour');
    }
  };

  const handleOpenEditExchange = (ex) => {
    setEditingExchange(ex);
    setExchangeEditForm({
      settledAt: ex.settledAt ? ex.settledAt.split('T')[0] : '',
      invoicedAt: ex.invoicedAt ? ex.invoicedAt.split('T')[0] : '',
      paidAt: ex.paidAt ? ex.paidAt.split('T')[0] : '',
      valorisedAt: ex.valorisedAt ? ex.valorisedAt.split('T')[0] : '',
      valorisedAmount: ex.valorisedAmount != null ? ex.valorisedAmount : ''
    });
    setShowExchangeModal(true);
  };

  const handleDeleteExchange = async (id) => {
    if (!window.confirm('Supprimer cet échange ?')) return;
    try {
      await api.delete(`/product-exchanges/${id}`);
      toast.success('Échange supprimé');
      fetchExchanges();
    } catch (err) {
      toast.error('Erreur suppression');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

  // Calcul du solde par partenaire : positif = le partenaire nous doit, négatif = nous devons au partenaire
  const getBalanceByPartner = () => {
    const balances = {};
    partners.forEach(p => { balances[p._id] = { name: p.name, balance: 0 }; });
    exchanges.forEach(ex => {
      const amount = ex.valorisedAmount ?? 0;
      if (amount === 0) return;
      const fromId = ex.fromPartnerId?._id || null;
      const toId = ex.toPartnerId?._id || null;
      // Site actuel = pas de partenaire (null). On compare avec les IDs des partenaires.
      if (fromId && !toId) {
        // Partenaire nous a prêté (De partenaire → À nous)
        balances[fromId].balance -= amount;
      } else if (!fromId && toId) {
        // Nous avons prêté au partenaire (De nous → À partenaire)
        balances[toId].balance += amount;
      }
    });
    return Object.entries(balances).filter(([, v]) => v.balance !== 0).map(([id, v]) => ({ partnerId: id, ...v }));
  };
  const partnerBalances = getBalanceByPartner();

  const optionsForFromTo = [
    { value: '', label: currentSite.name },
    ...partners.map(p => ({ value: p._id, label: p.name }))
  ];

  if (loading) {
    return (
      <div className="product-exchanges">
        <div className="loading"><div className="spinner" /><p>Chargement...</p></div>
      </div>
    );
  }

  return (
    <div className="product-exchanges">
      <div className="page-header">
        <h2>🔄 Échanges entre boulangeries</h2>
      </div>

      <div className="tabs-nav">
        <button className={activeTab === 'exchanges' ? 'active' : ''} onClick={() => setActiveTab('exchanges')}>
          📋 Échanges
        </button>
        <button className={activeTab === 'partners' ? 'active' : ''} onClick={() => setActiveTab('partners')}>
          👥 Partenaires
        </button>
      </div>

      {activeTab === 'exchanges' && (
        <div className="card">
          <div className="card-header">
            <h3>Liste des échanges</h3>
            <div className="header-actions">
              <select value={filterPartnerId} onChange={(e) => setFilterPartnerId(e.target.value)}>
                <option value="">Tous les partenaires</option>
                {partners.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => { setEditingExchange(null); setShowExchangeModal(true); }}>
                ➕ Nouvel échange
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Qté</th>
                  <th>Détail</th>
                  <th>De</th>
                  <th>À</th>
                  <th>Soldé</th>
                  <th>Facturé</th>
                  <th>Payé</th>
                  <th>Valorisé le</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exchanges.length === 0 ? (
                  <tr><td colSpan="12" className="empty">Aucun échange</td></tr>
                ) : (
                  exchanges.map(ex => (
                    <tr key={ex._id}>
                      <td>{formatDate(ex.date)}</td>
                      <td>{ex.productName}</td>
                      <td>{ex.quantity}</td>
                      <td>{ex.detail || '-'}</td>
                      <td>{ex.fromPartnerId ? ex.fromPartnerId.name : currentSite.name}</td>
                      <td>{ex.toPartnerId ? ex.toPartnerId.name : currentSite.name}</td>
                      <td>{formatDate(ex.settledAt)}</td>
                      <td>{formatDate(ex.invoicedAt)}</td>
                      <td>{formatDate(ex.paidAt)}</td>
                      <td>{formatDate(ex.valorisedAt)}</td>
                      <td>{ex.valorisedAmount != null ? `${ex.valorisedAmount}€` : '-'}</td>
                      <td>
                        <button className="btn-sm btn-edit" onClick={() => handleOpenEditExchange(ex)} title="Modifier / Valoriser">✏️</button>
                        <button className="btn-sm btn-delete" onClick={() => handleDeleteExchange(ex._id)} title="Supprimer">🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {partnerBalances.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem', padding: '1rem 1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem' }}>💰 Comptes de valorisation par partenaire</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                Solde positif = le partenaire nous doit. Solde négatif = nous devons au partenaire.
              </p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Partenaire</th>
                    <th>Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerBalances.map(({ partnerId, name, balance }) => (
                    <tr key={partnerId}>
                      <td>{name}</td>
                      <td style={{ fontWeight: 600, color: balance > 0 ? '#16a34a' : balance < 0 ? '#dc2626' : '#666' }}>
                        {balance > 0 ? `${name} nous doit ${balance}€` : `Nous devons ${Math.abs(balance)}€ à ${name}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="card">
          <div className="card-header">
            <h3>Boulangeries partenaires</h3>
            <button className="btn btn-primary" onClick={() => { setEditingPartner(null); setPartnerForm({ name: '', email: '' }); setShowPartnerModal(true); }}>
              ➕ Nouveau partenaire
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 ? (
                  <tr><td colSpan="3" className="empty">Aucun partenaire. Créez-en un.</td></tr>
                ) : (
                  partners.map(p => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.email}</td>
                      <td>
                        <button className="btn-sm btn-edit" onClick={() => handleOpenEditPartner(p)}>✏️</button>
                        <button className="btn-sm btn-delete" onClick={() => handleDeletePartner(p._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Partenaire */}
      {showPartnerModal && (
        <div className="modal-overlay" onClick={() => setShowPartnerModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingPartner ? 'Modifier le partenaire' : 'Nouveau partenaire'}</h3>
            <div className="form-group">
              <label>Nom (ex: Boulangerie Liévin)</label>
              <input type="text" value={partnerForm.name} onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} placeholder="Boulangerie Liévin" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={partnerForm.email} onChange={e => setPartnerForm({ ...partnerForm, email: e.target.value })} placeholder="contact@boulangerie-lievin.fr" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPartnerModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSavePartner}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Échange */}
      {showExchangeModal && (
        <div className="modal-overlay" onClick={() => setShowExchangeModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            {editingExchange ? (
              <>
                <h3>Modifier l'échange - Soldé / Facturé / Payé / Valoriser</h3>
                <p className="exchange-summary">{editingExchange.productName} ({editingExchange.quantity}) - {formatDate(editingExchange.date)}</p>
                <div className="form-row">
                  <div className="form-group">
                    <label>Soldé le</label>
                    <input type="date" value={exchangeEditForm.settledAt} onChange={e => setExchangeEditForm({ ...exchangeEditForm, settledAt: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Facturé le</label>
                    <input type="date" value={exchangeEditForm.invoicedAt} onChange={e => setExchangeEditForm({ ...exchangeEditForm, invoicedAt: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Payé le</label>
                    <input type="date" value={exchangeEditForm.paidAt} onChange={e => setExchangeEditForm({ ...exchangeEditForm, paidAt: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Valorisé le</label>
                    <input type="date" value={exchangeEditForm.valorisedAt} onChange={e => setExchangeEditForm({ ...exchangeEditForm, valorisedAt: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Montant (€)</label>
                    <input type="number" step="0.01" min="0" value={exchangeEditForm.valorisedAmount} onChange={e => setExchangeEditForm({ ...exchangeEditForm, valorisedAmount: e.target.value })} placeholder="52" />
                  </div>
                </div>
                <p className="help-text">Valorisé X€ = le site « De » a prêté X€ au site « À ». Ex: Longuenesse→Arras 52€ = Arras doit 52€ à Longuenesse.</p>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowExchangeModal(false)}>Annuler</button>
                  <button className="btn btn-primary" onClick={handleUpdateExchange}>Enregistrer</button>
                </div>
              </>
            ) : (
              <>
                <h3>Nouvel échange</h3>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={exchangeForm.date} onChange={e => setExchangeForm({ ...exchangeForm, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Produit</label>
                  <input type="text" value={exchangeForm.productName} onChange={e => setExchangeForm({ ...exchangeForm, productName: e.target.value })} placeholder="Nom du produit" required />
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input type="number" min="0" value={exchangeForm.quantity} onChange={e => setExchangeForm({ ...exchangeForm, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Détail</label>
                  <input type="text" value={exchangeForm.detail} onChange={e => setExchangeForm({ ...exchangeForm, detail: e.target.value })} placeholder="Détail complémentaire" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>De</label>
                    <select value={exchangeForm.fromPartnerId} onChange={e => setExchangeForm({ ...exchangeForm, fromPartnerId: e.target.value })}>
                      {optionsForFromTo.map(o => (
                        <option key={o.value || 'current'} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>À</label>
                    <select value={exchangeForm.toPartnerId} onChange={e => setExchangeForm({ ...exchangeForm, toPartnerId: e.target.value })}>
                      {optionsForFromTo.map(o => (
                        <option key={o.value || 'current'} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="help-text">Un email sera envoyé au partenaire lors de la création.</p>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowExchangeModal(false)}>Annuler</button>
                  <button className="btn btn-primary" onClick={handleSaveExchange}>Créer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductExchanges;
