/**
 * Configuration API dynamique selon le chemin (/lon = Longuenesse, /plan = Arras)
 * Permet d'utiliser le même build pour les deux sites
 */
import { getSiteKey } from './site';

const API_URLS = {
  lon: 'https://boulangerie-planning-api-3.onrender.com/api',   // Longuenesse
  plan: 'https://boulangerie-planning-api-4-pbfy.onrender.com/api' // Arras
};

/** URL API sans espaces parasites (évite /api%20/… en production). */
const normalizeApiBase = (url) => String(url || '').trim().replace(/\/+$/, '');

export const getApiUrl = () => {
  const site = getSiteKey();
  if (site === 'lon') return API_URLS.lon;
  // Arras : URL fixe comme Longuenesse (ne pas dépendre d'une VITE_API_URL mal saisie au build).
  if (import.meta.env.DEV) {
    const fromEnv = normalizeApiBase(import.meta.env.VITE_API_URL);
    if (fromEnv) return fromEnv;
  }
  return API_URLS.plan;
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
  return getSiteKey() === 'lon' ? '_lon' : '_plan';
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
