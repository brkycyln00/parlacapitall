import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Use current domain for API calls (works for both preview and custom domain)
const BACKEND_URL = window.location.origin;
const API = `${BACKEND_URL}/api`;

// Axios interceptor for JWT token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Context
const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for JWT token
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API}/auth/me`, { 
        withCredentials: true,
        headers
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
      // Clear invalid token
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('auth_token');
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem('auth_token');
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Auth Handler
function AuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, checkAuth } = useAuth();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      const hash = location.hash;
      
      if (hash && hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        
        if (sessionId && !processing) {
          setProcessing(true);
          
          try {
            await axios.post(
              `${API}/auth/session`,
              {},
              {
                headers: { 'X-Session-ID': sessionId },
                withCredentials: true
              }
            );
            
            await checkAuth();
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/dashboard');
          } catch (error) {
            console.error('Auth error:', error);
            toast.error('Giriş başarısız oldu');
            navigate('/');
          } finally {
            setProcessing(false);
          }
        }
      }
    };

    handleAuth();
  }, [location]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Giriş yapılıyor...</p>
        </div>
      </div>
    );
  }

  return null;
}

// Protected Route
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;

  return children;
}

// Import Pages
import React from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Packages from './pages/Packages';
import About from './pages/About';
import EarningSystems from './pages/EarningSystems';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import CryptoMarket from './pages/CryptoMarket';
import VerifyEmail from './pages/VerifyEmail';
import ConfirmPasswordChange from './pages/ConfirmPasswordChange';
import { LanguageProvider } from './contexts/LanguageContext';
import LanguageSwitcher from './components/LanguageSwitcher';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="App">
          <BrowserRouter>
            <AuthHandler />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/crypto-market" element={<CryptoMarket />} />
              <Route path="/earning-systems" element={<EarningSystems />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/confirm-password-change" element={<ConfirmPasswordChange />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <LanguageSwitcher />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
export { useAuth, API };