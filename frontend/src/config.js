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

/**
 * Convertit un chemin relatif d'upload (/uploads/...) en URL absolue vers le backend Render.
 * Les URLs déjà absolues (http...) sont retournées telles quelles.
 */
export const getPhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${SOCKET_URL}${url}`;
};
