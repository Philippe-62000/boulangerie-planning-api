import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAdminLogin = () => {
    if (password === 'admin2024') {
      const userRole = {
        role: 'admin',
        name: 'Administrateur',
        permissions: ['all']
      };
      login(userRole);
      navigate('/');
    } else {
      setError('Mot de passe administrateur incorrect');
    }
  };

  const handleEmployeeLogin = () => {
    if (password === 'salarie2024') {
      const userRole = {
        role: 'employee',
        name: 'Salarié',
        permissions: ['view_planning', 'view_absences', 'view_sales_stats', 'view_meal_expenses', 'view_km_expenses']
      };
      login(userRole);
      navigate('/');
    } else {
      setError('Mot de passe salarié incorrect');
    }
  };

  const handleKeyPress = (e, loginFunction) => {
    if (e.key === 'Enter') {
      loginFunction();
    }
  };

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
