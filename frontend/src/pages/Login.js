import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

import { getApiUrl, setStoredToken, setStoredEmployeeToken } from '../config/apiConfig';
const API_URL = getApiUrl();

/** Après login, chemin React sous le basename (/lon ou /plan), ex. /compte-client-standalone */
function getPostLoginPath(searchParams) {
  const raw = searchParams.get('returnUrl');
  if (!raw) return '/';
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.includes('://') || decoded.startsWith('//')) return '/';
    const base = window.location.pathname.startsWith('/lon') ? '/lon' : '/plan';
    if (decoded.startsWith(base)) {
      const rest = decoded.slice(base.length) || '/';
      return rest.startsWith('/') ? rest : `/${rest}`;
    }
  } catch {
    /* */
  }
  return '/';
}

const Login = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [saleCode, setSaleCode] = useState('');
  const [error, setError] = useState('');
  const [maintenance, setMaintenance] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const navigateAfterLogin = useCallback(() => {
    const p = getPostLoginPath(searchParams);
    navigate(p, { replace: true });
  }, [navigate, searchParams]);

  useEffect(() => {
    const checkMaintenance = async () => {
      const path = window.location.pathname;
      if (!path.startsWith('/lon') && !path.startsWith('/plan')) return;
      try {
        const res = await fetch(`${API_URL}/parameters/maintenance`);
        const data = await res.json();
        setMaintenance(data.maintenance === true);
      } catch {
        setMaintenance(false);
      } finally {
        setLoadingMaintenance(false);
      }
    };
    checkMaintenance();
  }, []);

  const handleAdminLogin = async () => {
    if (password !== 'admin2024') {
      setError('Mot de passe administrateur incorrect');
      return;
    }

    try {
      // Appel API pour obtenir un token JWT
      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.success && data.token) {
        setStoredToken(data.token);
        // Stocker aussi les infos utilisateur pour le contexte React
        const userRole = {
          role: 'admin',
          name: 'Administrateur',
          permissions: ['all']
        };
        login(userRole);
        navigateAfterLogin();
      } else {
        setError(data.error || 'Erreur lors de la connexion');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const handleEmployeeLogin = async () => {
    try {
      // Appel API pour obtenir un token JWT
      const response = await fetch(`${API_URL}/auth/employee-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.success && data.token) {
        setStoredEmployeeToken(data.token);
        // Stocker aussi les infos utilisateur pour le contexte React
        const userRole = {
          role: data.user.role,
          name: data.user.name,
          permissions: data.user.permissions || ['view_planning', 'view_absences', 'view_sales_stats', 'view_meal_expenses', 'view_km_expenses']
        };
        login(userRole);
        navigateAfterLogin();
      } else {
        setError(data.error || 'Erreur lors de la connexion');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const handleSaleCodeLogin = async () => {
    const digits = String(saleCode).replace(/\D/g, '').slice(0, 3);
    if (digits.length !== 3) {
      setError('Saisissez les 3 chiffres du code vendeuse');
      return;
    }
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/login-by-sale-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleCode: digits.padStart(3, '0') })
      });
      const data = await response.json();
      if (data.success && data.token) {
        setStoredEmployeeToken(data.token);
        const userRole = {
          role: data.user.role,
          name: data.user.name,
          permissions: data.user.permissions || [
            'view_planning',
            'view_absences',
            'view_sales_stats',
            'view_meal_expenses',
            'view_km_expenses'
          ]
        };
        login(userRole);
        navigateAfterLogin();
      } else {
        setError(data.error || 'Code vendeuse incorrect');
      }
    } catch (err) {
      console.error(err);
      setError('Erreur de connexion au serveur');
    }
  };

  const handleKeyPress = (e, loginFunction) => {
    if (e.key === 'Enter') {
      loginFunction();
    }
  };

  const isPlanningSite = window.location.pathname.startsWith('/lon') || window.location.pathname.startsWith('/plan');
  const showMaintenanceMessage = isPlanningSite && maintenance && !showAdminAccess;

  if (isPlanningSite && loadingMaintenance) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading-maintenance">
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showMaintenanceMessage) {
    return (
      <div className="login-container">
        <div className="login-card maintenance-card">
          <div className="logo-section">
            <div className="logo">
              <div className="logo-animals">
                <div className="orca"></div>
                <div className="fox"></div>
              </div>
              <h1 className="logo-text">FILMARA</h1>
              <p className="logo-subtitle">HOLDING COMPANY • & TWO BAKERS</p>
            </div>
          </div>
          <div className="maintenance-message">
            <h2>🔧 Site en maintenance</h2>
            <p>Le site est temporairement indisponible.</p>
            <p><strong>Retour à la normale rapidement.</strong></p>
            <p className="maintenance-sub">Merci de votre compréhension.</p>
            <button 
              type="button"
              className="admin-access-link"
              onClick={() => setShowAdminAccess(true)}
            >
              Accès administrateur
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-animals">
              <div className="orca"></div>
              <div className="fox"></div>
            </div>
            <h1 className="logo-text">FILMARA</h1>
            <p className="logo-subtitle">HOLDING COMPANY • & TWO BAKERS</p>
          </div>
        </div>
        
        <div className="login-section">
          <h2>Connexion au Planning</h2>
          
          <div className="password-input">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAdminLogin)}
              className="password-field"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="login-buttons">
            <button 
              onClick={handleAdminLogin}
              className="login-btn admin-btn"
              disabled={!password}
            >
              <span className="btn-icon">👑</span>
              Administrateur
            </button>
            
            <button 
              onClick={handleEmployeeLogin}
              className="login-btn employee-btn"
              disabled={!password}
            >
              <span className="btn-icon">👤</span>
              Salarié
            </button>
          </div>

          <div className="login-info">
            <p><strong>Administrateur :</strong> Accès complet à toutes les fonctionnalités</p>
            <p><strong>Salarié :</strong> Accès limité aux fonctions de consultation et saisie</p>
          </div>

          <div className="login-section login-sale-code">
            <h3>Code vendeuse</h3>
            <p className="login-sale-hint">
              Pour la page <strong>Crédit compte client</strong> ou la caisse : connectez-vous avec votre{' '}
              <strong>code à 3 chiffres</strong> (identique au code sur les tickets de vente).
            </p>
            <div className="password-input login-sale-input">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="ex. 042"
                maxLength={3}
                value={saleCode}
                onChange={(e) => setSaleCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onKeyPress={(e) => e.key === 'Enter' && handleSaleCodeLogin()}
                className="password-field"
              />
            </div>
            <button type="button" onClick={handleSaleCodeLogin} className="login-btn sale-code-btn" disabled={saleCode.replace(/\D/g, '').length !== 3}>
              <span className="btn-icon">🏷️</span>
              Connexion code vendeuse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
