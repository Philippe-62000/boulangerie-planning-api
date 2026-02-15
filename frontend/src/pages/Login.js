import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

import { getApiUrl } from '../config/apiConfig';
const API_URL = getApiUrl();

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [maintenance, setMaintenance] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const checkMaintenance = async () => {
      if (!window.location.pathname.startsWith('/lon')) return;
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
        // Stocker le token JWT
        localStorage.setItem('token', data.token);
        localStorage.setItem('adminToken', data.token);
        
        // Stocker aussi les infos utilisateur pour le contexte React
        const userRole = {
          role: 'admin',
          name: 'Administrateur',
          permissions: ['all']
        };
        login(userRole);
        navigate('/');
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
        // Stocker le token JWT
        localStorage.setItem('token', data.token);
        localStorage.setItem('employeeToken', data.token);
        
        // Stocker aussi les infos utilisateur pour le contexte React
        const userRole = {
          role: data.user.role,
          name: data.user.name,
          permissions: data.user.permissions || ['view_planning', 'view_absences', 'view_sales_stats', 'view_meal_expenses', 'view_km_expenses']
        };
        login(userRole);
        navigate('/');
      } else {
        setError(data.error || 'Erreur lors de la connexion');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setError('Erreur de connexion au serveur');
    }
  };

  const handleKeyPress = (e, loginFunction) => {
    if (e.key === 'Enter') {
      loginFunction();
    }
  };

  const isLonguenesse = window.location.pathname.startsWith('/lon');
  const showMaintenanceMessage = isLonguenesse && maintenance && !showAdminAccess;

  if (isLonguenesse && loadingMaintenance) {
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
        </div>
      </div>
    </div>
  );
};

export default Login;
