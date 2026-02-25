import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Ambassadeur.css';

const Ambassadeur = () => {
  const [ambassadors, setAmbassadors] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ambassadors');

  // Formulaire nouvel ambassadeur
  const [formAmbassador, setFormAmbassador] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    couponValidityDays: 30
  });
  const [savingAmbassador, setSavingAmbassador] = useState(false);

  // Formulaire nouveau client parrainé
  const [formClient, setFormClient] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    ambassadorCode: ''
  });
  const [savingClient, setSavingClient] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ambRes, clientRes] = await Promise.all([
        api.get('/ambassadors/ambassadors'),
        api.get('/ambassadors/clients')
      ]);
      if (ambRes.data?.success) {
        setAmbassadors(ambRes.data.data || []);
      }
      if (clientRes.data?.success) {
        setClients(clientRes.data.data || []);
      }
    } catch (e) {
      console.error('Erreur chargement ambassadeurs:', e);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAmbassador = async (e) => {
    e.preventDefault();
    if (!formAmbassador.firstName?.trim() || !formAmbassador.lastName?.trim() || !formAmbassador.phone?.trim()) {
      toast.error('Nom, prénom et téléphone requis');
      return;
    }
    setSavingAmbassador(true);
    try {
      const res = await api.post('/ambassadors/ambassadors', formAmbassador);
      if (res.data.success) {
        toast.success('Ambassadeur créé avec le code ' + res.data.data.code);
        setFormAmbassador({ firstName: '', lastName: '', phone: '', email: '', couponValidityDays: 30 });
        fetchData();
      } else {
        toast.error(res.data.error || 'Erreur');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSavingAmbassador(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!formClient.firstName?.trim() || !formClient.lastName?.trim() || !formClient.phone?.trim() || !formClient.ambassadorCode?.trim()) {
      toast.error('Nom, prénom, téléphone et code ambassadeur requis');
      return;
    }
    setSavingClient(true);
    try {
      const res = await api.post('/ambassadors/clients', formClient);
      if (res.data.success) {
        toast.success('Client parrainé créé');
        setFormClient({ firstName: '', lastName: '', phone: '', ambassadorCode: '' });
        fetchData();
      } else {
        toast.error(res.data.error || 'Erreur');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSavingClient(false);
    }
  };

  const toggleGiftClaimed = async (client) => {
    try {
      const res = await api.put(`/ambassadors/clients/${client._id}`, {
        giftClaimed: !client.giftClaimed
      });
      if (res.data.success) fetchData();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const toggleGiftReceived = async (client) => {
    try {
      const res = await api.put(`/ambassadors/clients/${client._id}`, {
        giftReceived: !client.giftReceived
      });
      if (res.data.success) fetchData();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const deleteAmbassador = async (id) => {
    if (!window.confirm('Supprimer cet ambassadeur ?')) return;
    try {
      await api.delete(`/ambassadors/ambassadors/${id}`);
      toast.success('Ambassadeur supprimé');
      fetchData();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const deleteClient = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    try {
      await api.delete(`/ambassadors/clients/${id}`);
      toast.success('Client supprimé');
      fetchData();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const toggleSmsSent = async (ambassador) => {
    try {
      const res = await api.put(`/ambassadors/ambassadors/${ambassador._id}`, {
        smsSent: !ambassador.smsSent
      });
      if (res.data.success) fetchData();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleSendSms = async () => {
    const toSend = ambassadors.filter(a => a.phone?.trim() && !a.smsSent);
    if (toSend.length === 0) {
      toast.error('Aucun ambassadeur sans SMS envoyé (avec numéro de téléphone)');
      return;
    }
    if (!window.confirm(`Envoyer le message de bienvenue à ${toSend.length} ambassadeur(s) n'ayant pas encore reçu le SMS ?`)) return;
    setSendingSms(true);
    try {
      const res = await api.post('/ambassadors/ambassadors/send-sms');
      if (res.data?.success) {
        const { sent, failed, total } = res.data.data || {};
        if (failed > 0) {
          toast.warning(`${sent}/${total} SMS envoyés. ${failed} échec(s).`);
        } else {
          toast.success(`${sent} SMS envoyé(s) aux ambassadeurs`);
        }
      } else {
        toast.error(res.data?.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi des SMS');
    } finally {
      setSendingSms(false);
    }
  };

  const regenerateAmbassadorCode = async (ambassador, withSms = false) => {
    const msg = withSms
      ? `Régénérer le code et renvoyer le SMS avec le nouveau code à ${ambassador.firstName} ?`
      : `Régénérer le code de ${ambassador.firstName} ?`;
    if (!window.confirm(msg)) return;
    setRegeneratingId(ambassador._id);
    try {
      const res = await api.post(`/ambassadors/ambassadors/${ambassador._id}/regenerate-code`, { resendSms: withSms });
      if (res.data.success) {
        toast.success(`Code régénéré : ${res.data.data.newCode}${res.data.data.smsResult === 'envoyé' ? ' - SMS envoyé' : ''}`);
        fetchData();
      } else {
        toast.error(res.data.error || 'Erreur');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setRegeneratingId(null);
    }
  };

  const resendSmsAmbassador = async (ambassador) => {
    if (!ambassador.phone?.trim()) {
      toast.error('Aucun numéro de téléphone');
      return;
    }
    if (!window.confirm(`Renvoyer le SMS avec le code actuel (${ambassador.code}) à ${ambassador.firstName} ?`)) return;
    setRegeneratingId(ambassador._id);
    try {
      const res = await api.post(`/ambassadors/ambassadors/${ambassador._id}/resend-sms`);
      if (res.data.success) {
        toast.success('SMS envoyé');
        fetchData();
      } else {
        toast.error(res.data.error || 'Erreur');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setRegeneratingId(null);
    }
  };

  const regenerateCoupon = async (client) => {
    if (!window.confirm('Régénérer un nouveau coupon valide pour ce client ?')) return;
    try {
      const res = await api.post(`/ambassadors/clients/${client._id}/regenerate-coupon`);
      if (res.data.success) {
        toast.success('Coupon régénéré');
        fetchData();
      } else {
        toast.error(res.data.error || 'Erreur');
      }
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const getCouponExpiryText = (c) => {
    if (!c.couponExpiresAt) return '-';
    const exp = new Date(c.couponExpiresAt);
    const now = new Date();
    if (exp < now) {
      const days = Math.ceil((now - exp) / (24 * 60 * 60 * 1000));
      return `Expiré depuis ${days} j`;
    }
    const days = Math.ceil((exp - now) / (24 * 60 * 60 * 1000));
    return `Valide ${days} j`;
  };

  const goToAmbassador = (code) => {
    const a = ambassadors.find(amb => amb.code === code);
    if (a) {
      setActiveTab('ambassadors');
      document.getElementById(`amb-${a._id}`)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="ambassadeur-page">
        <div className="ambassadeur-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="ambassadeur-page">
      <div className="ambassadeur-header">
        <h1>⭐ Programme Ambassadeur</h1>
      </div>

      <div className="ambassadeur-tabs">
        <button
          className={activeTab === 'ambassadors' ? 'active' : ''}
          onClick={() => setActiveTab('ambassadors')}
        >
          Ambassadeurs
        </button>
        <button
          className={activeTab === 'clients' ? 'active' : ''}
          onClick={() => setActiveTab('clients')}
        >
          Clients parrainés
        </button>
      </div>

      {activeTab === 'ambassadors' && (
        <div className="ambassadeur-section">
          <div className="ambassadeur-card">
            <h2>Nouvel ambassadeur</h2>
            <p className="ambassadeur-hint">Le code client unique est généré automatiquement.</p>
            <form onSubmit={handleCreateAmbassador} className="ambassadeur-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Prénom *"
                  value={formAmbassador.firstName}
                  onChange={e => setFormAmbassador({ ...formAmbassador, firstName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Nom *"
                  value={formAmbassador.lastName}
                  onChange={e => setFormAmbassador({ ...formAmbassador, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="tel"
                  placeholder="Téléphone *"
                  value={formAmbassador.phone}
                  onChange={e => setFormAmbassador({ ...formAmbassador, phone: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formAmbassador.email}
                  onChange={e => setFormAmbassador({ ...formAmbassador, email: e.target.value })}
                />
              </div>
              <div className="form-row form-row-with-label">
                <label className="ambassadeur-field-label">Durée de validité du coupon</label>
                <input
                  type="number"
                  placeholder="Jours *"
                  min={1}
                  value={formAmbassador.couponValidityDays || ''}
                  onChange={e => setFormAmbassador({ ...formAmbassador, couponValidityDays: parseInt(e.target.value, 10) || 30 })}
                />
              </div>
              <button type="submit" disabled={savingAmbassador}>
                {savingAmbassador ? 'Création...' : 'Créer l\'ambassadeur'}
              </button>
            </form>
          </div>

          <div className="ambassadeur-list">
            <div className="ambassadeur-list-header">
              <h2>Liste des ambassadeurs</h2>
              {ambassadors.some(a => a.phone?.trim() && !a.smsSent) && (
                <button
                  type="button"
                  className="btn-send-sms"
                  onClick={handleSendSms}
                  disabled={sendingSms}
                  title="Envoyer le message de bienvenue aux ambassadeurs n'ayant pas encore reçu le SMS"
                >
                  {sendingSms ? 'Envoi...' : `📱 Envoyer SMS bienvenue (${ambassadors.filter(a => a.phone?.trim() && !a.smsSent).length})`}
                </button>
              )}
            </div>
            {ambassadors.length === 0 ? (
              <p className="ambassadeur-empty">Aucun ambassadeur.</p>
            ) : (
              <table className="ambassadeur-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Code client</th>
                    <th>Clients parrainés</th>
                    <th>Durée validité</th>
                    <th>Cadeaux retirés</th>
                    <th>SMS envoyé</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ambassadors.map(a => (
                    <tr key={a._id} id={`amb-${a._id}`}>
                      <td>{a.firstName} {a.lastName}</td>
                      <td>{a.phone}</td>
                      <td>{a.email || '-'}</td>
                      <td><strong>{a.code}</strong></td>
                      <td><strong>{a.clientsCount ?? 0}</strong></td>
                      <td>{a.couponValidityDays ?? 30} j</td>
                      <td><strong>{a.giftsRetiredCount ?? 0}</strong></td>
                      <td>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!a.smsSent}
                            onChange={() => toggleSmsSent(a)}
                            title="Coché = SMS de bienvenue déjà envoyé"
                          />
                          Oui
                        </label>
                      </td>
                      <td className="amb-actions">
                        <button
                          type="button"
                          className="btn-regenerate"
                          onClick={() => regenerateAmbassadorCode(a, false)}
                          disabled={regeneratingId === a._id}
                          title="Régénérer le code uniquement"
                        >
                          {regeneratingId === a._id ? '...' : '🔄'}
                        </button>
                        <button
                          type="button"
                          className="btn-regenerate-sms"
                          onClick={() => regenerateAmbassadorCode(a, true)}
                          disabled={regeneratingId === a._id}
                          title="Régénérer le code et renvoyer le SMS"
                        >
                          {regeneratingId === a._id ? '...' : '🔄+SMS'}
                        </button>
                        <button
                          type="button"
                          className="btn-resend-sms"
                          onClick={() => resendSmsAmbassador(a)}
                          disabled={regeneratingId === a._id || !a.phone?.trim()}
                          title="Renvoyer le SMS avec le code actuel"
                        >
                          📱
                        </button>
                        <button type="button" className="btn-delete" onClick={() => deleteAmbassador(a._id)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="ambassadeur-section">
          <div className="ambassadeur-card">
            <h2>Nouveau client parrainé</h2>
            <p className="ambassadeur-hint">Saisissez le code ambassadeur du client qui a parrainé.</p>
            <form onSubmit={handleCreateClient} className="ambassadeur-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Prénom *"
                  value={formClient.firstName}
                  onChange={e => setFormClient({ ...formClient, firstName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Nom *"
                  value={formClient.lastName}
                  onChange={e => setFormClient({ ...formClient, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="tel"
                  placeholder="Téléphone *"
                  value={formClient.phone}
                  onChange={e => setFormClient({ ...formClient, phone: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Code ambassadeur *"
                  value={formClient.ambassadorCode}
                  onChange={e => setFormClient({ ...formClient, ambassadorCode: (e.target.value || '').toUpperCase() })}
                  list="ambassador-codes"
                  required
                />
                <datalist id="ambassador-codes">
                  {ambassadors.map(a => (
                    <option key={a._id} value={a.code} />
                  ))}
                </datalist>
              </div>
              <button type="submit" disabled={savingClient}>
                {savingClient ? 'Création...' : 'Créer le client'}
              </button>
            </form>
          </div>

          <div className="ambassadeur-list">
            <h2>Liste des clients parrainés</h2>
            {clients.length === 0 ? (
              <p className="ambassadeur-empty">Aucun client parrainé.</p>
            ) : (
              <table className="ambassadeur-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>Code ambassadeur</th>
                    <th>Coupon</th>
                    <th>Bonus reçu</th>
                    <th>Cadeau retiré</th>
                    <th>Saisi par</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c._id}>
                      <td>{c.firstName} {c.lastName}</td>
                      <td>{c.phone}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-link-code"
                          onClick={() => goToAmbassador(c.ambassadorCode)}
                          title="Voir l'ambassadeur"
                        >
                          {c.ambassadorCode}
                        </button>
                      </td>
                      <td title={c.couponRegeneratedCount ? `Régénéré ${c.couponRegeneratedCount} fois` : ''}>
                        <span className={c.couponExpiresAt && new Date(c.couponExpiresAt) < new Date() ? 'text-danger' : ''}>
                          {getCouponExpiryText(c)}
                        </span>
                        {!c.giftReceived && (
                          <button type="button" className="btn-regenerate" onClick={() => regenerateCoupon(c)} title="Régénérer un coupon valide">
                            Régénérer
                          </button>
                        )}
                      </td>
                      <td>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!c.giftReceived}
                            onChange={() => toggleGiftReceived(c)}
                          />
                          Bonus bénéficié
                        </label>
                      </td>
                      <td>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!c.giftClaimed}
                            onChange={() => toggleGiftClaimed(c)}
                          />
                          Cadeau retiré
                        </label>
                      </td>
                      <td title={c.giftClaimedByName ? `Retiré par: ${c.giftClaimedByName}` : (c.giftReceivedByName ? `Bonus par: ${c.giftReceivedByName}` : '')}>
                        {c.recordedByName || '-'}
                      </td>
                      <td>
                        <button type="button" className="btn-delete" onClick={() => deleteClient(c._id)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Ambassadeur;
