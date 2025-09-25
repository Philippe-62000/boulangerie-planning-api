import React from 'react';
import { Link } from 'react-router-dom';
import './SickLeaveHome.css';

const SickLeaveHome = () => {
  return (
    <div className="sick-leave-home">
      <div className="home-container">
        <div className="home-header">
          <h1>🏥 Arrêts Maladie</h1>
          <p>Envoyez votre arrêt maladie en toute sécurité</p>
        </div>

        <div className="home-content">
          <div className="info-card">
            <h2>📋 Comment envoyer votre arrêt maladie ?</h2>
            <ol>
              <li>Remplissez le formulaire avec vos informations</li>
              <li>Scannez ou photographiez votre arrêt maladie</li>
              <li>Envoyez le fichier (JPG ou PDF)</li>
              <li>Recevez une confirmation</li>
            </ol>
          </div>

          <div className="requirements-card">
            <h2>✅ Exigences</h2>
            <ul>
              <li>Fichier JPG ou PDF uniquement</li>
              <li>Taille maximum : 10MB</li>
              <li>Document lisible et de bonne qualité</li>
              <li>Dates de début et fin d'arrêt</li>
            </ul>
          </div>

          <div className="security-card">
            <h2>🔒 Sécurité</h2>
            <ul>
              <li>Vos données sont chiffrées</li>
              <li>Stockage sécurisé sur notre serveur</li>
              <li>Accès restreint aux administrateurs</li>
              <li>Conformité RGPD</li>
            </ul>
          </div>
        </div>

        <div className="action-section">
          <Link to="/sick-leave-upload" className="upload-button">
            📤 Envoyer mon arrêt maladie
          </Link>
        </div>

        <div className="contact-info">
          <h3>📞 Besoin d'aide ?</h3>
          <p>Contactez votre responsable ou l'administration</p>
        </div>
      </div>
    </div>
  );
};

export default SickLeaveHome;
