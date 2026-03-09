import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MainApp from './pages/MainApp';
import ChatApp from './pages/ChatApp';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import UserProfileModal from './components/UserProfileModal';
import { useState } from 'react';
import './index.css';

function App() {
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);

  const handleShowProfile = (userId) => {
    setSelectedProfileUserId(userId);
  };

  return (
    <AuthProvider>
    <SocketProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar onShowProfile={handleShowProfile} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/app" element={<MainApp />} />
              <Route path="/chat" element={<ChatApp onShowProfile={handleShowProfile} />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          {selectedProfileUserId && (
            <UserProfileModal
              userId={selectedProfileUserId}
              onClose={() => setSelectedProfileUserId(null)}
              onUnmatch={() => {
                // Could refresh data here if needed
                setSelectedProfileUserId(null);
                window.location.reload(); // Simple way to refresh lists everywhere
              }}
            />
          )}
        </div>
      </BrowserRouter>
    </SocketProvider>
    </AuthProvider>
  );
}

export default App;
