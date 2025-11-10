import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from '@/components/ui/button';
import AuthModal from './AuthModal';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-slate-900/95 backdrop-blur-md z-50 border-b border-amber-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_investparla/artifacts/pu93i0x2_ChatGPT%20Image%20Nov%209%2C%202025%2C%2008_35_50%20PM.png" 
              alt="ParlaCapital Logo" 
              className="h-10 w-auto object-contain cursor-pointer rounded-lg"
              onClick={() => navigate('/')}
            />
            <div className="hidden md:flex space-x-3">
              <button 
                onClick={() => navigate('/')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70 whitespace-nowrap"
              >
                Ana Sayfa
              </button>
              <button 
                onClick={() => navigate('/about')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                Hakkımızda
              </button>
              <button 
                onClick={() => navigate('/packages')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                Paketler
              </button>
              <button 
                onClick={() => navigate('/crypto-market')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                Kripto Piyasası
              </button>
              <button 
                onClick={() => navigate('/earning-systems')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                Kazanç Sistemleri
              </button>
              <button 
                onClick={() => navigate('/faq')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                SSS
              </button>
              <button 
                onClick={() => navigate('/contact')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
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
                onClick={() => setAuthModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-full font-semibold"
                data-testid="nav-login-button"
              >
                Giriş Yap
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onSuccess={checkAuth}
      />
    </nav>
  );
}
