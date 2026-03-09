/**
 * API base URL for HTTP requests.
 * En production (Vercel), laisser vide → les requêtes /api/* sont proxiées vers Render via vercel.json.
 * En local, pointe vers le backend local.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

/**
 * URL directe du backend pour Socket.io (doit pointer directement vers Render, pas via le proxy).
 */
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
