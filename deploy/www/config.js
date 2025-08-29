// Configuration pour deploiement frontend uniquement sur OVH
window.APP_CONFIG = {
  // URL de l'API via proxy local
  API_URL: '/api',
  
  // Configuration de l'application
  APP_NAME: 'Planning Boulangerie',
  APP_VERSION: '1.0.0',
  
  // Configuration du sous-dossier
  BASE_PATH: '/plan',
  
  // Configuration des horaires d'ouverture
  BUSINESS_HOURS: {
    start: '06:00',
    end: '20:30',
    breakThreshold: 5.5,
    breakDuration: 30
  },
  
  // Configuration des besoins en personnel
  STAFF_REQUIREMENTS: {
    0: { morning: { staff: 1 }, afternoon: { staff: 2 } },
    2: { morning: { staff: 2 }, afternoon: { staff: 3 } },
    4: { morning: { staff: 3 }, afternoon: { staff: 4 } }
  }
};
