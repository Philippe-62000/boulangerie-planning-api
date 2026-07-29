import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getSiteKey } from '../config/site';
import './MessageVente.css';

const AUDIENCES = [
  { id: 'tous', label: 'Pour tous' },
  { id: 'vente', label: 'Pour la Vente' },
  { id: 'vendeuse_matin', label: 'Pour la vendeuse du matin' },
  { id: 'vendeuse_soir', label: 'Pour la vendeuse du soir' },
  { id: 'prepa', label: 'Pour les Prépa' },
  { id: 'boulangers', label: 'Pour les boulangers' }
];

const MessageVente = () => {
  const [audience, setAudience] = useState('tous');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) {
      toast.error('Saisissez le contenu du message');
      return;
    }
    setSending(true);
    try {
      const site = getSiteKey() === 'lon' ? 'longuenesse' : 'arras';
      const res = await api.post('/staff-print-messages', {
        site,
        audience,
        message: text
      });
      if (res.data?.success) {
        toast.success(
          res.data.message ||
            'Message envoyé : impression sur l’imprimante des commandes sous environ une minute.'
        );
        setMessage('');
      } else {
        toast.error(res.data?.error || 'Erreur lors de l’envoi');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Erreur lors de l’envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-vente-page">
      <header className="message-vente-header">
        <h1>Message</h1>
        <p>
          Le message sera imprimé sur l’imprimante des commandes entreprises (ticket caisse).
        </p>
      </header>

      <form className="message-vente-form" onSubmit={handleSend}>
        <label className="message-vente-field">
          <span>Pour qui</span>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={sending}
          >
            {AUDIENCES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="message-vente-field">
          <span>Contenu du message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrire ou coller le texte du message…"
            rows={12}
            maxLength={4000}
            disabled={sending}
          />
          <small>{message.length} / 4000</small>
        </label>

        <div className="message-vente-actions">
          <button type="submit" className="btn btn-primary" disabled={sending || !message.trim()}>
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageVente;
