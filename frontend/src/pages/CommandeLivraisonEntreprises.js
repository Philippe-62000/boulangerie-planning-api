import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { getSiteKey } from '../config/site';

const OFFER_OPTIONS = [
  { key: 'offerBreakfast', label: 'Petit déjeuner' },
  { key: 'offerLunch', label: 'Déjeuner' },
  { key: 'offerDevis', label: 'Devis' },
  { key: 'offerCommande', label: 'Commande' }
];

const DEFAULT_OFFERS = {
  offerBreakfast: true,
  offerLunch: true,
  offerDevis: false,
  offerCommande: false
};

function offersFromCompany(c) {
  if (!c) return { ...DEFAULT_OFFERS };
  if (
    c.offerBreakfast !== undefined ||
    c.offerLunch !== undefined ||
    c.offerDevis !== undefined ||
    c.offerCommande !== undefined
  ) {
    return {
      offerBreakfast: !!c.offerBreakfast,
      offerLunch: !!c.offerLunch,
      offerDevis: !!c.offerDevis,
      offerCommande: !!c.offerCommande
    };
  }
  const mode = c.mealTypesMode || 'both';
  if (mode === 'breakfast') return { ...DEFAULT_OFFERS, offerBreakfast: true, offerLunch: false };
  if (mode === 'lunch') return { ...DEFAULT_OFFERS, offerBreakfast: false, offerLunch: true };
  if (mode === 'none') return { ...DEFAULT_OFFERS, offerBreakfast: false, offerLunch: false };
  return { ...DEFAULT_OFFERS };
}

function offersLabel(offers) {
  const parts = OFFER_OPTIONS.filter((o) => offers[o.key]).map((o) => o.label);
  return parts.length ? parts.join(', ') : 'Aucune option';
}

function OfferCheckboxes({ value, onChange, idPrefix = 'offer' }) {
  const v = { ...DEFAULT_OFFERS, ...value };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 18px', marginTop: 8 }}>
      {OFFER_OPTIONS.map((o) => (
        <label key={o.key} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!v[o.key]}
            onChange={(e) => onChange({ ...v, [o.key]: e.target.checked })}
            id={`${idPrefix}-${o.key}`}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function orderKindLabel(o) {
  const k = o?.orderKind || o?.itemsSnapshot?.orderKind;
  if (k === 'devis') return 'Devis';
  if (k === 'commande') return 'Commande libre';
  return null;
}

const statusLabels = {
  submitted: 'Envoyée',
  acknowledged: 'Pris en compte',
  invoiced: 'Facturé',
  paid: 'Payé',
  cancelled: 'Annulé'
};

/** Textarea « une ligne = un élément » : garde la ligne vide finale tant que l'utilisateur vient d'appuyer sur Entrée. */
function multilineToStringList(raw) {
  const s = String(raw ?? '');
  const endsWithNl = s.endsWith('\n');
  const parts = s.split('\n');
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const line = parts[i];
    const isLast = i === parts.length - 1;
    if (line.trim().length > 0) out.push(line);
    else if (isLast && endsWithNl) out.push(line);
  }
  return out;
}

function sanitizeFormulaPayloadForSave(data) {
  const next = structuredClone(data);
  const listFields = [
    'items',
    'miniViennoiserieOptions',
    'juiceOptions',
    'lunchEntreeOptions',
    'lunchPlatOptions',
    'lunchBoissonOptions',
    'lunchDessertOptions',
    'lunchCollationOptions'
  ];
  for (const meal of ['breakfast', 'lunch']) {
    for (const tier of ['eco', 'classic', 'premium']) {
      const t = next[meal]?.[tier];
      if (!t) continue;
      for (const f of listFields) {
        if (Array.isArray(t[f])) {
          t[f] = t[f].map((x) => String(x)).filter((x) => x.trim().length > 0);
        }
      }
      if (meal === 'breakfast') {
        const n = Number(t.miniViennoiserieCountPerFormula);
        t.miniViennoiserieCountPerFormula = n === 2 ? 2 : n === 3 ? 3 : 1;
      }
    }
  }
  return next;
}

const CommandeLivraisonEntreprises = () => {
  const siteKey = getSiteKey(); // lon | plan
  const site = siteKey === 'lon' ? 'longuenesse' : 'arras';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('submitted');

  const [tab, setTab] = useState('orders'); // orders | companies | formulas
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [showInactiveCompanies, setShowInactiveCompanies] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    isAnonymous: false,
    firstName: '',
    lastName: '',
    structureName: '',
    ...DEFAULT_OFFERS
  });
  const [contactEdits, setContactEdits] = useState({});
  const [offerEdits, setOfferEdits] = useState({});
  const [anonymousEdits, setAnonymousEdits] = useState({});
  const [createdPassword, setCreatedPassword] = useState(null);

  const [formulasLoading, setFormulasLoading] = useState(false);
  const [formulas, setFormulas] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { site };
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      const res = await api.get('/partner-orders/internal', { params });
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
      const res = await api.get('/partner-admin/companies', {
        params: { site, active: showInactiveCompanies ? 'all' : 'true' }
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setCompanies(list);
      const edits = {};
      const offerMap = {};
      const anonMap = {};
      for (const c of list) {
        const id = c.id || c._id;
        if (id) {
          edits[id] = c.contactName || '';
          offerMap[id] = offersFromCompany(c);
          anonMap[id] = !!c.isAnonymous;
        }
      }
      setContactEdits(edits);
      setOfferEdits(offerMap);
      setAnonymousEdits(anonMap);
    } catch (e) {
      console.error(e);
      alert('Impossible de charger les entreprises (droits admin requis).');
      setCompanies([]);
      setContactEdits({});
      setOfferEdits({});
      setAnonymousEdits({});
    } finally {
      setCompaniesLoading(false);
    }
  };

  const createCompany = async () => {
    try {
      setCreatedPassword(null);
      const payload = {
        name: String(newCompany.name || '').trim(),
        contactName: String(newCompany.contactName || '').trim(),
        phone: String(newCompany.phone || '').trim(),
        email: String(newCompany.email || '').trim(),
        isAnonymous: !!newCompany.isAnonymous,
        firstName: String(newCompany.firstName || '').trim(),
        lastName: String(newCompany.lastName || '').trim(),
        structureName: String(newCompany.structureName || '').trim(),
        ...offersFromCompany(newCompany)
      };
      if (!payload.email) {
        alert('Email requis.');
        return;
      }
      if (!payload.isAnonymous && !payload.name) {
        alert('Nom entreprise requis.');
        return;
      }
      if (!payload.isAnonymous && !payload.contactName) {
        alert('Nom du contact requis.');
        return;
      }
      if (payload.isAnonymous && !payload.name) {
        payload.name = payload.structureName || 'Client prospect';
      }
      const res = await api.post('/partner-admin/companies', payload, { params: { site } });
      const pwd = res.data?.password;
      setCreatedPassword(pwd || null);
      if (res.data?.reactivated) {
        alert('Compte existant réactivé avec cet e-mail (nouveau mot de passe affiché ci-dessous).');
      }
      setNewCompany({
        name: '',
        contactName: '',
        phone: '',
        email: '',
        isAnonymous: false,
        firstName: '',
        lastName: '',
        structureName: '',
        ...DEFAULT_OFFERS
      });
      await loadCompanies();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Création impossible (droits admin requis).');
    }
  };

  const saveCompanySettings = async (company) => {
    try {
      const companyId = company.id || company._id;
      const isAnon = anonymousEdits[companyId] ?? company.isAnonymous;
      const contactName = String(contactEdits[companyId] ?? company.contactName ?? '').trim();
      if (!isAnon && !contactName) {
        alert('Indiquez un nom de contact.');
        return;
      }
      const offers = offerEdits[companyId] || offersFromCompany(company);
      await api.patch(
        `/partner-admin/companies/${companyId}`,
        { contactName, isAnonymous: !!isAnon, ...offers },
        { params: { site } }
      );
      await loadCompanies();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Enregistrement impossible.');
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

  const deleteCompany = async (company) => {
    try {
      const ok = window.confirm(`Désactiver le compte entreprise « ${company.name} » (${company.email}) ?`);
      if (!ok) return;
      const companyId = company.id || company._id;
      if (!companyId) {
        alert('Identifiant entreprise manquant.');
        return;
      }
      await api.delete(`/partner-admin/companies/${companyId}`, { params: { site } });
      await loadCompanies();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || 'Suppression impossible (droits admin requis).');
    }
  };

  const permanentlyDeleteCompany = async (company) => {
    try {
      const ok = window.confirm(
        `Supprimer DÉFINITIVEMENT « ${company.name} » (${company.email}) ?\n\n` +
          `L’enregistrement sera effacé de la base : vous pourrez recréer un compte avec la même adresse e-mail.\n` +
          `Les anciennes commandes peuvent rester liées à l’ancien identifiant technique.`
      );
      if (!ok) return;
      const emailNorm = String(company.email || '').toLowerCase().trim();
      if (!emailNorm) {
        alert('E-mail manquant sur cette ligne.');
        return;
      }
      // Route courte sur le serveur (évite « Route non trouvée » si /partner-admin/companies/purge n’est pas déployée)
      const purgeRes = await api.post(
        '/partner-company-purge',
        { email: emailNorm },
        { params: { site } }
      );
      if (purgeRes.data?.success) {
        alert(`Compte effacé de la base pour ${emailNorm}. Vous pouvez recréer avec cet e-mail.`);
      }
      try {
        await loadCompanies();
      } catch (reloadErr) {
        console.error(reloadErr);
        alert(
          'La suppression a peut‑être réussi, mais la liste n’a pas pu être rechargée. Rafraîchissez la page (F5).'
        );
      }
    } catch (e) {
      console.error(e);
      const st = e?.response?.status;
      const msg = e?.response?.data?.error;
      if (st === 404 || msg === 'Route non trouvée') {
        alert(
          'L’API Longuenesse sur Render (boulangerie-planning-api-3) n’a pas encore la route de purge — d’où « Route non trouvée ».\n\n' +
            'Dans Render : ouvrez le service api-3 → Manual Deploy → Deploy latest commit (branche main).\n\n' +
            'Vérifiez ensuite : https://boulangerie-planning-api-3.onrender.com/health doit afficher une version ≥ 1.0.1 (pas 1.0.0).'
        );
      } else {
        alert(msg || 'Suppression définitive impossible (droits admin requis).');
      }
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
      const payload = sanitizeFormulaPayloadForSave(formulas);
      await api.put('/partner-admin/formulas', payload, { params: { site } });
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

  useEffect(() => {
    if (tab === 'companies') loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactiveCompanies]);

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

  const deleteOrder = async (order) => {
    const id = order._id || order.id;
    if (!id) return;
    const when = order.datetime ? new Date(order.datetime).toLocaleString('fr-FR') : '—';
    if (
      !window.confirm(
        `Supprimer définitivement cette commande (${when}) ?\n\nElle disparaîtra ici et sur le site entreprise (Vercel).`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/partner-orders/internal/${id}`, { params: { site } });
      await load();
    } catch (e) {
      console.error(e);
      const st = e?.response?.status;
      if (st === 404) {
        alert(
          'Route de suppression absente sur l’API Render — déployez la dernière version (api-3, branche longuenesse).'
        );
      } else {
        alert(e?.response?.data?.error || 'Suppression impossible.');
      }
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
    const items = multilineToStringList(textareaValue);
    updateFormulaField(mealType, tier, 'items', items);
  };

  const updateFormulaStringList = (mealType, tier, field, textareaValue) => {
    const items = multilineToStringList(textareaValue);
    updateFormulaField(mealType, tier, field, items);
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
                <option value="all">Tous les statuts</option>
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
                      {(o.companyName || o.contactName) && (
                        <div
                          style={{
                            marginTop: '6px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {o.companyName ? (
                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{o.companyName}</div>
                          ) : null}
                          {o.contactName ? (
                            <div style={{ color: '#475569', marginTop: o.companyName ? '2px' : 0 }}>
                              Contact : {o.contactName}
                            </div>
                          ) : null}
                        </div>
                      )}
                      <div style={{ color: '#555', marginTop: '4px' }}>
                        {orderKindLabel(o) ? (
                          <>
                            <b>{orderKindLabel(o)}</b> •{' '}
                          </>
                        ) : (
                          <>
                            <b>{o.mealType === 'breakfast' ? 'Petit déjeuner' : 'Déjeuner'}</b> • {o.tier} •{' '}
                          </>
                        )}
                        {o.fulfillment === 'delivery' ? 'Livraison' : 'Retrait magasin'}
                        {Number(o.quantity) > 1 ? ` • ${o.quantity} formules` : ''}
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
                          {o.itemsSnapshot.items.slice(0, 40).map((it, idx) => (
                            <li key={idx} style={{ color: '#555' }}>
                              {it}
                            </li>
                          ))}
                        </ul>
                      )}
                      {o.mealType === 'breakfast' &&
                        Array.isArray(o.miniViennoiserieDetail) &&
                        o.miniViennoiserieDetail.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: '0.9rem' }}>
                            <b>Mini-viennoiseries ({o.miniViennoiserieTotal ?? '—'} au total) :</b>
                            <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                              {o.miniViennoiserieDetail.map((mv, idx) => (
                                <li key={idx} style={{ color: '#555' }}>
                                  {mv.name} × {mv.quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
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
                    <button
                      type="button"
                      onClick={() => deleteOrder(o)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #dc3545',
                        background: '#fff5f5',
                        color: '#b02a37',
                        fontWeight: 600
                      }}
                    >
                      Supprimer
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
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#444' }}>
            <input
              type="checkbox"
              checked={showInactiveCompanies}
              onChange={(e) => setShowInactiveCompanies(e.target.checked)}
            />
            <span>
              Afficher les comptes désactivés (après « Supprimer », ils sont masqués par défaut)
            </span>
          </label>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '10px', padding: '12px', background: '#fff' }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Créer une entreprise (génère un mot de passe)</div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, color: '#444' }}>
              <input
                type="checkbox"
                checked={!!newCompany.isAnonymous}
                onChange={(e) => setNewCompany((p) => ({ ...p, isAnonymous: e.target.checked }))}
              />
              <span>Client anonyme (prospect — identité complétée sur devis/commande)</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
              <input
                placeholder={newCompany.isAnonymous ? 'Nom affiché (facultatif)' : 'Nom entreprise'}
                value={newCompany.name}
                onChange={(e) => setNewCompany((p) => ({ ...p, name: e.target.value }))}
              />
              {!newCompany.isAnonymous ? (
                <input
                  placeholder="Nom du contact *"
                  value={newCompany.contactName}
                  onChange={(e) => setNewCompany((p) => ({ ...p, contactName: e.target.value }))}
                />
              ) : (
                <input
                  placeholder="Nom de la structure (facultatif)"
                  value={newCompany.structureName}
                  onChange={(e) => setNewCompany((p) => ({ ...p, structureName: e.target.value }))}
                />
              )}
              <input
                placeholder="Téléphone"
                value={newCompany.phone}
                onChange={(e) => setNewCompany((p) => ({ ...p, phone: e.target.value }))}
              />
              <input
                placeholder="Email *"
                value={newCompany.email}
                onChange={(e) => setNewCompany((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <label style={{ display: 'block', marginTop: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Options proposées sur le site commande (Vercel)</span>
              <OfferCheckboxes
                idPrefix="new-co"
                value={newCompany}
                onChange={(offers) => setNewCompany((p) => ({ ...p, ...offers }))}
              />
            </label>
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
            <div style={{ marginTop: 8, color: '#92400e', fontSize: 13 }}>
              Si une ancienne adresse est « déjà utilisée » alors que le compte a été retiré : coche « Afficher les comptes
              désactivés », puis utilise « Effacer de la base (e-mail libéré) » sur la ligne concernée, ou réactivez-le avec
              « Créer » (même e-mail).
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
                      {c.isAnonymous ? (
                        <div style={{ color: '#6366f1', marginTop: 4, fontSize: 13, fontWeight: 700 }}>
                          Client anonyme (prospect)
                        </div>
                      ) : null}
                      {c.contactName ? (
                        <div style={{ color: '#334155', marginTop: 4, fontWeight: 600 }}>Contact : {c.contactName}</div>
                      ) : c.isAnonymous ? (
                        <div style={{ color: '#64748b', marginTop: 4, fontSize: 13 }}>Contact à saisir sur devis/commande</div>
                      ) : (
                        <div style={{ color: '#b45309', marginTop: 4, fontSize: 13 }}>Contact non renseigné</div>
                      )}
                      <div style={{ color: '#555', marginTop: 4 }}>{c.email}{c.phone ? ` • ${c.phone}` : ''}</div>
                      <div style={{ color: '#475569', marginTop: 6, fontSize: 13 }}>
                        Site commande : <strong>{offersLabel(offerEdits[c.id] || offersFromCompany(c))}</strong>
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          alignItems: 'center'
                        }}
                      >
                        <input
                          placeholder="Nom du contact"
                          value={contactEdits[c.id] ?? c.contactName ?? ''}
                          onChange={(e) =>
                            setContactEdits((p) => ({ ...p, [c.id]: e.target.value }))
                          }
                          style={{ flex: '1 1 200px', minWidth: 160, padding: '6px 8px', borderRadius: 6 }}
                        />
                        <div style={{ flex: '1 1 100%', minWidth: 280 }}>
                          <OfferCheckboxes
                            idPrefix={`co-${c.id}`}
                            value={offerEdits[c.id] || offersFromCompany(c)}
                            onChange={(offers) => setOfferEdits((p) => ({ ...p, [c.id]: offers }))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => saveCompanySettings(c)}
                          style={{ padding: '6px 10px', borderRadius: '8px' }}
                        >
                          Enregistrer
                        </button>
                      </div>
                      <div style={{ color: '#666', marginTop: 4, fontSize: 13 }}>
                        {c.active ? 'Actif' : 'Inactif'}{c.lastLoginAt ? ` • Dernière connexion: ${new Date(c.lastLoginAt).toLocaleString('fr-FR')}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <button onClick={() => sendInvite(c.id)} style={{ padding: '8px 12px', borderRadius: '8px' }}>
                        Envoyer mot de passe
                      </button>
                      <button
                        onClick={() => deleteCompany(c)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #dc2626', color: '#b91c1c', background: '#fff' }}
                      >
                        Supprimer
                      </button>
                      <button
                        onClick={() => permanentlyDeleteCompany(c)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #7f1d1d', color: '#7f1d1d', background: '#fef2f2' }}
                        title="Efface la fiche en base Mongo : l’e-mail redevient disponible pour une nouvelle création"
                      >
                        Effacer de la base (e-mail libéré)
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
                          <textarea
                            placeholder="Description (peut être multi-ligne)"
                            style={{ marginTop: 8, width: '100%', minHeight: 60 }}
                            value={f.description || ''}
                            onChange={(e) => updateFormulaField(mealType, tier, 'description', e.target.value)}
                          />
                          {mealType === 'breakfast' ? (
                            <label style={{ display: 'block', marginTop: 10 }}>
                              <span style={{ fontWeight: 600 }}>Mini-viennoiseries incluses par formule</span>
                              <select
                                style={{ display: 'block', marginTop: 6, padding: '8px 10px', borderRadius: 8, width: '100%' }}
                                value={String(f.miniViennoiserieCountPerFormula ?? 1)}
                                onChange={(e) =>
                                  updateFormulaField(
                                    mealType,
                                    tier,
                                    'miniViennoiserieCountPerFormula',
                                    Number(e.target.value)
                                  )
                                }
                              >
                                <option value="1">1 mini-viennoiserie</option>
                                <option value="2">2 mini-viennoiseries</option>
                                <option value="3">3 mini-viennoiseries</option>
                              </select>
                              <span style={{ display: 'block', marginTop: 4, color: '#666', fontSize: '0.85rem' }}>
                                Ex. 2 inclus × 6 formules = 12 mini-viennoiseries à répartir sur le site de commande.
                              </span>
                            </label>
                          ) : null}
                          <textarea
                            placeholder="Items (1 par ligne) — contenu de référence de la box / formule"
                            style={{ marginTop: 8, width: '100%', minHeight: 90 }}
                            value={Array.isArray(f.items) ? f.items.join('\n') : ''}
                            onChange={(e) => updateFormulaItems(mealType, tier, e.target.value)}
                          />
                          {mealType === 'breakfast' ? (
                            <>
                              <textarea
                                placeholder="Ligne café / thé thermos (affichée au client) — espaces autorisés"
                                style={{ marginTop: 8, width: '100%', minHeight: 44 }}
                                value={f.coffeeTeaLine || ''}
                                onChange={(e) => updateFormulaField(mealType, tier, 'coffeeTeaLine', e.target.value)}
                              />
                              <textarea
                                placeholder="Mini-viennoiseries au choix : 1 ligne = 1 produit (espaces autorisés, ex: « pain chocolat »)"
                                style={{ marginTop: 8, width: '100%', minHeight: 70 }}
                                value={Array.isArray(f.miniViennoiserieOptions) ? f.miniViennoiserieOptions.join('\n') : ''}
                                onChange={(e) => updateFormulaStringList(mealType, tier, 'miniViennoiserieOptions', e.target.value)}
                              />
                              <textarea
                                placeholder="Jus pressés au choix : 1 ligne = 1 jus (espaces autorisés)"
                                style={{ marginTop: 8, width: '100%', minHeight: 60 }}
                                value={Array.isArray(f.juiceOptions) ? f.juiceOptions.join('\n') : ''}
                                onChange={(e) => updateFormulaStringList(mealType, tier, 'juiceOptions', e.target.value)}
                              />
                            </>
                          ) : null}
                          {mealType === 'lunch' ? (
                            <>
                              <label style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={!!f.lunchShowDietCounts}
                                  onChange={(e) => updateFormulaField(mealType, tier, 'lunchShowDietCounts', e.target.checked)}
                                />
                                <span>Proposer les compteurs végétarien / hallal / sans lactose sur le site de commande</span>
                              </label>
                              <div style={{ marginTop: 12, fontWeight: 700, color: '#374151' }}>
                                Produits au choix (comme mini-viennoiseries) — 1 ligne = 1 produit
                              </div>
                              <textarea
                                placeholder="Entrées au choix : 1 ligne = 1 produit"
                                style={{ marginTop: 8, width: '100%', minHeight: 56 }}
                                value={Array.isArray(f.lunchEntreeOptions) ? f.lunchEntreeOptions.join('\n') : ''}
                                onChange={(e) => updateFormulaStringList(mealType, tier, 'lunchEntreeOptions', e.target.value)}
                              />
                              <textarea
                                placeholder="Plats au choix : 1 ligne = 1 produit"
                                style={{ marginTop: 8, width: '100%', minHeight: 56 }}
                                value={Array.isArray(f.lunchPlatOptions) ? f.lunchPlatOptions.join('\n') : ''}
                                onChange={(e) => updateFormulaStringList(mealType, tier, 'lunchPlatOptions', e.target.value)}
                              />
                              <textarea
                                placeholder="Boissons au choix : 1 ligne = 1 produit"
                                style={{ marginTop: 8, width: '100%', minHeight: 56 }}
                                value={Array.isArray(f.lunchBoissonOptions) ? f.lunchBoissonOptions.join('\n') : ''}
                                onChange={(e) => updateFormulaStringList(mealType, tier, 'lunchBoissonOptions', e.target.value)}
                              />
                              <textarea
                                placeholder="Desserts au choix : 1 ligne = 1 produit"
                                style={{ marginTop: 8, width: '100%', minHeight: 56 }}
                                value={Array.isArray(f.lunchDessertOptions) ? f.lunchDessertOptions.join('\n') : ''}
                                onChange={(e) => updateFormulaStringList(mealType, tier, 'lunchDessertOptions', e.target.value)}
                              />
                              <textarea
                                placeholder="Collations au choix : 1 ligne = 1 produit"
                                style={{ marginTop: 8, width: '100%', minHeight: 56 }}
                                value={Array.isArray(f.lunchCollationOptions) ? f.lunchCollationOptions.join('\n') : ''}
                                onChange={(e) => updateFormulaStringList(mealType, tier, 'lunchCollationOptions', e.target.value)}
                              />
                            </>
                          ) : null}
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

