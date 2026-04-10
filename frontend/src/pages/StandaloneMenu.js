import React from 'react';
import { Link } from 'react-router-dom';
import './StandaloneMenu.css';

/**
 * Menu standalone : accès rapide aux pages terrain (véhicule, crédit compte client).
 * URL : /menu-standalone ou /menu-standalone.html (sous /lon/ ou /plan/)
 */
const StandaloneMenu = () => {
  const siteLabel =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/lon')
      ? 'Longuenesse'
      : 'Arras';

  return (
    <div className="standalone-menu-page">
      <div className="standalone-menu-card">
        <header className="standalone-menu-header">
          <h1>Menu terrain</h1>
          <p className="standalone-menu-site">{siteLabel}</p>
          <p className="standalone-menu-intro">Choisissez une application à ouvrir sur ce téléphone.</p>
        </header>

        <nav className="standalone-menu-nav" aria-label="Applications terrain">
          <Link className="standalone-menu-link standalone-menu-link--vehicle" to="/vehicle-standalone">
            <span className="standalone-menu-icon" aria-hidden="true">
              🚗
            </span>
            <span className="standalone-menu-text">
              <span className="standalone-menu-title">Véhicule</span>
              <span className="standalone-menu-desc">Départ, retour, km, destinations</span>
            </span>
            <span className="standalone-menu-chevron" aria-hidden="true">
              ›
            </span>
          </Link>

          <Link className="standalone-menu-link standalone-menu-link--compte" to="/compte-client-standalone">
            <span className="standalone-menu-icon" aria-hidden="true">
              💳
            </span>
            <span className="standalone-menu-text">
              <span className="standalone-menu-title">Crédit compte client</span>
              <span className="standalone-menu-desc">Encaissement, signature client</span>
            </span>
            <span className="standalone-menu-chevron" aria-hidden="true">
              ›
            </span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default StandaloneMenu;
