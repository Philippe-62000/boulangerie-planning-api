import axios from 'axios';
import { getApiUrl } from '../config/apiConfig';

// Configuration d'Axios - URL dynamique selon /lon (Longuenesse) ou /plan (Arras)
const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 120000, // Augmenté à 120 secondes pour Render (mode sleep)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
  (config) => {
    // Chercher le token dans localStorage avec différents noms possibles
    const token = 
      localStorage.getItem('token') ||
      localStorage.getItem('adminToken') ||
      localStorage.getItem('managerToken') ||
      localStorage.getItem('employeeToken');
    
    // Si un token est trouvé, l'ajouter dans les headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token ajouté au header Authorization pour:', config.url);
    } else {
      console.warn('⚠️ Aucun token trouvé dans localStorage pour:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('⚠️ Timeout API - Render en mode sleep, veuillez patienter...');
    } else if (error.response?.status === 401) {
      const errorData = error.response.data;
      
      // Si le token a expiré, nettoyer le localStorage et rediriger vers login
      if (errorData?.expired === true) {
        console.warn('⚠️ Token expiré, redirection vers la page de connexion...');
        // Nettoyer tous les tokens
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('managerToken');
        localStorage.removeItem('employeeToken');
        
        // Déterminer le chemin de login en fonction de l'URL actuelle
        const currentPath = window.location.pathname;
        let loginPath = '/login';
        
        if (currentPath.startsWith('/lon')) {
          loginPath = '/lon/login';
        } else if (currentPath.startsWith('/plan')) {
          loginPath = '/plan/login';
        }
        
        // Rediriger vers la page de login (seulement si on n'y est pas déjà)
        if (currentPath !== loginPath && !currentPath.endsWith('/login')) {
          window.location.href = loginPath;
        }
      } else {
        console.error('Erreur d\'authentification:', errorData?.error || 'Token invalide');
      }
    } else if (error.response?.status >= 500) {
      console.error('Erreur serveur:', error.response.data);
    } else if (!error.response) {
      console.warn('⚠️ Pas de réponse du serveur - Render peut être en mode sleep');
    }
    return Promise.reject(error);
  }
);

export default api;

