import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getApiUrl } from '../config/apiConfig';
import './CommandesEnLigne.css';

const MONTH_NAMES = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

const CommandesEnLigne = () => {
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [links, setLinks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkClass, setNewLinkClass] = useState('');
  const [editingLink, setEditingLink] = useState(null);
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkClass, setEditLinkClass] = useState('');
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const printRef = useRef();

  const city = 'longuenesse';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === '1') {
      toast.success('Compte Google connecté');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('google_error')) {
      toast.error(decodeURIComponent(params.get('google_error')));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    loadLinks();
    loadGoogleAuthStatus();
  }, []);

  useEffect(() => {
    if (links.length > 0) {
      loadOrdersForDay();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [links.length, selectedDate]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/online-orders/links', { params: { city } });
      setLinks(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleAuthStatus = async () => {
    try {
      const res = await api.get('/online-orders/auth/status', { params: { city } });
      setGoogleConnected(res.data?.connected || false);
      setGoogleEmail(res.data?.email || '');
    } catch {
      setGoogleConnected(false);
      setGoogleEmail('');
    }
  };

  const handleConnectGoogle = () => {
    const returnUrl = `${window.location.origin}${window.location.pathname}`;
    const authUrl = `${getApiUrl()}/online-orders/auth/google?city=${city}&return_url=${encodeURIComponent(returnUrl)}`;
    window.location.href = authUrl;
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Déconnecter le compte Google ?')) return;
    try {
      await api.post('/online-orders/auth/disconnect', { city });
      setGoogleConnected(false);
      setGoogleEmail('');
      toast.success('Compte Google déconnecté');
    } catch (err) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const loadOrdersForDay = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.get('/online-orders/orders/day', {
        params: { date: selectedDate, city }
      });
      setOrders(res.data?.data?.orders || []);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Erreur lors du chargement des commandes';
      toast.error(msg);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadMonthlySummary = async () => {
    try {
      const res = await api.get('/online-orders/orders/monthly-summary', {
        params: { month: summaryMonth, year: summaryYear, city }
      });
      setMonthlySummary(res.data?.data);
      setShowMonthlySummary(true);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement du récapitulatif');
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLinkUrl.trim() || !newLinkClass.trim()) {
      toast.error('URL et nom de classe requis');
      return;
    }
    try {
      await api.post('/online-orders/links', {
        spreadsheetUrl: newLinkUrl.trim(),
        className: newLinkClass.trim(),
        city
      });
      toast.success('Lien ajouté');
      setNewLinkUrl('');
      setNewLinkClass('');
      loadLinks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleSyncTabs = async (id) => {
    try {
      await api.post(`/online-orders/links/${id}/sync-tabs`, null, { params: { city } });
      toast.success('Onglets synchronisés (Mars, Avril, etc.)');
      loadLinks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la synchronisation');
    }
  };

  const handleEditLink = (link) => {
    setEditingLink(link._id);
    setEditLinkUrl(link.spreadsheetUrl || '');
    setEditLinkClass(link.className || '');
  };

  const handleSaveEditLink = async (e) => {
    e.preventDefault();
    if (!editingLink) return;
    try {
      await api.put(`/online-orders/links/${editingLink}`, {
        className: editLinkClass.trim(),
        spreadsheetUrl: editLinkUrl.trim()
      });
      toast.success('Lien modifié');
      setEditingLink(null);
      loadLinks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const handleCancelEdit = () => {
    setEditingLink(null);
    setEditLinkUrl('');
    setEditLinkClass('');
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm('Supprimer ce lien ?')) return;
    try {
      await api.delete(`/online-orders/links/${id}`);
      toast.success('Lien supprimé');
      loadLinks();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const ordersByClass = {};
    let globalIdx = 0;
    orders.forEach(o => {
      const c = o.className || 'Classe';
      if (!ordersByClass[c]) ordersByClass[c] = [];
      ordersByClass[c].push({ ...o, _num: ++globalIdx });
    });
    const labelsHtml = Object.entries(ordersByClass).flatMap(([cls, items]) =>
      items.map(o => `
        <div class="label">
          <div class="label-meta">#${o._num}/${orders.length} - ${dateStr} - ${timeStr}</div>
          <div class="label-class">${cls}</div>
          <div class="label-name">${o.name || '-'}</div>
          <div class="label-order">${o.order || '-'}</div>
        </div>
      `)
    ).join('');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquettes commandes - ${selectedDate}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: Arial, sans-serif; font-size: 10px; padding: 0; margin: 0; }
          .labels-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 10px;
          }
          .label {
            border: 1px solid #333;
            padding: 10px;
            min-height: 45mm;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .label-meta { font-size: 10px; color: #666; margin-bottom: 4px; }
          .label-class { font-weight: bold; margin-bottom: 6px; font-size: 13px; }
          .label-name { font-size: 14px; margin-bottom: 4px; }
          .label-order { font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="labels-grid">${labelsHtml}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Grouper les commandes par classe, en incluant TOUS les liens configurés (même vides)
  const ordersByClass = {};
  links.forEach((l) => {
    ordersByClass[l.className] = [];
  });
  orders.forEach((o) => {
    const c = o.className || 'Classe';
    if (!ordersByClass[c]) ordersByClass[c] = [];
    ordersByClass[c].push(o);
  });

  return (
    <div className="commandes-en-ligne">
      <div className="page-header">
        <h1>Commandes en ligne</h1>
        <div className="header-actions">
          <div className="google-auth-status">
            {googleConnected ? (
              <>
                <span className="google-email">Connecté : {googleEmail}</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleDisconnectGoogle}>
                  Déconnecter
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-google" onClick={handleConnectGoogle}>
                Connecter Google
              </button>
            )}
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setShowLinksModal(true)}>
            Liens
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint} disabled={orders.length === 0}>
            Imprimer
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => { setShowMonthlySummary(true); loadMonthlySummary(); }}>
            Récapitulatif par mois
          </button>
        </div>
      </div>

      <div className="filters">
        <label>
          Date :
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </div>

      {loading || loadingOrders ? (
        <div className="loading">Chargement…</div>
      ) : !googleConnected ? (
        <div className="empty-state">
          <p>Connectez votre compte Google pour accéder aux feuilles partagées par l'école.</p>
          <button type="button" className="btn btn-google" onClick={handleConnectGoogle}>
            Connecter Google
          </button>
        </div>
      ) : links.length === 0 ? (
        <div className="empty-state">
          <p>Aucun lien configuré.</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowLinksModal(true)}>
            Ajouter des liens
          </button>
        </div>
      ) : (
        <div ref={printRef} className="orders-grid">
          {orders.length === 0 && (
            <p className="no-orders-msg">Aucune commande pour le {selectedDate}.</p>
          )}
          {Object.entries(ordersByClass).map(([cls, items]) => (
            <div key={cls} className="order-block">
              <h3>{cls}</h3>
              <table>
                <thead>
                  <tr>
                    <th className="w-12">N°</th>
                    <th>Jour</th>
                    <th>Nom</th>
                    <th>Commande</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((o, i) => (
                    <tr key={`${o.name}-${i}`}>
                      <td className="font-bold">{i + 1}</td>
                      <td>{o.day}</td>
                      <td>{o.name}</td>
                      <td>{o.order}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showLinksModal && (
        <div className="commandes-modal-overlay" onClick={() => setShowLinksModal(false)}>
          <div className="commandes-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Gestion des liens</h2>
            <form onSubmit={handleAddLink}>
              <input
                type="url"
                placeholder="URL Google Sheet (ex: https://docs.google.com/spreadsheets/d/...)"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
              />
              <input
                type="text"
                placeholder="Nom de la classe"
                value={newLinkClass}
                onChange={(e) => setNewLinkClass(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Ajouter</button>
            </form>
            <ul className="links-list">
              {links.map((l) => (
                <li key={l._id}>
                  {editingLink === l._id ? (
                    <form onSubmit={handleSaveEditLink} className="link-edit-form">
                      <input
                        type="url"
                        placeholder="URL Google Sheet"
                        value={editLinkUrl}
                        onChange={(e) => setEditLinkUrl(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Nom de la classe"
                        value={editLinkClass}
                        onChange={(e) => setEditLinkClass(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn btn-primary btn-sm">Enregistrer</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>Annuler</button>
                    </form>
                  ) : (
                    <>
                      <span className="link-class">{l.className}</span>
                      <a href={l.spreadsheetUrl} target="_blank" rel="noopener noreferrer">Ouvrir</a>
                      <button type="button" className="btn btn-sm" onClick={() => handleEditLink(l)} title="Modifier le nom ou l'URL">
                        Modifier
                      </button>
                      <button type="button" className="btn btn-sm" onClick={() => handleSyncTabs(l._id)} title="Synchroniser les onglets (Mars, Avril...)">
                        Sync onglets
                      </button>
                      <button type="button" className="btn-delete" onClick={() => handleDeleteLink(l._id)}>Supprimer</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-secondary" onClick={() => setShowLinksModal(false)}>Fermer</button>
          </div>
        </div>
      )}

      {showMonthlySummary && (
        <div className="commandes-modal-overlay" onClick={() => setShowMonthlySummary(false)}>
          <div className="commandes-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Récapitulatif par mois</h2>
            <div className="summary-filters">
              <select value={summaryMonth} onChange={(e) => setSummaryMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select value={summaryYear} onChange={(e) => setSummaryYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button type="button" className="btn btn-primary" onClick={loadMonthlySummary}>Actualiser</button>
            </div>
            {monthlySummary && (
              <div className="monthly-summary">
                <h3>{monthlySummary.monthName} {monthlySummary.year}</h3>
                <table>
                  <tbody>
                    {Object.entries(monthlySummary.byClass || {}).map(([cls, count]) => (
                      <tr key={cls}>
                        <td>{cls}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>Total</td>
                      <td><strong>{monthlySummary.total}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setShowMonthlySummary(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandesEnLigne;
