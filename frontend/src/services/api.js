import axios from 'axios';

// Configuration d'Axios - Appel vers l'API locale sur OVH
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://boulangerie-planning-api-4-pbfy.onrender.com/api',
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
      console.error('Erreur d\'authentification');
      // Optionnel : rediriger vers la page de login
      // window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      console.error('Erreur serveur:', error.response.data);
    } else if (!error.response) {
      console.warn('⚠️ Pas de réponse du serveur - Render peut être en mode sleep');
    }
    return Promise.reject(error);
  }
);

export default api;

