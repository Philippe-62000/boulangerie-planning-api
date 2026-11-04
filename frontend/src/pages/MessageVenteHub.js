import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MessageVenteHub.css';

const MessageVenteHub = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="mv-hub">
      <header className="mv-hub-header">
        <h1>Message</h1>
        <p>Choisissez le type de message à envoyer.</p>
      </header>
      <div className="mv-hub-cards">
        <Link to="/message-vente/imprimer" className="mv-hub-card">
          <span className="mv-hub-icon">🖨️</span>
          <h2>Message à Imprimer</h2>
          <p>Le texte est imprimé sur l’imprimante des commandes (ticket caisse).</p>
        </Link>
        {isAdmin() && (
          <Link to="/message-vente/diffuser" className="mv-hub-card">
            <span className="mv-hub-icon">📢</span>
            <h2>Message à Diffuser</h2>
            <p>Note de service envoyée aux salariés, à lire et signer sur leur espace.</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default MessageVenteHub;
