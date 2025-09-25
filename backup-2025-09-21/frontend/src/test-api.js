import api from './services/api';

// Test de la configuration API
console.log('=== TEST CONFIGURATION API ===');
console.log('baseURL:', api.defaults.baseURL);
console.log('timeout:', api.defaults.timeout);
console.log('headers:', api.defaults.headers);

// Test d'appel API
export const testAPI = async () => {
  try {
    console.log('Test d\'appel vers:', api.defaults.baseURL + '/employees');
    const response = await api.get('/employees');
    console.log('✅ API OK:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    console.error('URL appelée:', error.config?.url);
    throw error;
  }
};

export default testAPI;
