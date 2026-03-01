# Matchy - Premium Dating Application

Matchy is a full-stack, professional dating platform built with the MERN stack. It features a modern, smooth interface with glassmorphism aesthetics and advanced communication features.

##  Key Features

###  Matching & Discovery
- **Swipe Interface**: Intuitive like/nope system inspired by top dating apps.
- **Rich Profiles**: Users can upload multiple photos, list interests, and share their story.
- **Smart Discovery**: Algorithm-based profile suggestions.

###  Advanced Communication
- **Real-time Chat**: Instance messaging powered by Socket.io.
- **Voice Messages**: Record and send audio notes directly in the chat.
- **Video & Audio Calls**: Integrated high-quality calling via WebRTC.

###  Admin Dashboard
- **Comprehensive Analytics**: Real-time stats on user growth and activity.
- **Audit Logs**: Full monitoring of critical system actions.
- **User Management**: Tools to review reports, ban/unban users, and manage content.
- **Reporting System**: Professional reporting flow with evidence/photo support.

###  Global Experience
- **Multilingual (i18n)**: Fully localized in **English** and **French**.
- **Responsive Design**: Optimized for both mobile and desktop experiences.
- **Premium UI**: Glassmorphism effects, smooth animations, and a curated color palette.

##  Tech Stack

- **Frontend**: React.js, Vite, Axios, i18next, Vanilla CSS (Custom System).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Real-time**: Socket.io.
- **Signaling**: WebRTC for Audio/Video calls.

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/ademhmercha/matchy.git
cd matchy
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
SESSION_SECRET=your_secret
```
Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```




