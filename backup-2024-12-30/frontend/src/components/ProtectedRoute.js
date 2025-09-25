import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredPermission = null, adminOnly = false }) => {
  const { user, hasPermission, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Chargement...
      </div>
    );
  }

  // Rediriger vers la page de login si pas connecté
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier si l'accès est réservé aux administrateurs
  if (adminOnly && !isAdmin()) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '20px'
        }}>🚫</div>
        <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>
          Accès refusé
        </h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Cette page est réservée aux administrateurs.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  // Vérifier les permissions spécifiques
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '20px'
        }}>🔒</div>
        <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>
          Permission insuffisante
        </h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  // Accès autorisé
  return children;
};

export default ProtectedRoute;
