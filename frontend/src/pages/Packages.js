import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, API } from '../App';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Packages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [cryptoType, setCryptoType] = useState('usdt');
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPackages();
    
    // Check for referral code in URL
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      validateReferralCode(ref);
    }
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Packages error:', error);
    }
  };

  const validateReferralCode = async (code) => {
    if (!code) {
      setReferralValid(null);
      return;
    }

    try {
      const response = await axios.get(`${API}/validate-referral/${code}`);
      setReferralValid(response.data);
    } catch (error) {
      setReferralValid({ valid: false });
    }
  };

  const handleInvest = async () => {
    if (!user) {
      toast.error('Lütfen önce giriş yapın');
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/investments/create`,
        {
          package: selectedPackage.name.toLowerCase(),
          crypto_type: cryptoType,
          referral_code: referralCode || null
        },
        { withCredentials: true }
      );
      toast.success('Yatırım başarıyla oluşturuldu!');
      setInvestDialogOpen(false);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Yatırım oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const openInvestDialog = (pkg) => {
    if (!user) {
      toast.error('Lütfen önce giriş yapın');
      navigate('/');
      return;
    }
    setSelectedPackage(pkg);
    setInvestDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-xl">P</span>
              </div>
              <span className="text-2xl font-bold text-white">ParlaCapital</span>
            </div>
            <Button onClick={() => navigate('/')} data-testid="back-home-button" variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10">
              Ana Sayfa
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Yatırım Paketleri</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Size uygun paketi seçin ve haftalık %5 garantili getiri elde etmeye başlayın
          </p>
        </div>

        {/* Referral Info */}
        {referralCode && (
          <div className="mb-8 text-center">
            {referralValid?.valid ? (
              <div className="inline-block bg-green-500/20 border border-green-500 rounded-lg px-6 py-3">
                <p className="text-green-400">
                  ✓ <span className="font-semibold">{referralValid.name}</span> tarafından davet edildiniz
                </p>
              </div>
            ) : referralValid?.valid === false ? (
              <div className="inline-block bg-red-500/20 border border-red-500 rounded-lg px-6 py-3">
                <p className="text-red-400">✗ Geçersiz referans kodu</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Packages Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className="package-card"
              data-testid={`package-${pkg.name.toLowerCase()}`}
            >
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-white mb-2">{pkg.name}</h3>
                <div className="text-5xl font-bold text-amber-400 mb-4">${pkg.amount}</div>
                <p className="text-gray-400">Minimum yatırım tutarı</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Haftalık %5 getiri</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">%{pkg.commission_rate * 100} referans komisyonu</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Binary kazanç hakkı</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Kariyer ödülleri</span>
                </div>
              </div>

              <Button
                data-testid={`invest-${pkg.name.toLowerCase()}-button`}
                onClick={() => openInvestDialog(pkg)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-6 text-lg font-bold"
              >
                Bu Paketi Seç
              </Button>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Tüm Paketlerde</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Garantili Getiri</h3>
                <p className="text-gray-400">Her hafta yatırımınızın %5'i otomatik olarak hesabınıza eklenir</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Güvenli Ödeme</h3>
                <p className="text-gray-400">USDT, BTC ve ETH ile güvenli kripto ödemeler</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Anında Çekim</h3>
                <p className="text-gray-400">Kazancınızı istediğiniz zaman çekebilirsiniz</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">7/24 Destek</h3>
                <p className="text-gray-400">Profesyonel ekibimiz her zaman yanınızda</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Dialog */}
      <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Yatırım Yap - {selectedPackage?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-gray-400">Yatırım Tutarı</p>
              <p className="text-3xl font-bold text-amber-400">${selectedPackage?.amount}</p>
            </div>
            <div>
              <Label className="text-gray-300">Kripto Tipi</Label>
              <Select value={cryptoType} onValueChange={setCryptoType}>
                <SelectTrigger data-testid="payment-crypto-select" className="bg-slate-700 border-amber-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-amber-500/30">
                  <SelectItem value="usdt">USDT (Tether)</SelectItem>
                  <SelectItem value="btc">BTC (Bitcoin)</SelectItem>
                  <SelectItem value="eth">ETH (Ethereum)</SelectItem>
                  <SelectItem value="mock">Mock (Test Ödemesi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!referralCode && (
              <div>
                <Label className="text-gray-300">Referans Kodu (Opsiyonel)</Label>
                <div className="flex gap-2">
                  <Input
                    data-testid="referral-code-input"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    onBlur={(e) => validateReferralCode(e.target.value)}
                    placeholder="Referans kodunu girin"
                    className="bg-slate-700 border-amber-500/30 text-white"
                  />
                </div>
                {referralValid?.valid && (
                  <p className="text-green-400 text-sm mt-1">✓ Geçerli kod - {referralValid.name}</p>
                )}
                {referralValid?.valid === false && (
                  <p className="text-red-400 text-sm mt-1">✗ Geçersiz kod</p>
                )}
              </div>
            )}
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                <strong>Not:</strong> Bu bir demo uygulamadır. Gerçek kripto ödemesi yapılmayacaktır. 
                "Mock" seçeneğini kullanarak test yatırımı yapabilirsiniz.
              </p>
            </div>
            <Button
              data-testid="confirm-investment-button"
              onClick={handleInvest}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 py-6 text-lg"
            >
              {loading ? 'İşleniyor...' : 'Yatırımı Onayla'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}