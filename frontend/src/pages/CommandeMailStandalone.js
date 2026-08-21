import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CommandeMail from './CommandeMail';

const CommandeMailStandalone = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif', color: '#555' }}>
        Chargement…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent('/commande-mail-standalone')}`}
        replace
      />
    );
  }

  return <CommandeMail standalone />;
};

export default CommandeMailStandalone;
