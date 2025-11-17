import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from '@/components/ui/button';
import AuthModal from './AuthModal';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuth();
  const { language } = useLanguage();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                {t(language, 'nav.home')}
              </button>
              <button 
                onClick={() => navigate('/about')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                {t(language, 'nav.about')}
              </button>
              <button 
                onClick={() => navigate('/packages')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                {t(language, 'nav.packages')}
              </button>
              <button 
                onClick={() => navigate('/earning-systems')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                {t(language, 'nav.earningSystems')}
              </button>
              <button 
                onClick={() => navigate('/faq')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                {t(language, 'nav.faq')}
              </button>
              <button 
                onClick={() => navigate('/contact')} 
                className="text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
              >
                {t(language, 'nav.contact')}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    variant="outline" 
                    className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                    data-testid="nav-dashboard-button"
                  >
                    {t(language, 'nav.dashboard')}
                  </Button>
                  {user.is_admin && (
                    <Button 
                      onClick={() => navigate('/admin')} 
                      variant="outline" 
                      className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                      data-testid="nav-admin-button"
                    >
                      {t(language, 'nav.admin')}
                    </Button>
                  )}
                  <Button 
                    onClick={logout} 
                    variant="outline" 
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                    data-testid="nav-logout-button"
                  >
                    {t(language, 'nav.logout')}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-full font-semibold"
                  data-testid="nav-login-button"
                >
                  {t(language, 'nav.login')}
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <button 
              onClick={() => { navigate('/'); setMobileMenuOpen(false); }} 
              className="block w-full text-left text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
            >
              {t(language, 'nav.home')}
            </button>
            <button 
              onClick={() => { navigate('/about'); setMobileMenuOpen(false); }} 
              className="block w-full text-left text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
            >
              {t(language, 'nav.about')}
            </button>
            <button 
              onClick={() => { navigate('/packages'); setMobileMenuOpen(false); }} 
              className="block w-full text-left text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
            >
              {t(language, 'nav.packages')}
            </button>
            <button 
              onClick={() => { navigate('/earning-systems'); setMobileMenuOpen(false); }} 
              className="block w-full text-left text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
            >
              {t(language, 'nav.earningSystems')}
            </button>
            <button 
              onClick={() => { navigate('/faq'); setMobileMenuOpen(false); }} 
              className="block w-full text-left text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
            >
              {t(language, 'nav.faq')}
            </button>
            <button 
              onClick={() => { navigate('/contact'); setMobileMenuOpen(false); }} 
              className="block w-full text-left text-white hover:text-amber-400 transition-all font-bold px-4 py-2 rounded-lg hover:bg-slate-800/70"
            >
              {t(language, 'nav.contact')}
            </button>

            {/* Mobile Auth Buttons */}
            <div className="border-t border-amber-500/30 pt-3 mt-3 space-y-2">
              {user ? (
                <>
                  <Button 
                    onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {t(language, 'nav.dashboard')}
                  </Button>
                  {user.is_admin && (
                    <Button 
                      onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }} 
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      {t(language, 'nav.admin')}
                    </Button>
                  )}
                  <Button 
                    onClick={() => { logout(); setMobileMenuOpen(false); }} 
                    variant="outline"
                    className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    {t(language, 'nav.logout')}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                >
                  {t(language, 'nav.login')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onSuccess={checkAuth}
      />
    </nav>
  );
}
