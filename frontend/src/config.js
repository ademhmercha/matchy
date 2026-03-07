/**
 * API base URL. En production (Vercel), définir VITE_API_URL dans les variables d'environnement
 * vers l'URL du backend Render (ex: https://matchy-api.onrender.com).
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
