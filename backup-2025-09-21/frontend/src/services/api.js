import axios from 'axios';

// Configuration d'Axios - Appel vers l'API locale sur OVH
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://boulangerie-planning-api-4.onrender.com/api',
  timeout: 120000, // Augmenté à 120 secondes pour Render (mode sleep)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('⚠️ Timeout API - Render en mode sleep, veuillez patienter...');
    } else if (error.response?.status === 401) {
      console.error('Erreur d\'authentification');
    } else if (error.response?.status >= 500) {
      console.error('Erreur serveur:', error.response.data);
    } else if (!error.response) {
      console.warn('⚠️ Pas de réponse du serveur - Render peut être en mode sleep');
    }
    return Promise.reject(error);
  }
);

export default api;

