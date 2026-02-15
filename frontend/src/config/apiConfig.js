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
