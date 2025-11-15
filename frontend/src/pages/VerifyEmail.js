import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Geçersiz doğrulama linki');
      setLoading(false);
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/verify-email/${token}`);
      
      // Save token and redirect to dashboard
      localStorage.setItem('auth_token', response.data.token);
      setVerified(true);
      setError(''); // Clear any previous errors
      toast.success(response.data.message);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error) {
      setVerified(false); // Ensure verified is false
      setError(error.response?.data?.detail || 'Email doğrulama başarısız');
      toast.error(error.response?.data?.detail || 'Email doğrulama başarısız');
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
            <h2 className="text-2xl font-bold text-white mb-2">Email Doğrulanıyor...</h2>
            <p className="text-gray-300">Lütfen bekleyin</p>
          </div>
        )}

        {!loading && verified && !error && (
          <div>
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Doğrulandı!</h2>
            <p className="text-gray-300 mb-4">
              Hesabınız başarıyla aktifleştirildi. Dashboard'a yönlendiriliyorsunuz...
            </p>
          </div>
        )}

        {!loading && !verified && error && (
          <div>
            <div className="text-red-400 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-white mb-2">Doğrulama Başarısız</h2>
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
