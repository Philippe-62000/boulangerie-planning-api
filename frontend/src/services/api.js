import axios from 'axios';

// Configuration d'Axios - Appel vers l'API locale sur OVH
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://boulangerie-planning-api-3.onrender.com/api',
  timeout: 60000, // Augmenté à 60 secondes pour Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Gérer l'authentification si nécessaire
      console.error('Erreur d\'authentification');
    } else if (error.response?.status >= 500) {
      console.error('Erreur serveur:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;

