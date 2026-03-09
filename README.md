# Matchy — Premium Dating Application

A full-stack dating platform built with the MERN stack, featuring real-time messaging, video/audio calls, swipe-based matching, and a comprehensive admin dashboard. Deployed on **Vercel** (frontend), **Render** (backend), and **MongoDB Atlas** (database).

---

## Features

### Matching & Discovery
- **Swipe Interface** — Intuitive like/pass system with animated card deck
- **Rich Profiles** — Multiple photos, bio, and interest tags
- **Mutual Matching** — Instant match notification via Socket.io when two users like each other

### Real-Time Communication
- **Live Chat** — Instant messaging between matched users powered by Socket.io
- **Voice Messages** — Record and send audio notes directly in chat
- **Video & Audio Calls** — Peer-to-peer calls via WebRTC (SimplePeer)
- **Live Notifications** — In-app toast notifications for new matches and activity

### Admin Dashboard
- **Analytics** — Real-time user growth, match, and activity statistics
- **User Management** — Ban/unban users, review reported content
- **Audit Logs** — Full log of critical administrative actions
- **Reporting System** — Users can report profiles with evidence/photos

### Global Experience
- **Multilingual (i18n)** — Fully localized in **English** and **French** via i18next
- **Responsive Design** — Optimized for both mobile and desktop
- **Premium UI** — Glassmorphism effects, smooth animations, dark theme

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7, Axios |
| Styling | Vanilla CSS with custom design system |
| i18n | i18next, react-i18next |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Auth | JWT (JSON Web Tokens), bcrypt |
| Real-time | Socket.io v4 |
| Video/Audio | WebRTC (SimplePeer) |
| File Upload | Multer |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas |

---

## Architecture

```
Browser
  │
  ├── Vercel (React SPA)
  │     └── /api/* → proxied to Render backend (vercel.json rewrite)
  │
  └── Render (Express API + Socket.io)
        └── MongoDB Atlas (data + sessions)
```

**Authentication**: Stateless JWT stored in `localStorage`, sent via `Authorization: Bearer` header on every request. This bypasses cross-domain cookie restrictions when frontend and backend are on separate domains.

**Real-time**: Socket.io connects directly to the Render backend URL (not through the Vercel proxy), enabling bidirectional events for chat, calls, and notifications.

---

## Local Development

### Prerequisites
- Node.js v18+
- MongoDB (local) or a MongoDB Atlas connection string

### 1. Clone the repository
```bash
git clone https://github.com/your-username/matchy.git
cd matchy
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/matchy
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Deployment

### Frontend — Vercel

1. Connect your GitHub repository to Vercel
2. Set the **Root Directory** to `frontend`
3. Add environment variables:
   ```
   VITE_API_URL=   (leave empty to use the Vercel proxy)
   VITE_SOCKET_URL=https://your-render-app.onrender.com
   ```
4. Deploy — Vercel uses `vercel.json` to proxy `/api/*` requests to Render and handle SPA routing

### Backend — Render

1. Create a new **Web Service** pointing to the `backend/` directory
2. Set the **Start Command** to `npm start`
3. Add environment variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_jwt_secret
   SESSION_SECRET=your_session_secret
   FRONTEND_URL=https://your-app.vercel.app
   ```

### Database — MongoDB Atlas

1. Create a free cluster on [MongoDB Atlas](https://cloud.mongodb.com)
2. Whitelist `0.0.0.0/0` in Network Access (or Render's IP range)
3. Copy the connection string into `MONGODB_URI`

### Creating an Admin Account

After registering a normal account, update the user role directly in MongoDB Atlas:
```
users collection → find your user → set role: "admin"
```

---

## Project Structure

```
matchy/
├── backend/
│   ├── controllers/        # Business logic (auth, users, messages, admin)
│   ├── models/             # Mongoose schemas (User, Message, Match, Report)
│   ├── routes/             # Express route definitions
│   ├── utils/              # JWT auth middleware, helpers
│   ├── uploads/            # User-uploaded photos (served statically)
│   ├── socketManager.js    # Socket.io event handlers
│   └── server.js           # App entry point
└── frontend/
    ├── public/
    └── src/
        ├── components/     # Navbar, Chat, Notification, UserProfileModal, etc.
        ├── context/        # AuthContext (JWT), SocketContext (Socket.io)
        ├── pages/          # Home, Login, Register, MainApp, ChatApp, Profile, Admin
        ├── locales/        # i18n translation files (en, fr)
        ├── config.js       # API_URL, SOCKET_URL, getPhotoUrl helper
        └── main.jsx        # App entry + axios JWT interceptor
```

---

## License

MIT
