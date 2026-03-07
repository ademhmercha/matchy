# Déploiement Matchy

Architecture :

- **React (Frontend)** → **Vercel**
- **Node.js (Backend)** → **Render**
- **Base de données** → **MongoDB Atlas**

---

## 1. MongoDB Atlas

1. Va sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) et crée un cluster (gratuit).
2. **Database Access** → Add User : crée un utilisateur avec mot de passe (note-le).
3. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) pour que Render puisse se connecter.
4. **Database** → Connect → **Drivers** : copie l’URI de connexion.  
   Remplace `<password>` par le mot de passe de l’utilisateur et ajoute le nom de la base si besoin :  
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/matchy?retryWrites=true&w=majority&appName=Cluster0`

Tu utiliseras cet URI comme `MONGO_URI` sur Render.

---

## 2. Backend sur Render

1. Va sur [render.com](https://render.com) et connecte ton dépôt Git (GitHub/GitLab).
2. **New** → **Web Service**.
3. Choisis le repo **matchy**.
4. Configuration :
   - **Root Directory** : `backend`
   - **Runtime** : Node
   - **Build Command** : *(laisser vide ou `npm install`)*
   - **Start Command** : `npm start` ou `node server.js`
   - **Instance Type** : Free (attention : le service s’endort après inactivité)

5. **Environment** : ajoute les variables :

   | Variable        | Valeur |
   |----------------|--------|
   | `MONGO_URI`   | Ton URI MongoDB Atlas (étape 1) |
   | `SESSION_SECRET` | Une chaîne aléatoire longue (ex. générée sur [randomkeygen.com](https://randomkeygen.com)) |
   | `FRONTEND_URL` | L’URL de ton frontend Vercel (ex. `https://matchy.vercel.app`) |

   Ne pas définir `PORT` : Render l’injecte automatiquement.

6. Crée le service. Une fois déployé, note l’URL du backend (ex. `https://matchy-api.onrender.com`).

---

## 3. Frontend sur Vercel

1. Va sur [vercel.com](https://vercel.com) et importe ton repo **matchy**.
2. Configuration du projet :
   - **Root Directory** : `frontend` (clique sur **Edit** et mets `frontend`).
   - **Framework Preset** : Vite (détecté automatiquement).
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

3. **Environment Variables** : ajoute :

   | Variable        | Valeur |
   |----------------|--------|
   | `VITE_API_URL` | L’URL du backend Render (ex. `https://matchy-api.onrender.com`) |

   Optionnel : `VITE_GIPHY_API_KEY` si tu utilises les GIFs.

4. Déploie. Note l’URL du frontend (ex. `https://matchy.vercel.app`).

---

## 4. Boucler la configuration

1. **Render** : dans les variables d’environnement du backend, mets à jour `FRONTEND_URL` avec l’URL réelle de Vercel (ex. `https://matchy.vercel.app`), puis redéploie si besoin.
2. **Vercel** : vérifie que `VITE_API_URL` pointe bien vers l’URL Render (sans slash final).

---

## 5. Résumé des URLs

- **Frontend** : `https://ton-projet.vercel.app`
- **Backend** : `https://ton-projet.onrender.com`
- En local, le frontend utilise `http://localhost:5000` si `VITE_API_URL` n’est pas défini ; le backend utilise `http://localhost:5173` pour `FRONTEND_URL` si non défini.

---

## Dépannage

- **CORS / Socket.io** : le backend utilise `FRONTEND_URL` pour autoriser uniquement ton front Vercel. Vérifie qu’il n’y a pas de faute de frappe ni d’espace.
- **Render Free** : le service peut mettre 30–60 s à se réveiller après inactivité ; les premières requêtes peuvent être lentes.
- **Cookies / sessions** : en production les cookies de session sont envoyés entre Vercel et Render ; `credentials: true` et CORS sont déjà configurés côté backend.
