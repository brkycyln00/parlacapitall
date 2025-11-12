import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthModal({ open, onClose, onSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  // Referral code validation
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralValid, setReferralValid] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [uplineName, setUplineName] = useState('');

  // Check for referral code in URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      validateReferralCode(ref);
    }
  }, [location]);
  
  // Validate referral code with debounce
  React.useEffect(() => {
    if (!referralCode || referralCode.length < 3) {
      setReferralValid(false);
      setReferralError('');
      setUplineName('');
      return;
    }
    
    const timer = setTimeout(() => {
      validateReferralCode(referralCode);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [referralCode]);
  
  const validateReferralCode = async (code) => {
    if (!code || code.length < 3) return;
    
    setReferralValidating(true);
    setReferralError('');
    
    try {
      const response = await axios.get(`${API}/auth/validate-referral/${code}`);
      
      if (response.data.valid) {
        setReferralValid(true);
        setReferralError('');
        setUplineName(response.data.upline_name);
      } else {
        setReferralValid(false);
        setReferralError('Yanlış referans kodu girdiniz!');
        setUplineName('');
      }
    } catch (error) {
      setReferralValid(false);
      setReferralError('Yanlış referans kodu girdiniz!');
      setUplineName('');
    } finally {
      setReferralValidating(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });

      // Store token in localStorage
      localStorage.setItem('auth_token', response.data.token);
      
      toast.success('Giriş başarılı!');
      
      if (onSuccess) {
        onSuccess(response.data.user);
      }
      
      onClose();
      
      // Reload to update auth state
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerEmail || !registerPassword || !registerName) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (!referralCode) {
      toast.error('Referans kodu zorunludur. Lütfen davet eden kişinin kodunu girin.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, {
        email: registerEmail,
        password: registerPassword,
        name: registerName,
        referral_code: referralCode
      });

      // Store token in localStorage
      localStorage.setItem('auth_token', response.data.token);
      
      // Show success with upline info
      if (response.data.user.upline) {
        toast.success(
          `Kayıt başarılı! ${response.data.user.upline.name} ağına eklendiniz.`,
          { duration: 5000 }
        );
      } else {
        toast.success('Kayıt başarılı!');
      }
      
      if (onSuccess) {
        onSuccess(response.data.user);
      }
      
      onClose();
      
      // Redirect to packages page
      setTimeout(() => {
        window.location.href = '/packages';
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-amber-500/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl text-center">ParlaCapital</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700">
            <TabsTrigger value="login" className="data-[state=active]:bg-amber-500">
              Giriş Yap
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-amber-500">
              Kayıt Ol
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300">E-posta</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="bg-slate-700 border-amber-500/30 text-white mt-2"
                  data-testid="login-email-input"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">Şifre</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700 border-amber-500/30 text-white mt-2"
                  data-testid="login-password-input"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-6 text-lg font-bold"
                data-testid="login-submit-button"
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300">Ad Soyad</Label>
                <Input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="bg-slate-700 border-amber-500/30 text-white mt-2"
                  data-testid="register-name-input"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">E-posta</Label>
                <Input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="bg-slate-700 border-amber-500/30 text-white mt-2"
                  data-testid="register-email-input"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">Şifre (En az 6 karakter)</Label>
                <Input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700 border-amber-500/30 text-white mt-2"
                  data-testid="register-password-input"
                  required
                  minLength={6}
                />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <Label className="text-amber-400 font-semibold">
                  Referans Kodu {referralCode ? '(Otomatik)' : '(Zorunlu)'}
                </Label>
                <Input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Referans kodunu girin"
                  className="bg-slate-700 border-amber-500/50 text-white mt-2 font-mono text-lg"
                  data-testid="register-referral-input"
                  required
                  readOnly={!!referralCode}
                />
                {referralCode ? (
                  <p className="text-green-400 text-sm mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Referans kodu geçerli
                  </p>
                ) : (
                  <p className="text-gray-400 text-xs mt-2">
                    Davet eden kişinin referans kodunu girin. Kayıt için zorunludur.
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-6 text-lg font-bold"
                data-testid="register-submit-button"
              >
                {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center text-sm text-gray-400">
          <p>veya</p>
          <Button
            onClick={() => {
              const REDIRECT_URL = `${process.env.REACT_APP_BASE_URL}/dashboard`;
              const AUTH_URL = `${process.env.REACT_APP_AUTH_URL}/?redirect=${encodeURIComponent(REDIRECT_URL)}`;
              window.location.href = AUTH_URL;
            }}
            variant="outline"
            className="w-full mt-3 border-blue-500 text-blue-400 hover:bg-blue-500/10"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Giriş Yap
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
