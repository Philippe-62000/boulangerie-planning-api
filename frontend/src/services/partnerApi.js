import axios from 'axios';

/**
 * API Commandes entreprises (Solution C): hébergée sur Vercel (serverless + DB),
 * indépendante de Render.
 *
 * Par défaut: on prend VITE_PARTNER_API_URL (ex: https://commande-longuenesse.vercel.app)
 */
const PARTNER_BASE = (import.meta.env.VITE_PARTNER_API_URL || '').replace(/\/$/, '');

export const partnerApi = axios.create({
  baseURL: PARTNER_BASE ? `${PARTNER_BASE}/api` : '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

partnerApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token_lon') ||
    localStorage.getItem('adminToken_lon') ||
    localStorage.getItem('managerToken_lon') ||
    localStorage.getItem('employeeToken_lon') ||
    localStorage.getItem('token') ||
    localStorage.getItem('adminToken') ||
    localStorage.getItem('managerToken') ||
    localStorage.getItem('employeeToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default partnerApi;

