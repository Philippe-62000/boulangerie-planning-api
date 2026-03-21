/**
 * Configuration API dynamique selon le chemin (/lon = Longuenesse, /plan = Arras)
 * Permet d'utiliser le même build pour les deux sites
 */
const API_URLS = {
  lon: 'https://boulangerie-planning-api-3.onrender.com/api',   // Longuenesse
  plan: 'https://boulangerie-planning-api-4-pbfy.onrender.com/api' // Arras
};

export const getApiUrl = () => {
  const path = window.location.pathname;
  if (path.startsWith('/lon')) {
    return API_URLS.lon;
  }
  return import.meta.env.VITE_API_URL || API_URLS.plan;
};

/**
 * Clé MongoDB (`city`) pour commandes en ligne + OAuth Google Sheets.
 * Les `OnlineOrderLink` et `GoogleOAuthToken` sont historiquement enregistrés sous
 * `longuenesse` (une seule école), sur les deux déploiements api-3 et api-4.
 * Ne pas dériver depuis /plan vs /lon : sinon on lit un autre document (ou un jeton vide)
 * et l’API Sheets renvoie « insufficient authentication scopes ».
 */
export const getOnlineOrdersCity = () => 'longuenesse';

/** Suffixe pour stocker les tokens par site (évite conflit Longuenesse/Arras) */
export const getTokenStorageSuffix = () => {
  const path = window.location.pathname;
  return path.startsWith('/lon') ? '_lon' : '_plan';
};

/** Récupère le token pour le site actuel */
export const getStoredToken = () => {
  const s = getTokenStorageSuffix();
  return (
    localStorage.getItem(`token${s}`) ||
    localStorage.getItem(`adminToken${s}`) ||
    localStorage.getItem(`managerToken${s}`) ||
    localStorage.getItem(`employeeToken${s}`) ||
    // Fallback pour compatibilité avec tokens existants (sans suffixe)
    localStorage.getItem('token') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('managerToken') ||
    localStorage.getItem('employeeToken')
  );
};

/** Stocke le token pour le site actuel */
export const setStoredToken = (token) => {
  const s = getTokenStorageSuffix();
  localStorage.setItem(`token${s}`, token);
  localStorage.setItem(`adminToken${s}`, token);
};

/** Stocke le token employé pour le site actuel */
export const setStoredEmployeeToken = (token) => {
  const s = getTokenStorageSuffix();
  localStorage.setItem(`token${s}`, token);
  localStorage.setItem(`employeeToken${s}`, token);
};

/** Supprime tous les tokens du site actuel */
export const clearStoredTokens = () => {
  const s = getTokenStorageSuffix();
  ['token', 'adminToken', 'managerToken', 'employeeToken'].forEach((key) => {
    localStorage.removeItem(`${key}${s}`);
    localStorage.removeItem(key); // ancien format
  });
};
