import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md z-50 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_investparla/artifacts/pu93i0x2_ChatGPT%20Image%20Nov%209%2C%202025%2C%2008_35_50%20PM.png" 
              alt="ParlaCapital Logo" 
              className="h-16 w-auto object-contain cursor-pointer rounded-xl"
              onClick={() => navigate('/')}
            />
            <div className="hidden md:flex space-x-6">
              <button 
                onClick={() => navigate('/')} 
                className="text-gray-300 hover:text-amber-400 transition-colors font-medium"
              >
                Ana Sayfa
              </button>
              <button 
                onClick={() => navigate('/about')} 
                className="text-gray-300 hover:text-amber-400 transition-colors font-medium"
              >
                Hakkımızda
              </button>
              <button 
                onClick={() => navigate('/packages')} 
                className="text-gray-300 hover:text-amber-400 transition-colors font-medium"
              >
                Paketler
              </button>
              <button 
                onClick={() => navigate('/earning-systems')} 
                className="text-gray-300 hover:text-amber-400 transition-colors font-medium"
              >
                Kazanç Sistemleri
              </button>
              <button 
                onClick={() => navigate('/faq')} 
                className="text-gray-300 hover:text-amber-400 transition-colors font-medium"
              >
                SSS
              </button>
              <button 
                onClick={() => navigate('/contact')} 
                className="text-gray-300 hover:text-amber-400 transition-colors font-medium"
              >
                İletişim
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline" 
                  className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                  data-testid="nav-dashboard-button"
                >
                  Panelim
                </Button>
                {user.is_admin && (
                  <Button 
                    onClick={() => navigate('/admin')} 
                    variant="outline" 
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                    data-testid="nav-admin-button"
                  >
                    Admin
                  </Button>
                )}
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                  data-testid="nav-logout-button"
                >
                  Çıkış
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  const REDIRECT_URL = 'https://investparla.preview.emergentagent.com/dashboard';
                  const AUTH_URL = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(REDIRECT_URL)}`;
                  window.location.href = AUTH_URL;
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-full font-semibold"
                data-testid="nav-login-button"
              >
                Giriş Yap
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
