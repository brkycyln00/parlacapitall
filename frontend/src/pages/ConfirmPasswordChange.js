import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Use current domain for API calls
const API = `${window.location.origin}/api`;

export default function ConfirmPasswordChange() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Geçersiz onay linki');
      setLoading(false);
      return;
    }

    confirmPasswordChange(token);
  }, [searchParams]);

  const confirmPasswordChange = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/confirm-password-change/${token}`);
      
      setConfirmed(true);
      toast.success(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        localStorage.removeItem('auth_token');
        window.location.href = '/';
      }, 3000);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Şifre değişikliği onaylanamadı');
      toast.error(error.response?.data?.detail || 'Şifre değişikliği onaylanamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
        {loading && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Şifre Değişikliği Onaylanıyor...</h2>
            <p className="text-gray-300">Lütfen bekleyin</p>
          </div>
        )}

        {!loading && confirmed && (
          <div>
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-2">Şifre Değiştirildi!</h2>
            <p className="text-gray-300 mb-4">
              Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.
            </p>
            <p className="text-sm text-gray-400">
              Giriş sayfasına yönlendiriliyorsunuz...
            </p>
          </div>
        )}

        {!loading && error && (
          <div>
            <div className="text-red-400 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-white mb-2">Onaylama Başarısız</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              Ana Sayfaya Dön
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
