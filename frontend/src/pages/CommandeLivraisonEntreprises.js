import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey } from '../config/site';

const statusLabels = {
  submitted: 'Envoyée',
  acknowledged: 'Pris en compte',
  invoiced: 'Facturé',
  paid: 'Payé',
  cancelled: 'Annulé'
};

const CommandeLivraisonEntreprises = () => {
  const siteKey = getSiteKey(); // lon | plan
  const site = siteKey === 'lon' ? 'longuenesse' : 'arras';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('submitted');

  const [tab, setTab] = useState('orders'); // orders | companies | formulas
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', phone: '', email: '' });
  const [createdPassword, setCreatedPassword] = useState(null);

  const [formulasLoading, setFormulasLoading] = useState(false);
  const [formulas, setFormulas] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/partner-orders/internal', { params: { site, status: filterStatus } });
      setOrders(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const res = await api.get('/partner-admin/companies', { params: { site } });
      setCompanies(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error(e);
      alert('Impossible de charger les entreprises (droits admin requis).');
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const createCompany = async () => {
    try {
      setCreatedPassword(null);
      const payload = {
        name: String(newCompany.name || '').trim(),
        phone: String(newCompany.phone || '').trim(),
        email: String(newCompany.email || '').trim()
      };
      if (!payload.name || !payload.email) {
        alert('Nom et email requis.');
        return;
      }
      const res = await api.post('/partner-admin/companies', payload, { params: { site } });
      const pwd = res.data?.password;
      setCreatedPassword(pwd || null);
      setNewCompany({ name: '', phone: '', email: '' });
      await loadCompanies();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Création impossible (droits admin requis).');
    }
  };

  const sendInvite = async (companyId) => {
    try {
      await api.post(`/partner-admin/companies/${companyId}/send-invite`, { site }, { params: { site } });
      alert('Email envoyé.');
      await loadCompanies();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Envoi impossible (droits admin requis).');
    }
  };

  const loadFormulas = async () => {
    setFormulasLoading(true);
    try {
      const res = await api.get('/partner-admin/formulas', { params: { site } });
      setFormulas(res.data?.data || null);
    } catch (e) {
      console.error(e);
      alert('Impossible de charger les formules (droits admin requis).');
      setFormulas(null);
    } finally {
      setFormulasLoading(false);
    }
  };

  const saveFormulas = async () => {
    try {
      if (!formulas) return;
      await api.put('/partner-admin/formulas', formulas, { params: { site } });
      alert('Formules enregistrées.');
      await loadFormulas();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Sauvegarde impossible.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, site]);

  useEffect(() => {
    if (tab === 'companies') loadCompanies();
    if (tab === 'formulas') loadFormulas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, site]);

  const grouped = useMemo(() => {
    return orders;
  }, [orders]);

  const updateStatus = async (orderId, nextStatus) => {
    try {
      await api.patch(`/partner-admin/orders/${orderId}/status`, { status: nextStatus }, { params: { site } });
      await load();
    } catch (e) {
      console.error(e);
      alert('Impossible de changer le statut (droits admin requis).');
    }
  };

  const updateFormulaField = (mealType, tier, field, value) => {
    setFormulas((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next[mealType] = next[mealType] || {};
      next[mealType][tier] = next[mealType][tier] || {};
      next[mealType][tier][field] = value;
      return next;
    });
  };

  const updateFormulaItems = (mealType, tier, textareaValue) => {
    const items = String(textareaValue || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    updateFormulaField(mealType, tier, 'items', items);
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>🚚 Commandes Livraison (Entreprises)</h2>
      <p style={{ color: '#666' }}>
        Commandes partenaires (petits déjeuners / déjeuners). Les salariés peuvent consulter; l&apos;admin peut changer les statuts.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <button
          onClick={() => setTab('orders')}
          style={{ padding: '8px 12px', borderRadius: '8px', background: tab === 'orders' ? '#eef2ff' : '#fff' }}
        >
          Commandes
        </button>
        <button
          onClick={() => setTab('companies')}
          style={{ padding: '8px 12px', borderRadius: '8px', background: tab === 'companies' ? '#eef2ff' : '#fff' }}
        >
          Entreprises (admin)
        </button>
        <button
          onClick={() => setTab('formulas')}
          style={{ padding: '8px 12px', borderRadius: '8px', background: tab === 'formulas' ? '#eef2ff' : '#fff' }}
        >
          Formules (admin)
        </button>
      </div>

      {tab === 'orders' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Statut</span>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="submitted">Envoyée</option>
                <option value="acknowledged">Pris en compte</option>
                <option value="invoiced">Facturé</option>
                <option value="paid">Payé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </label>
            <button onClick={load} style={{ padding: '8px 12px', borderRadius: '8px' }}>
              Rafraîchir
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#666' }}>Chargement…</p>
          ) : grouped.length === 0 ? (
            <p style={{ color: '#666' }}>Aucune commande.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {grouped.map((o) => (
                <div
                  key={o._id || o.id}
                  style={{
                    border: '1px solid #e5e5e5',
                    borderRadius: '10px',
                    padding: '12px',
                    background: '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {new Date(o.datetime).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
                      </div>
                      <div style={{ color: '#555', marginTop: '4px' }}>
                        <b>{o.mealType === 'breakfast' ? 'Petit déjeuner' : 'Déjeuner'}</b> • {o.tier} •{' '}
                        {o.fulfillment === 'delivery' ? 'Livraison' : 'Retrait magasin'}
                      </div>
                      <div style={{ color: '#555', marginTop: '4px' }}>
                        <span style={{ fontWeight: 700 }}>Statut :</span> {statusLabels[o.status] || o.status}
                      </div>
                    </div>
                    <div style={{ minWidth: '240px' }}>
                      <div style={{ fontSize: '0.9rem', color: '#333' }}>
                        <b>Formule :</b> {o.itemsSnapshot?.label || '—'}
                      </div>
                      {Array.isArray(o.itemsSnapshot?.items) && o.itemsSnapshot.items.length > 0 && (
                        <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                          {o.itemsSnapshot.items.slice(0, 8).map((it, idx) => (
                            <li key={idx} style={{ color: '#555' }}>
                              {it}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '10px' }}>
                    <button onClick={() => updateStatus(o._id, 'acknowledged')} style={{ padding: '6px 10px', borderRadius: '8px' }}>
                      Pris en compte
                    </button>
                    <button onClick={() => updateStatus(o._id, 'invoiced')} style={{ padding: '6px 10px', borderRadius: '8px' }}>
                      Facturé
                    </button>
                    <button onClick={() => updateStatus(o._id, 'paid')} style={{ padding: '6px 10px', borderRadius: '8px' }}>
                      Payé
                    </button>
                    <button onClick={() => updateStatus(o._id, 'cancelled')} style={{ padding: '6px 10px', borderRadius: '8px' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'companies' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '10px', padding: '12px', background: '#fff' }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Créer une entreprise (génère un mot de passe)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <input
                placeholder="Nom entreprise"
                value={newCompany.name}
                onChange={(e) => setNewCompany((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                placeholder="Téléphone"
                value={newCompany.phone}
                onChange={(e) => setNewCompany((p) => ({ ...p, phone: e.target.value }))}
              />
              <input
                placeholder="Email"
                value={newCompany.email}
                onChange={(e) => setNewCompany((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 10, flexWrap: 'wrap' }}>
              <button onClick={createCompany} style={{ padding: '8px 12px', borderRadius: '8px' }}>
                Créer
              </button>
              <button onClick={loadCompanies} style={{ padding: '8px 12px', borderRadius: '8px' }}>
                Rafraîchir la liste
              </button>
            </div>
            {createdPassword ? (
              <div style={{ marginTop: 10, color: '#333' }}>
                <b>Mot de passe généré :</b> <code style={{ padding: '2px 6px', background: '#f3f4f6', borderRadius: 6 }}>{createdPassword}</code>
              </div>
            ) : null}
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              Ensuite clique “Envoyer mot de passe” sur la ligne de l’entreprise pour envoyer l’email avec le lien Vercel.
            </div>
          </div>

          {companiesLoading ? (
            <p style={{ color: '#666' }}>Chargement…</p>
          ) : companies.length === 0 ? (
            <p style={{ color: '#666' }}>Aucune entreprise (ou pas les droits admin).</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {companies.map((c) => (
                <div
                  key={c.id}
                  style={{ border: '1px solid #e5e5e5', borderRadius: '10px', padding: '12px', background: '#fff' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>{c.name}</div>
                      <div style={{ color: '#555', marginTop: 4 }}>{c.email}{c.phone ? ` • ${c.phone}` : ''}</div>
                      <div style={{ color: '#666', marginTop: 4, fontSize: 13 }}>
                        {c.active ? 'Actif' : 'Inactif'}{c.lastLoginAt ? ` • Dernière connexion: ${new Date(c.lastLoginAt).toLocaleString('fr-FR')}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <button onClick={() => sendInvite(c.id)} style={{ padding: '8px 12px', borderRadius: '8px' }}>
                        Envoyer mot de passe
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'formulas' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={loadFormulas} style={{ padding: '8px 12px', borderRadius: '8px' }}>
              Rafraîchir
            </button>
            <button onClick={saveFormulas} style={{ padding: '8px 12px', borderRadius: '8px' }}>
              Enregistrer
            </button>
          </div>

          {formulasLoading ? (
            <p style={{ color: '#666' }}>Chargement…</p>
          ) : !formulas ? (
            <p style={{ color: '#666' }}>Aucune formule (ou pas les droits admin).</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {['breakfast', 'lunch'].map((mealType) => (
                <div key={mealType} style={{ border: '1px solid #e5e5e5', borderRadius: '10px', padding: '12px', background: '#fff' }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>
                    {mealType === 'breakfast' ? 'Petit déjeuner' : 'Déjeuner'}
                  </div>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {['eco', 'classic', 'premium'].map((tier) => {
                      const f = formulas?.[mealType]?.[tier] || {};
                      return (
                        <div key={tier} style={{ border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
                          <div style={{ fontWeight: 800, marginBottom: 8 }}>{tier}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '0.5rem' }}>
                            <input
                              placeholder="Libellé"
                              value={f.label || ''}
                              onChange={(e) => updateFormulaField(mealType, tier, 'label', e.target.value)}
                            />
                            <input
                              placeholder="Prix (centimes)"
                              value={String(f.priceCents ?? '')}
                              onChange={(e) => updateFormulaField(mealType, tier, 'priceCents', Number(e.target.value || 0))}
                            />
                          </div>
                          <input
                            placeholder="Description"
                            style={{ marginTop: 8, width: '100%' }}
                            value={f.description || ''}
                            onChange={(e) => updateFormulaField(mealType, tier, 'description', e.target.value)}
                          />
                          <textarea
                            placeholder="Items (1 par ligne)"
                            style={{ marginTop: 8, width: '100%', minHeight: 90 }}
                            value={Array.isArray(f.items) ? f.items.join('\n') : ''}
                            onChange={(e) => updateFormulaItems(mealType, tier, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommandeLivraisonEntreprises;

