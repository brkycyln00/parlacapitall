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
import Navbar from '../components/Navbar';

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
  
  // New form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [platform, setPlatform] = useState('');

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
    
    // Validate form
    if (!fullName || !username || !email || !whatsapp || !platform) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/investment/request`,
        {
          full_name: fullName,
          username: username,
          email: email,
          whatsapp: whatsapp,
          platform: platform,
          package: selectedPackage.name.toLowerCase()
        },
        { withCredentials: true }
      );
      toast.success('Yatırım talebiniz alınmıştır, en kısa sürede sizinle irtibata geçiş yapacağız.', { duration: 5000 });
      setInvestDialogOpen(false);
      // Reset form
      setFullName('');
      setUsername('');
      setEmail('');
      setWhatsapp('');
      setPlatform('');
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Yatırım talebi gönderilemedi');
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
      <Navbar />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-24">
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
        <DialogContent className="bg-slate-800 border-amber-500/30 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Yatırım Yap - {selectedPackage?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-gray-400">Yatırım Tutarı</p>
              <p className="text-3xl font-bold text-amber-400">${selectedPackage?.amount}</p>
            </div>
            
            {/* İsim Soyisim */}
            <div>
              <Label className="text-gray-300">İsim Soyisim</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="bg-slate-700 border-amber-500/30 text-white mt-2"
                required
              />
            </div>
            
            {/* Kullanıcı Adı */}
            <div>
              <Label className="text-gray-300">Kullanıcı Adı</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız"
                className="bg-slate-700 border-amber-500/30 text-white mt-2"
                required
              />
            </div>
            
            {/* Mail Adresi */}
            <div>
              <Label className="text-gray-300">Mail Adresi</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="bg-slate-700 border-amber-500/30 text-white mt-2"
                required
              />
            </div>
            
            {/* WhatsApp Numarası */}
            <div>
              <Label className="text-gray-300 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                İletişim Numarası (WhatsApp)
              </Label>
              <Input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+90 5XX XXX XX XX"
                className="bg-slate-700 border-amber-500/30 text-white mt-2"
                required
              />
            </div>
            
            {/* Platform Seçimi */}
            <div>
              <Label className="text-gray-300">Yatırım Yapılacak Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="bg-slate-700 border-amber-500/30 text-white mt-2">
                  <SelectValue placeholder="Platform seçin" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-amber-500/30">
                  <SelectItem value="tether_trc20">Tether (TRC20)</SelectItem>
                  <SelectItem value="ethereum_erc20">Ethereum (ERC20)</SelectItem>
                  <SelectItem value="iban">IBAN (Banka Transferi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Platform Detayları */}
            {platform === 'tether_trc20' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 font-semibold mb-2">Tether (TRC20) Adresi:</p>
                <div className="flex items-center justify-between bg-slate-900 rounded p-3">
                  <code className="text-white text-sm break-all">TCemFwTuVTkF6sB9F83us8tSwDeXDgqF1i</code>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText('TCemFwTuVTkF6sB9F83us8tSwDeXDgqF1i');
                      toast.success('Adres kopyalandı!');
                    }}
                    className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Kopyala
                  </Button>
                </div>
              </div>
            )}
            
            {platform === 'ethereum_erc20' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 font-semibold mb-2">Ethereum (ERC20) Adresi:</p>
                <div className="flex items-center justify-between bg-slate-900 rounded p-3">
                  <code className="text-white text-sm break-all">0xAd692789Ca10803dC61f78FB043CB53e41f50268</code>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText('0xAd692789Ca10803dC61f78FB043CB53e41f50268');
                      toast.success('Adres kopyalandı!');
                    }}
                    className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Kopyala
                  </Button>
                </div>
              </div>
            )}
            
            {platform === 'iban' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-amber-400 font-semibold mb-2">IBAN:</p>
                  <div className="flex items-center justify-between bg-slate-900 rounded p-3">
                    <code className="text-white text-sm">TR13 0020 6002 1703 6757 4700 06</code>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText('TR130020600217036757470006');
                        toast.success('IBAN kopyalandı!');
                      }}
                      className="ml-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Kopyala
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-amber-400 font-semibold mb-1">Hesap Adı:</p>
                  <p className="text-white">BPN Ödeme ve Elektronik Para Hizmetleri A.Ş.</p>
                </div>
                <div>
                  <p className="text-amber-400 font-semibold mb-1">Açıklama:</p>
                  <div className="flex items-center justify-between bg-slate-900 rounded p-3">
                    <code className="text-white text-sm">7047903631</code>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText('7047903631');
                        toast.success('Açıklama kopyalandı!');
                      }}
                      className="ml-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Kopyala
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleInvest}
              disabled={loading || !platform}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 py-6 text-lg font-bold"
            >
              {loading ? 'Gönderiliyor...' : 'Yatırımı Yaptım'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}