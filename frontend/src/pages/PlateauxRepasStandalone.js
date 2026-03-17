import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';
import './PlateauxRepasStandalone.css';

const STEPS = {
  LOGIN: 'login',
  WELCOME: 'welcome',
  DATE: 'date',
  DATE_PICK: 'date_pick',
  FORMULE: 'formule',
  OPTIONS: 'options',
  PERSONNALISATION: 'personnalisation',
  QUANTITE: 'quantite',
  QUANTITE_INPUT: 'quantite_input',
  FORFAIT_INSTALLATION: 'forfait_installation',
  RECAP: 'recap',
  CONFIRMED: 'confirmed'
};

const FORFAITS_INSTALLATION = [
  { nbTables: 1, prix: 10, label: '1 table + nappes (10€)' },
  { nbTables: 2, prix: 12, label: '2 tables + nappes (12€)' },
  { nbTables: 3, prix: 15, label: '3 tables + nappes (15€)' }
];

const API_URLS = {
  lon: 'https://boulangerie-planning-api-3.onrender.com/api',
  plan: 'https://boulangerie-planning-api-4-pbfy.onrender.com/api'
};

const getSite = () => (window.location.pathname.startsWith('/lon') ? 'lon' : 'plan');
const getApi = () => API_URLS[getSite()] || getApiUrl();

const PlateauxRepasStandalone = () => {
  const site = getSite();
  const apiBase = getApi();
  const [step, setStep] = useState(STEPS.LOGIN);
  const [customDate, setCustomDate] = useState('');
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState(localStorage.getItem(`plateauxToken_${site}`));
  const [client, setClient] = useState(null);
  const [botData, setBotData] = useState({ produits: [], formules: [] });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await axios.get(`${apiBase}/meal-reservations/bot-data`, { params: { site } });
        setBotData(r.data?.data || { produits: [], formules: [] });
      } catch (e) {
        console.error(e);
        setBotData({ produits: [], formules: [] });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiBase, site]);

  useEffect(() => {
    if (token && client && step === STEPS.LOGIN) {
      setStep(STEPS.WELCOME);
      addBotMessage(`Bonjour ${client.nom} ! Que souhaitez-vous faire ?`, [
        { label: 'Nouvelle réservation', action: () => goToStep(STEPS.DATE) },
        { label: 'Voir mes réservations', action: () => showMyReservations() }
      ]);
    }
  }, [token, client]);

  const addBotMessage = (text, quickReplies = []) => {
    setMessages((m) => [...m, { type: 'bot', text, quickReplies }]);
  };

  const addUserMessage = (text) => {
    setMessages((m) => [...m, { type: 'user', text }]);
  };

  const goToStep = (s) => {
    setStep(s);
    if (s === STEPS.DATE) {
      addBotMessage('Pour quelle date souhaitez-vous réserver ?', [
        { label: 'Demain', action: () => selectDate(tomorrow()) },
        { label: 'Choisir une date', action: () => { setStep(STEPS.DATE_PICK); addBotMessage('Sélectionnez une date :', []); } }
      ]);
    } else if (s === STEPS.FORMULE) {
      const cards = (botData.formules || []).map((f) => ({
        label: `${f.nom} - ${f.prix}€`,
        action: () => selectFormule(f)
      }));
      addBotMessage('Quelle formule souhaitez-vous ?', cards.length ? cards : [{ label: 'Aucune formule disponible', action: () => {} }]);
    } else if (s === STEPS.QUANTITE) {
      addBotMessage('Combien de plateaux ?', [
        { label: '1', action: () => selectQuantite(1) },
        { label: '2', action: () => selectQuantite(2) },
        { label: '5', action: () => selectQuantite(5) },
        { label: '10', action: () => selectQuantite(10) },
        { label: 'Autre nombre', action: () => { setStep(STEPS.QUANTITE_INPUT); addBotMessage('Entrez le nombre de plateaux :', []); } }
      ]);
    } else if (s === STEPS.FORFAIT_INSTALLATION) {
      const cards = FORFAITS_INSTALLATION.map((f) => ({
        label: f.label,
        action: () => selectForfaitInstallation(f)
      }));
      addBotMessage('Souhaitez-vous un forfait installation (tables + nappes) ?', [
        ...cards,
        { label: 'Non, merci', action: () => selectForfaitInstallation(null) }
      ]);
    }
  };

  const today = () => new Date().toISOString().split('T')[0];
  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [reservation, setReservation] = useState({
    date: null,
    formule: null,
    optionsChoisies: {},
    produitsAjoutes: [],
    produitsRetires: [],
    quantite: 1,
    forfaitInstallation: null // { nbTables: 1|2|3, prix: 10|12|15 }
  });

  const selectDate = (dateStr) => {
    setReservation((r) => ({ ...r, date: dateStr }));
    addUserMessage(new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
    addBotMessage('Date enregistrée !');
    setTimeout(() => goToStep(STEPS.FORMULE), 600);
  };

  const selectFormule = (formule) => {
    setReservation((r) => ({ ...r, formule }));
    addUserMessage(formule.nom);
    const opts = (formule.options || []).filter((o) => o.valeurs?.length);
    if (opts.length) {
      setStep(STEPS.OPTIONS);
      const first = opts[0];
      addBotMessage(
        `Option : ${first.nom}`,
        first.valeurs.map((v) => ({
          label: v,
          action: () => {
            setReservation((r) => ({ ...r, optionsChoisies: { ...r.optionsChoisies, [first.nom]: v } }));
            addUserMessage(v);
            if (opts.length === 1) {
              addBotMessage('Options enregistrées !');
              setTimeout(() => goToStep(STEPS.QUANTITE), 600);
            } else {
              const nextOpt = opts[1];
              addBotMessage(`Option : ${nextOpt.nom}`, nextOpt.valeurs.map((v2) => ({
                label: v2,
                action: () => {
                  setReservation((r) => ({ ...r, optionsChoisies: { ...r.optionsChoisies, [nextOpt.nom]: v2 } }));
                  addUserMessage(v2);
                  addBotMessage('Options enregistrées !');
                  setTimeout(() => goToStep(STEPS.QUANTITE), 600);
                }
              })));
            }
          }
        }))
      );
    } else {
      addBotMessage('Formule sélectionnée !');
      setTimeout(() => goToStep(STEPS.QUANTITE), 600);
    }
  };

  const selectQuantite = (q) => {
    setReservation((r) => ({ ...r, quantite: q }));
    addUserMessage(`${q} plateau(x)`);
    goToStep(STEPS.FORFAIT_INSTALLATION);
  };

  const selectForfaitInstallation = (forfait) => {
    setReservation((r) => ({ ...r, forfaitInstallation: forfait }));
    if (forfait) {
      addUserMessage(forfait.label);
    } else {
      addUserMessage('Sans forfait installation');
    }
    addBotMessage('Parfait ! Voici le récapitulatif.', [
      { label: 'Confirmer', action: () => showRecap() },
      { label: 'Modifier', action: () => { setStep(STEPS.WELCOME); addBotMessage('Reprenons depuis le début.'); } }
    ]);
  };

  const showRecap = () => {
    setStep(STEPS.RECAP);
    const r = reservation;
    const dateStr = r.date ? new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '-';
    const prixFormule = (r.formule?.prix || 0) * (r.quantite || 1);
    const prixForfait = r.forfaitInstallation?.prix || 0;
    const total = prixFormule + prixForfait;
    let recap = `📅 ${dateStr}\n📋 ${r.formule?.nom || '-'} : ${r.formule?.prix || 0}€ x ${r.quantite || 1} = ${prixFormule.toFixed(2)}€`;
    if (r.forfaitInstallation) {
      recap += `\n🪑 Forfait installation : ${r.forfaitInstallation.label} = ${prixForfait}€`;
    }
    recap += `\n💰 Total : ${total.toFixed(2)}€`;
    addBotMessage(recap, [
      { label: '✓ Confirmer la réservation', action: () => confirmReservation() },
      { label: 'Annuler', action: () => { setStep(STEPS.WELCOME); addBotMessage('Réservation annulée.'); } }
    ]);
  };

  const confirmReservation = async () => {
    setSending(true);
    setError('');
    try {
      await axios.post(
        `${apiBase}/meal-reservations/reservations`,
        {
          site,
          date: reservation.date,
          formuleId: reservation.formule?._id,
          optionsChoisies: reservation.optionsChoisies,
          produitsAjoutes: reservation.produitsAjoutes,
          produitsRetires: reservation.produitsRetires,
          quantite: reservation.quantite,
          forfaitInstallation: reservation.forfaitInstallation
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStep(STEPS.CONFIRMED);
      addBotMessage('✅ Réservation enregistrée ! Un email de confirmation vous a été envoyé. Merci et à bientôt !');
      setReservation({ date: null, formule: null, optionsChoisies: {}, produitsAjoutes: [], produitsRetires: [], quantite: 1, forfaitInstallation: null });
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur lors de la réservation');
      addBotMessage('❌ Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  const showMyReservations = async () => {
    addUserMessage('Voir mes réservations');
    try {
      const r = await axios.get(`${apiBase}/meal-reservations/my-reservations`, {
        params: { site },
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = r.data?.data || [];
      if (list.length === 0) {
        addBotMessage('Vous n\'avez aucune réservation.');
      } else {
        const text = list.slice(0, 5).map((res) => {
          const d = new Date(res.date).toLocaleDateString('fr-FR');
          return `• ${d} - ${res.formuleId?.nom || '-'} x${res.quantite}`;
        }).join('\n');
        addBotMessage(`Vos réservations :\n${text}`);
      }
    } catch (e) {
      addBotMessage('Erreur lors du chargement.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const login = form.login?.value?.trim();
    const password = form.password?.value;
    if (!login || !password) {
      setError('Login et mot de passe requis');
      return;
    }
    setError('');
    setSending(true);
    try {
      const r = await axios.post(`${apiBase}/meal-reservations/client-login`, { login, password, site });
      const t = r.data?.token;
      const c = r.data?.client;
      if (t && c) {
        setToken(t);
        setClient(c);
        localStorage.setItem(`plateauxToken_${site}`, t);
        setStep(STEPS.WELCOME);
        addBotMessage(`Bonjour ${c.nom} ! Que souhaitez-vous faire ?`, [
          { label: 'Nouvelle réservation', action: () => goToStep(STEPS.DATE) },
          { label: 'Voir mes réservations', action: () => showMyReservations() }
        ]);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Identifiants incorrects');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setClient(null);
    setMessages([]);
    setStep(STEPS.LOGIN);
    setReservation({ date: null, formule: null, optionsChoisies: {}, produitsAjoutes: [], produitsRetires: [], quantite: 1, forfaitInstallation: null });
    localStorage.removeItem(`plateauxToken_${site}`);
  };

  if (loading) {
    return (
      <div className="plateaux-standalone">
        <div className="plateaux-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="plateaux-standalone">
      <header className="plateaux-header-standalone">
        <div className="plateaux-logo">
          <span className="plateaux-logo-text">Boulangerie Ange</span>
          <span className="plateaux-logo-halo">◠</span>
        </div>
        <p className="plateaux-subtitle">Réservation plateaux repas</p>
        <span className="plateaux-site">{site === 'lon' ? 'Longuenesse' : 'Arras'}</span>
        {token && (
          <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
        )}
      </header>

      {step === STEPS.LOGIN ? (
        <div className="plateaux-login">
          <h2>Connexion</h2>
          <p>Connectez-vous pour réserver vos plateaux repas.</p>
          <form onSubmit={handleLogin}>
            <input name="login" type="text" placeholder="Login" required />
            <input name="password" type="password" placeholder="Mot de passe" required />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" disabled={sending}>{sending ? 'Connexion...' : 'Se connecter'}</button>
          </form>
        </div>
      ) : (
        <div className="plateaux-chat">
          <div className="plateaux-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.type}`}>
                <div className="message-bubble">
                  <span className="message-text">{msg.text}</span>
                  {msg.quickReplies?.length > 0 && (
                    <div className="quick-replies">
                      {msg.quickReplies.map((qr, j) => (
                        <button
                          key={j}
                          className="quick-reply"
                          onClick={() => qr.action?.()}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {step === STEPS.DATE_PICK && (
            <div className="message bot">
              <div className="message-bubble">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={tomorrow()}
                />
                <button
                  className="quick-reply"
                  onClick={() => {
                    if (customDate) {
                      selectDate(customDate);
                      setStep(STEPS.FORMULE);
                    }
                  }}
                >
                  Valider
                </button>
              </div>
            </div>
          )}
          {step === STEPS.QUANTITE_INPUT && (
            <div className="message bot">
              <div className="message-bubble">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={reservation.quantite}
                  onChange={(e) => setReservation((r) => ({ ...r, quantite: parseInt(e.target.value, 10) || 1 }))}
                  placeholder="Nombre"
                />
                <button
                  className="quick-reply"
                  onClick={() => {
                    const q = reservation.quantite || 1;
                    addUserMessage(`${q} plateau(x)`);
                    goToStep(STEPS.FORFAIT_INSTALLATION);
                  }}
                >
                  Valider
                </button>
              </div>
            </div>
          )}
          {sending && (
              <div className="message bot">
                <div className="message-bubble">
                  <span className="typing">...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlateauxRepasStandalone;
