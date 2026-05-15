import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/apiConfig';

/**
 * Autorise l’accès à une page selon la permission menu (API /menu-permissions),
 * en plus du fait d’être connecté. Les admins passent toujours.
 */
const MenuPermissionGate = ({ menuId, children }) => {
  const { user, isAdmin } = useAuth();
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!user) {
      setState('denied');
      return;
    }
    if (isAdmin()) {
      setState('ok');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${getApiUrl()}/menu-permissions?role=${user.role}`);
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          if (!cancelled) setState('denied');
          return;
        }
        const data = await response.json();
        const list = data.success && Array.isArray(data.menuPermissions) ? data.menuPermissions : [];
        const allowed = list.some((p) => p.menuId === menuId);
        if (!cancelled) setState(allowed ? 'ok' : 'denied');
      } catch {
        if (!cancelled) setState('denied');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, menuId]);

  if (state === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '40vh',
          fontSize: '1.1rem',
          color: '#666',
        }}
      >
        Chargement...
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚫</div>
        <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>Accès refusé</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Cette page n&apos;est pas accessible avec votre compte.
        </p>
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  return children;
};

export default MenuPermissionGate;
