import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Wallet, Users, Award, Download, Plus } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [cryptoType, setCryptoType] = useState('usdt');
  const [walletAddress, setWalletAddress] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [commissionsOpen, setCommissionsOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [referralCodes, setReferralCodes] = useState([]);
  const [activeReferralCode, setActiveReferralCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pendingInvestments, setPendingInvestments] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`, { withCredentials: true });
      setDashboard(response.data);
      setActiveReferralCode(response.data.active_referral_code || '');
      
      // Fetch used referral codes
      fetchReferralCodes();
      
      // Fetch pending investments
      fetchPendingInvestments();
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchReferralCodes = async () => {
    try {
      const response = await axios.get(`${API}/referral/my-codes`, { withCredentials: true });
      setReferralCodes(response.data.codes || []);
    } catch (error) {
      console.error('Referral codes error:', error);
    }
  };
  
  const fetchPendingInvestments = async () => {
    try {
      const response = await axios.get(`${API}/investment/my-requests`, { withCredentials: true });
      setPendingInvestments(response.data.requests || []);
    } catch (error) {
      console.error('Pending investments error:', error);
    }
  };
  
  const generateNewCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await axios.post(`${API}/referral/generate`, {}, { withCredentials: true });
      setActiveReferralCode(response.data.code);
      toast.success('Yeni referans kodu oluşturuldu! 10 dakika içinde kullanılmalıdır.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kod oluşturulamadı');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || !walletAddress) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0 || amount > user.wallet_balance) {
      toast.error('Geçersiz miktar');
      return;
    }

    try {
      await axios.post(
        `${API}/withdrawal/request`,
        {
          amount,
          crypto_type: cryptoType,
          wallet_address: walletAddress
        },
        { withCredentials: true }
      );
      toast.success('Çekim talebi gönderildi');
      setWithdrawalOpen(false);
      fetchDashboard();
      setWithdrawalAmount('');
      setWalletAddress('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Çekim talebi başarısız');
    }
  };

  const copyReferralLink = () => {
    const link = `${process.env.REACT_APP_BASE_URL}/?ref=${activeReferralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Davet linki kopyalandı!');
  };

  // Mock data for weekly earnings chart
  const weeklyData = [
    { day: 'Pzt', binary: 850, career: 320, commission: 1200 },
    { day: 'Sal', binary: 920, career: 450, commission: 1400 },
    { day: 'Çar', binary: 680, career: 280, commission: 1150 },
    { day: 'Per', binary: 1200, career: 650, commission: 1680 },
    { day: 'Cum', binary: 1150, career: 520, commission: 1320 },
    { day: 'Cmt', binary: 890, career: 410, commission: 980 },
    { day: 'Paz', binary: 1020, career: 380, commission: 1250 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-800 border-r border-slate-700 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xl">PC</span>
            </div>
            <span className="text-xl font-bold text-white">ParlaCapital</span>
          </div>
        </div>

        <nav className="flex-1 px-3">
          <button 
            onClick={() => {
              setActiveTab('dashboard');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold mb-2 ${
              activeTab === 'dashboard' 
                ? 'bg-amber-500 text-slate-900' 
                : 'text-gray-300 hover:bg-slate-700'
            }`}
          >
            <TrendingUp size={20} />
            <span>Panel</span>
          </button>
          <button 
            onClick={() => {
              navigate('/packages');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 mb-2"
          >
            <Wallet size={20} />
            <span>Yatırımlar</span>
          </button>
          <button 
            onClick={() => {
              setCommissionsOpen(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 mb-2"
          >
            <Award size={20} />
            <span>Komisyonlar</span>
          </button>
          <button 
            onClick={() => {
              setNetworkOpen(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 mb-2"
          >
            <Users size={20} />
            <span>Referans Ağı</span>
          </button>
          <div className="border-t border-slate-700 my-4"></div>
          <button 
            onClick={() => {
              setSettingsOpen(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 mb-2"
          >
            <span>⚙️</span>
            <span>Ayarlar</span>
          </button>
          <button 
            onClick={() => {
              navigate('/contact');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700"
          >
            <span>❓</span>
            <span>Destek</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white p-2 hover:bg-slate-700 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-3xl font-bold text-white">Hoş Geldiniz, {user?.name}!</h1>
                <p className="text-gray-400 mt-1 text-sm lg:text-base hidden sm:block">İşte yatırım performansınızın özeti</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <Download size={18} className="mr-2" />
                Rapor İndir
              </Button>
              <Button 
                onClick={() => navigate('/packages')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
              >
                <Plus size={18} className="mr-2" />
                Yeni Yatırım
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-slate-900 font-bold">{user?.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{user?.name}</p>
                  <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-300">
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Yatırım Bakiyesi</CardTitle>
                <Wallet className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                {user?.package || user?.total_invested > 0 ? (
                  <>
                    <div className="text-3xl font-bold text-white">${(user?.package_amount || user?.total_invested || 0).toLocaleString('tr-TR')}</div>
                    <p className="text-xs text-amber-400 mt-2 flex items-center">
                      {user?.package?.toUpperCase() || 'PAKET'} - Toplam Yatırım
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-500">$0</div>
                    <p className="text-xs text-gray-500 mt-2">Henüz yatırım yok</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Haftalık Kazanç</CardTitle>
                <TrendingUp className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                {user?.package || user?.total_invested > 0 ? (
                  <>
                    <div className="text-3xl font-bold text-white">${(user?.weekly_earnings || 0).toLocaleString('tr-TR')}</div>
                    <p className="text-xs text-green-500 mt-2">+8.2% Bu hafta</p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-500">$0</div>
                    <p className="text-xs text-gray-500 mt-2">Henüz kazanç yok</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Toplam Komisyon</CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">${(user?.total_commissions || 0).toLocaleString('tr-TR')}</div>
                <p className="text-xs text-green-500 mt-2">Referans kazançları</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Referans Ağı</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{dashboard?.referrals?.length || 0}</div>
                <p className="text-xs text-green-500 mt-2">Aktif üyeler</p>
              </CardContent>
            </Card>
          </div>


          {/* Pending Investments Section */}
          {pendingInvestments.filter(inv => inv.status === 'pending').length > 0 && (
            <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/30 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Bekleyen Yatırımlarım
                </CardTitle>
                <p className="text-sm text-gray-400">Admin onayı bekleniyor</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingInvestments.filter(inv => inv.status === 'pending').map((inv, idx) => (
                    <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-orange-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-white font-bold text-lg">{inv.package.toUpperCase()} Paketi</p>
                              <p className="text-gray-400 text-sm">
                                {inv.platform === 'tether_trc20' ? 'Tether (TRC20)' : 
                                 inv.platform === 'ethereum_erc20' ? 'Ethereum (ERC20)' : 
                                 'IBAN Transferi'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                            <div>
                              <p className="text-gray-500">Tutar</p>
                              <p className="text-amber-400 font-bold">${inv.amount}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Talep Tarihi</p>
                              <p className="text-white">{new Date(inv.created_at).toLocaleDateString('tr-TR')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="bg-orange-500/20 border border-orange-500 rounded-lg px-4 py-2">
                            <p className="text-orange-400 font-semibold text-sm">⏳ Onay Bekleniyor</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Investment Section */}
          {user?.package && (
            <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Aktif Yatırımınız
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-800/80 rounded-xl p-6 border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          user.package === 'platinum' ? 'bg-cyan-500' :
                          user.package === 'gold' ? 'bg-amber-500' :
                          'bg-purple-500'
                        }`}>
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${
                            user.package === 'platinum' ? 'text-cyan-400' :
                            user.package === 'gold' ? 'text-amber-400' :
                            'text-purple-400'
                          }`}>
                            {user.package?.toUpperCase()} Paketi
                          </p>
                          <p className="text-gray-400 text-sm">Yatırım Tutarı: ${user.package_amount?.toLocaleString('tr-TR') || 0}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Haftalık Kar Oranı</p>
                          <p className="text-green-400 font-bold text-lg">%5</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Komisyon Oranı</p>
                          <p className={`font-bold text-lg ${
                            user.package === 'platinum' ? 'text-cyan-400' :
                            user.package === 'gold' ? 'text-amber-400' :
                            'text-purple-400'
                          }`}>
                            {user.package === 'platinum' ? '%15' :
                             user.package === 'gold' ? '%10' :
                             '%5'}
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Yatırım Tarihi</p>
                          <p className="text-white font-bold text-sm">
                            {user.investment_date ? new Date(user.investment_date).toLocaleDateString('tr-TR') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="bg-green-500/20 border border-green-500 rounded-lg px-4 py-2">
                        <p className="text-green-400 font-semibold">✓ Aktif</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Referral Section */}
          <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/30 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-2xl">Referans Kodunuz</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Bu kodu paylaşarak yeni üyeler kazanın ve komisyon elde edin</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Toplam Referans</p>
                  <p className="text-4xl font-bold text-amber-400">{dashboard?.referrals?.length || 0}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Active Referral Code */}
                <div className="bg-slate-800/80 rounded-xl p-6 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-400">Aktif Referans Kodunuz</p>
                    <Button
                      onClick={generateNewCode}
                      disabled={generatingCode}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {generatingCode ? 'Oluşturuluyor...' : '+ Yeni Kod'}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex-1 bg-slate-900 rounded-lg px-4 py-3 border border-amber-500/30">
                      <p className="text-2xl font-bold text-amber-400 font-mono">{activeReferralCode || 'Yükleniyor...'}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(activeReferralCode);
                        toast.success('Referans kodu kopyalandı!');
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6"
                    >
                      Kopyala
                    </Button>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                    <p className="text-amber-400 text-xs font-semibold">⏰ Her kod TEK KULLANIMLIK ve 10 dakika sonra sona erer!</p>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">Davet Linkiniz</p>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={`${process.env.REACT_APP_BASE_URL}/?ref=${activeReferralCode}`}
                      readOnly
                      className="bg-slate-900 border-amber-500/30 text-white text-sm"
                    />
                    <Button 
                      onClick={copyReferralLink}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                    >
                      Kopyala
                    </Button>
                  </div>
                </div>

                {/* Used Referral Codes */}
                <div className="bg-slate-800/80 rounded-xl p-6 border border-amber-500/20">
                  <p className="text-sm text-gray-400 mb-4">Kullanılan Referans Kodlarınız</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {referralCodes.length > 0 ? (
                      referralCodes.map((codeData, idx) => (
                        <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-amber-400 font-mono font-bold">{codeData.code}</span>
                            <span className="text-green-400 text-xs">✓ Kullanıldı</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            <p>👤 {codeData.referred_user.name}</p>
                            <p>📅 {new Date(codeData.used_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">Henüz kullanılan kod yok</p>
                        <p className="text-gray-600 text-xs mt-1">Kodlarınızı paylaşarak üye kazanın!</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Toplam Kazancınız</span>
                      <span className="text-2xl font-bold text-green-400">${user?.total_commissions?.toLocaleString('tr-TR') || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral List */}
          {dashboard?.referrals && dashboard.referrals.length > 0 && (
            <Card className="bg-slate-800 border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-xl">Referanslarınız</CardTitle>
                <p className="text-sm text-gray-400">Davet ettiğiniz kullanıcılar ve kazançları</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Kullanıcı</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">E-posta</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Paket</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Pozisyon</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-semibold">Yatırım</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-semibold">Komisyon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.referrals.map((ref, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                <span className="text-slate-900 font-bold">{ref.name?.charAt(0)}</span>
                              </div>
                              <span className="text-white font-semibold">{ref.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-300">{ref.email}</td>
                          <td className="py-4 px-4 text-center">
                            {ref.package ? (
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                ref.package === 'platinum' ? 'bg-cyan-500/20 text-cyan-400' :
                                ref.package === 'gold' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-purple-500/20 text-purple-400'
                              }`}>
                                {ref.package?.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-gray-500">Yok</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {ref.position ? (
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                ref.position === 'left' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                              }`}>
                                {ref.position === 'left' ? 'Sol Kol' : 'Sağ Kol'}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right text-white font-semibold">
                            ${ref.total_invested?.toLocaleString('tr-TR') || '0'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-green-400 font-bold">
                              +${((ref.package_amount || 0) * (
                                ref.package === 'platinum' ? 0.15 :
                                ref.package === 'gold' ? 0.10 :
                                ref.package === 'silver' ? 0.05 : 0
                              )).toLocaleString('tr-TR')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts - Only show if user has investment */}
          {(user?.package || user?.total_invested > 0) ? (
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Weekly Earnings Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Haftalık Kazançlar</CardTitle>
                  <p className="text-sm text-gray-400">Son 7 günlük kazanç detayları</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="day" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Legend />
                      <Bar dataKey="binary" fill="#06B6D4" name="Binary" />
                      <Bar dataKey="career" fill="#10B981" name="Kariyer" />
                      <Bar dataKey="commission" fill="#F59E0B" name="Paket Komisyon" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            {/* Binary Earnings */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Binary Kazanç Göstergesi</CardTitle>
                <p className="text-sm text-gray-400">Sol ve sağ kolunuzun performansı</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Sol Kol</span>
                    <span className="text-sm text-white">${user?.left_volume?.toLocaleString('tr-TR') || '0'} / $50,000</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-amber-500 h-3 rounded-full" 
                      style={{width: `${Math.min((user?.left_volume || 0) / 50000 * 100, 100)}%`}}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Sağ Kol</span>
                    <span className="text-sm text-white">${user?.right_volume?.toLocaleString('tr-TR') || '0'} / $50,000</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-amber-500 h-3 rounded-full" 
                      style={{width: `${Math.min((user?.right_volume || 0) / 50000 * 100, 100)}%`}}
                    ></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-gray-400 mb-2">Bu Hafta Binary Kazanç</p>
                  <p className="text-3xl font-bold text-amber-500">${user?.binary_earnings?.toLocaleString('tr-TR') || '0'}</p>
                  <p className="text-xs text-gray-500 mt-2">Hedef: $10,000 • Kalan: ${(10000 - (user?.binary_earnings || 0)).toLocaleString('tr-TR')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700 mb-8">
              <CardContent className="text-center py-12">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Henüz Yatırım Yapmadınız</h3>
                <p className="text-gray-400 mb-6">Kazanç grafiklerinizi görmek için önce bir yatırım paketi seçin</p>
                <Button 
                  onClick={() => navigate('/packages')}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3"
                >
                  Paketleri İncele
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bottom Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Referral Network */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Referans Ağı Özeti</CardTitle>
                <p className="text-sm text-gray-400">Ağınızın genel durumu</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mb-2">
                      <span className="text-3xl font-bold text-white">{dashboard?.referrals?.filter(r => r.position === 'left').length || 0}</span>
                    </div>
                    <p className="text-sm text-gray-400">Sol Kol</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mb-2">
                      <span className="text-3xl font-bold text-white">{dashboard?.referrals?.filter(r => r.position === 'right').length || 0}</span>
                    </div>
                    <p className="text-sm text-gray-400">Sağ Kol</p>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white">
                  Tam Ağı Görüntüle
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Son Aktiviteler</CardTitle>
                <p className="text-sm text-gray-400">En son işlemleriniz ve kazançlarınız</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.transactions?.slice(0, 5).map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                      <div>
                        <p className="text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString('tr-TR')}</p>
                      </div>
                      <span className={`font-bold ${
                        tx.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  ))}
                  {(!dashboard?.transactions || dashboard.transactions.length === 0) && (
                    <p className="text-gray-500 text-center py-8">Henüz işlem yok</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Para Çekme Talebi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300">Miktar (USD)</Label>
              <Input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="100"
                className="bg-slate-700 border-amber-500/30 text-white"
              />
              <p className="text-sm text-gray-400 mt-1">Mevcut bakiye: ${user?.wallet_balance?.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-gray-300">Kripto Tipi</Label>
              <Select value={cryptoType} onValueChange={setCryptoType}>
                <SelectTrigger className="bg-slate-700 border-amber-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-amber-500/30">
                  <SelectItem value="usdt">USDT</SelectItem>
                  <SelectItem value="btc">BTC</SelectItem>
                  <SelectItem value="eth">ETH</SelectItem>
                  <SelectItem value="mock">Mock (Test)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Cüzdan Adresi</Label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="bg-slate-700 border-amber-500/30 text-white"
              />
            </div>
            <Button onClick={handleWithdrawal} className="w-full bg-gradient-to-r from-amber-500 to-amber-600">
              Talep Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commissions Dialog */}
      <Dialog open={commissionsOpen} onOpenChange={setCommissionsOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Komisyonlarınız</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm mb-2">Toplam Komisyon</p>
                  <p className="text-3xl font-bold text-green-400">${user?.total_commissions?.toLocaleString('tr-TR') || '0'}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm mb-2">Bu Ay</p>
                  <p className="text-3xl font-bold text-amber-400">${((user?.total_commissions || 0) * 0.3).toLocaleString('tr-TR')}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-gray-400 text-sm mb-2">Bu Hafta</p>
                  <p className="text-3xl font-bold text-blue-400">${((user?.total_commissions || 0) * 0.1).toLocaleString('tr-TR')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Commissions Table */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Komisyon Detayları</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboard?.referrals?.map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-slate-900 font-bold">{ref.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{ref.name}</p>
                        <p className="text-gray-400 text-sm">{ref.package?.toUpperCase() || 'Paket Yok'} - {
                          ref.package === 'platinum' ? '%15' :
                          ref.package === 'gold' ? '%10' :
                          ref.package === 'silver' ? '%5' : '0%'
                        } Komisyon</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">
                        +${((ref.package_amount || 0) * (
                          ref.package === 'platinum' ? 0.15 :
                          ref.package === 'gold' ? 0.10 :
                          ref.package === 'silver' ? 0.05 : 0
                        )).toLocaleString('tr-TR')}
                      </p>
                      <p className="text-gray-500 text-xs">Yatırım: ${ref.package_amount?.toLocaleString('tr-TR') || '0'}</p>
                    </div>
                  </div>
                ))}
                {(!dashboard?.referrals || dashboard.referrals.length === 0) && (
                  <p className="text-gray-500 text-center py-8">Henüz komisyon yok</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Network Dialog */}
      <Dialog open={networkOpen} onOpenChange={setNetworkOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Referans Ağınız</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {/* Network Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Toplam Referans</p>
                  <p className="text-4xl font-bold text-amber-400">{dashboard?.referrals?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Sol Kol</p>
                  <p className="text-4xl font-bold text-blue-400">{dashboard?.referrals?.filter(r => r.position === 'left').length || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Sağ Kol</p>
                  <p className="text-4xl font-bold text-green-400">{dashboard?.referrals?.filter(r => r.position === 'right').length || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Aktif Üyeler</p>
                  <p className="text-4xl font-bold text-purple-400">{dashboard?.referrals?.filter(r => r.package).length || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Binary Tree Visualization */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-6 text-center">Binary Ağaç Yapısı</h3>
              <div className="flex flex-col items-center space-y-8">
                {/* You */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-slate-900 font-bold text-xl">{user?.name?.charAt(0)}</span>
                  </div>
                  <p className="text-white font-semibold">{user?.name}</p>
                  <p className="text-gray-400 text-sm">Siz</p>
                </div>

                {/* Children */}
                <div className="grid grid-cols-2 gap-24">
                  {/* Left Child */}
                  <div className="text-center">
                    <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      {dashboard?.network?.left ? (
                        <span className="text-white font-bold">{dashboard.network.left.name?.charAt(0)}</span>
                      ) : (
                        <span className="text-white text-2xl">+</span>
                      )}
                    </div>
                    <p className="text-white text-sm font-semibold">
                      {dashboard?.network?.left?.name || 'Boş'}
                    </p>
                    <p className="text-blue-400 text-xs">Sol Kol</p>
                    <p className="text-gray-500 text-xs mt-1">${user?.left_volume?.toLocaleString('tr-TR') || '0'}</p>
                  </div>

                  {/* Right Child */}
                  <div className="text-center">
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      {dashboard?.network?.right ? (
                        <span className="text-white font-bold">{dashboard.network.right.name?.charAt(0)}</span>
                      ) : (
                        <span className="text-white text-2xl">+</span>
                      )}
                    </div>
                    <p className="text-white text-sm font-semibold">
                      {dashboard?.network?.right?.name || 'Boş'}
                    </p>
                    <p className="text-green-400 text-xs">Sağ Kol</p>
                    <p className="text-gray-500 text-xs mt-1">${user?.right_volume?.toLocaleString('tr-TR') || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Network Members */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Tüm Ağ Üyeleri</h3>
              <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {dashboard?.referrals?.map((ref, idx) => (
                  <div key={idx} className="bg-slate-800 rounded-lg p-3 flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ref.position === 'left' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      <span className="text-white font-bold">{ref.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{ref.name}</p>
                      <p className="text-gray-400 text-xs">{ref.position === 'left' ? 'Sol' : 'Sağ'} • {ref.package?.toUpperCase() || 'Paket Yok'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Ayarlar</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {/* Profile Section */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">Profil Bilgileri</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-400 text-sm">Ad Soyad</Label>
                  <Input
                    value={user?.name || ''}
                    readOnly
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">E-posta</Label>
                  <Input
                    value={user?.email || ''}
                    readOnly
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Referans Kodu</Label>
                  <Input
                    value={user?.referral_code || ''}
                    readOnly
                    className="bg-slate-800 border-slate-700 text-white mt-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">Hesap Bilgileri</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Paket</span>
                  <span className="text-white font-semibold">{user?.package?.toUpperCase() || 'Yok'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Üyelik Tarihi</span>
                  <span className="text-white">{new Date(user?.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Kariyer Seviyesi</span>
                  <span className="text-amber-400 font-semibold">{user?.career_level || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Admin</span>
                  <span className={user?.is_admin ? 'text-green-400' : 'text-gray-500'}>
                    {user?.is_admin ? 'Evet' : 'Hayır'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <Button 
                onClick={() => navigate('/')}
                variant="outline" 
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Ana Sayfa
              </Button>
              <Button 
                onClick={logout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Çıkış Yap
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}