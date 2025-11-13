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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [commissionsOpen, setCommissionsOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [referralCodes, setReferralCodes] = useState([]);
  const [activeReferralCode, setActiveReferralCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pendingInvestments, setPendingInvestments] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  
  // Withdrawal state
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalFullName, setWithdrawalFullName] = useState('');
  const [withdrawalIban, setWithdrawalIban] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  
  // Referral management state
  const [myReferrals, setMyReferrals] = useState({ placed: [], unplaced: [], total: 0 });
  const [managementOpen, setManagementOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [placementPosition, setPlacementPosition] = useState('left');
  const [selectedUpline, setSelectedUpline] = useState('');
  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  
  // Join network state
  const [joinNetworkOpen, setJoinNetworkOpen] = useState(false);
  const [joinReferralCode, setJoinReferralCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  
  // Binary tree state
  const [binaryTree, setBinaryTree] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);

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
      
      // Fetch pending withdrawals
      fetchPendingWithdrawals();
      
      // Fetch my referrals for management
      fetchMyReferrals();
    } catch (error) {
      console.error('Dashboard error:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Veri yüklenirken hata oluştu: ' + (error.response?.data?.detail || error.message));
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
  
  const fetchPendingWithdrawals = async () => {
    try {
      const response = await axios.get(`${API}/withdrawal/my-requests`, { withCredentials: true });
      setPendingWithdrawals(response.data.requests || []);
    } catch (error) {
      console.error('Pending withdrawals error:', error);
    }
  };
  
  const fetchMyReferrals = async () => {
    try {
      const response = await axios.get(`${API}/users/my-referrals`, { withCredentials: true });
      setMyReferrals(response.data);
    } catch (error) {
      console.error('My referrals error:', error);
      toast.error('Referanslar yüklenirken hata oluştu');
    }
  };
  
  const handlePlaceReferral = async (referralId, uplineId, position) => {
    try {
      await axios.post(
        `${API}/users/place-referral`,
        {
          user_id: referralId,
          upline_id: uplineId,
          position: position
        },
        { withCredentials: true }
      );
      toast.success('Kullanıcı başarıyla yerleştirildi!');
      fetchMyReferrals();
      fetchDashboard();
      setManagementOpen(false);
      setSelectedReferral(null);
    } catch (error) {
      console.error('Place referral error:', error);
      toast.error(error.response?.data?.detail || 'Yerleştirme başarısız');
    }
  };
  
  const handleJoinNetwork = async () => {
    if (!joinReferralCode.trim()) {
      toast.error('Lütfen referans kodunu girin');
      return;
    }
    
    setJoinLoading(true);
    try {
      const response = await axios.post(
        `${API}/referral/join-network`,
        { referral_code: joinReferralCode },
        { withCredentials: true }
      );
      toast.success(response.data.message);
      setJoinNetworkOpen(false);
      setJoinReferralCode('');
      fetchDashboard();
      fetchMyReferrals();
    } catch (error) {
      console.error('Join network error:', error);
      toast.error(error.response?.data?.detail || 'Referans kodu kullanılamadı');
    } finally {
      setJoinLoading(false);
    }
  };
  
  const generateNewCode = async (position = 'auto') => {
    setGeneratingCode(true);
    try {
      const response = await axios.post(
        `${API}/referral/generate?position=${position}`, 
        {}, 
        { withCredentials: true }
      );
      setActiveReferralCode(response.data.code);
      toast.success(response.data.message || 'Yeni referans kodu oluşturuldu!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kod oluşturulamadı');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalFullName || !withdrawalIban || !withdrawalAmount) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    const availableBalance = (user?.weekly_earnings || 0) + (user?.total_commissions || 0);
    if (amount > availableBalance) {
      toast.error(`Yetersiz bakiye. Kullanılabilir: $${availableBalance.toFixed(2)}`);
      return;
    }

    setWithdrawalLoading(true);
    try {
      await axios.post(
        `${API}/withdrawal/request`,
        {
          full_name: withdrawalFullName,
          iban: withdrawalIban,
          amount: amount
        },
        { withCredentials: true }
      );
      toast.success('Çekim talebiniz alınmıştır.');
      setWithdrawalOpen(false);
      setWithdrawalFullName('');
      setWithdrawalIban('');
      setWithdrawalAmount('');
      
      // Scroll to top to see pending withdrawals
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Refresh dashboard data
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Çekim talebi başarısız');
    } finally {
      setWithdrawalLoading(false);
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
          {!user?.is_admin && (
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
          )}
          
          {!user?.is_admin && (
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
          )}
          
          {!user?.is_admin && (
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
          )}
          
          {!user?.is_admin && (
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
          )}
          
          {!user?.is_admin && (
          <>
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
          </>
          )}
          
          {user?.is_admin && (
            <button 
              onClick={() => {
                navigate('/admin');
                setSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-amber-500 text-slate-900 font-semibold mb-2"
            >
              <span>👑</span>
              <span>Admin Panel</span>
            </button>
          )}
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
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button 
                onClick={() => setWithdrawalOpen(true)}
                variant="outline" 
                className="border-green-600 text-green-400 hover:bg-green-600/10 text-sm md:text-base"
              >
                <Download size={18} className="mr-0 md:mr-2" />
                <span className="hidden md:inline">Çekim Yap</span>
              </Button>
              <Button 
                onClick={() => navigate('/packages')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm md:text-base"
              >
                <Plus size={18} className="mr-0 md:mr-2" />
                <span className="hidden md:inline">Yeni Yatırım</span>
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3">
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


          {/* Pending Withdrawals Section */}
          {pendingWithdrawals.filter(w => w.status === 'pending').length > 0 && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/30 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Bekleyen Çekim Taleplerim
                </CardTitle>
                <p className="text-sm text-gray-400">Admin onayı bekleniyor</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingWithdrawals.filter(w => w.status === 'pending').map((withdrawal, idx) => (
                    <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-white font-bold text-lg">Çekim Talebi</p>
                              <p className="text-gray-400 text-sm">IBAN ile çekim</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3">
                            <div>
                              <p className="text-gray-500">İsim</p>
                              <p className="text-white">{withdrawal.full_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Tutar</p>
                              <p className="text-blue-400 font-bold">${withdrawal.amount.toFixed(2)}</p>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                              <p className="text-gray-500">IBAN</p>
                              <p className="text-white font-mono text-xs">{withdrawal.iban}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Talep Tarihi</p>
                              <p className="text-white">{new Date(withdrawal.created_at).toLocaleDateString('tr-TR')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="bg-blue-500/20 border border-blue-500 rounded-lg px-4 py-2">
                            <p className="text-blue-400 font-semibold text-sm">⏳ Onay Bekleniyor</p>
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Active Referral Code */}
                <div className="bg-slate-800/80 rounded-xl p-6 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-400">Aktif Referans Kodunuz</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => generateNewCode('left')}
                        disabled={generatingCode}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        title="Sol kol için kod"
                      >
                        {generatingCode ? '...' : '← Sol'}
                      </Button>
                      <Button
                        onClick={() => generateNewCode('right')}
                        disabled={generatingCode}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        title="Sağ kol için kod"
                      >
                        {generatingCode ? '...' : 'Sağ →'}
                      </Button>
                      <Button
                        onClick={() => generateNewCode('auto')}
                        disabled={generatingCode}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        title="Otomatik yerleştirme"
                      >
                        {generatingCode ? '...' : 'Auto'}
                      </Button>
                    </div>
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
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px]">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
                <Button 
                  className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={() => setNetworkOpen(true)}
                >
                  Tam Ağı Görüntüle
                </Button>
              </CardContent>
            </Card>

            {/* Referral Management */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Referans Yönetimi</CardTitle>
                <p className="text-sm text-gray-400">Referanslarınızı yerleştirin ve yönetin</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-400">{myReferrals.unplaced.length}</p>
                      <p className="text-xs text-gray-400">Yerleşmemiş</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-400">{myReferrals.placed.filter(r => r.current_position === 'left').length}</p>
                      <p className="text-xs text-gray-400">Sol Kol</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-400">{myReferrals.placed.filter(r => r.current_position === 'right').length}</p>
                      <p className="text-xs text-gray-400">Sağ Kol</p>
                    </div>
                  </div>

                  {/* Unplaced Referrals */}
                  {myReferrals.unplaced.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-amber-400">⏳ Yerleştirilmesi Gerekenler</p>
                      {myReferrals.unplaced.slice(0, 3).map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between bg-slate-700/30 p-2 rounded">
                          <div>
                            <p className="text-white text-sm">{referral.name}</p>
                            <p className="text-xs text-gray-400">{referral.email}</p>
                          </div>
                          <Button 
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setSelectedUpline(user.id);
                              setPlacementModalOpen(true);
                            }}
                          >
                            Yerleştir
                          </Button>
                        </div>
                      ))}
                      {myReferrals.unplaced.length > 3 && (
                        <p className="text-xs text-gray-400 text-center">+{myReferrals.unplaced.length - 3} daha...</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      onClick={() => setManagementOpen(true)}
                    >
                      Tüm Referansları Yönet
                    </Button>
                    {!user?.upline_id && (
                      <Button 
                        variant="outline"
                        className="border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white"
                        onClick={() => setJoinNetworkOpen(true)}
                      >
                        📥 Kod Gir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Career Rewards */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  💎 Kariyer Ödülleri
                </CardTitle>
                <p className="text-sm text-gray-300">Binary ağ satış hacminize göre seviye atlayın</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Level */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Mevcut Seviye</span>
                      <span className="text-2xl font-bold text-purple-400">
                        {dashboard?.career?.current_level || 'None'}
                      </span>
                    </div>
                    {dashboard?.career?.current_level !== 'None' && (
                      <div className="text-green-400 text-sm">
                        🎉 Ödül: ${dashboard?.career?.current_reward || 0}
                      </div>
                    )}
                  </div>

                  {/* Progress to Next Level */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-semibold">
                        Sonraki: {dashboard?.career?.next_level}
                      </span>
                      <span className="text-sm text-amber-400">
                        Ödül: {dashboard?.career?.next_reward === 'TOGG' ? '0 km TOGG 🚗' : `$${dashboard?.career?.next_reward}`}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                        style={{width: `${dashboard?.career?.progress || 0}%`}}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                        {dashboard?.career?.progress || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Volume Requirements */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <div className="text-xs text-blue-400 mb-1">👈 Sol Kol</div>
                      <div className="text-white font-bold">${dashboard?.career?.left_volume?.toLocaleString('tr-TR') || 0}</div>
                      <div className="text-xs text-gray-400">
                        Hedef: ${dashboard?.career?.left_needed?.toLocaleString('tr-TR') || 0}
                      </div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                      <div className="text-xs text-purple-400 mb-1">👉 Sağ Kol</div>
                      <div className="text-white font-bold">${dashboard?.career?.right_volume?.toLocaleString('tr-TR') || 0}</div>
                      <div className="text-xs text-gray-400">
                        Hedef: ${dashboard?.career?.right_needed?.toLocaleString('tr-TR') || 0}
                      </div>
                    </div>
                  </div>

                  {/* Career Levels Info */}
                  <details className="text-sm">
                    <summary className="text-amber-400 cursor-pointer hover:text-amber-300">
                      📋 Tüm Kariyer Seviyeleri
                    </summary>
                    <div className="mt-3 space-y-2 text-gray-300">
                      <div className="flex justify-between"><span>💜 Amethyst:</span><span>$5.000 + $5.000 = $500</span></div>
                      <div className="flex justify-between"><span>💙 Sapphire:</span><span>$10.000 + $10.000 = $1.000</span></div>
                      <div className="flex justify-between"><span>❤️ Ruby:</span><span>$20.000 + $20.000 = $3.000</span></div>
                      <div className="flex justify-between"><span>💚 Emerald:</span><span>$50.000 + $50.000 = $7.500</span></div>
                      <div className="flex justify-between"><span>💎 Diamond:</span><span>$100.000 + $100.000 = $20.000</span></div>
                      <div className="flex justify-between"><span>👑 Crown:</span><span>$300.000 + $300.000 = TOGG 🚗</span></div>
                    </div>
                  </details>
                </div>
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

      {/* Commissions Dialog */}
      <Dialog open={commissionsOpen} onOpenChange={setCommissionsOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Komisyonlarınız</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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


      {/* Withdrawal Dialog */}
      <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
        <DialogContent className="bg-slate-800 border-green-500/30 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Çekim Yap</DialogTitle>
            <p className="text-gray-400 text-sm mt-2">
              Kullanılabilir Bakiye: ${((user?.weekly_earnings || 0) + (user?.total_commissions || 0)).toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-gray-300">İsim Soyisim</Label>
              <Input
                value={withdrawalFullName}
                onChange={(e) => setWithdrawalFullName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>
            
            <div>
              <Label className="text-gray-300">IBAN</Label>
              <Input
                value={withdrawalIban}
                onChange={(e) => setWithdrawalIban(e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="bg-slate-700 border-slate-600 text-white mt-2 font-mono"
                maxLength={32}
              />
            </div>
            
            <div>
              <Label className="text-gray-300">Çekim Tutarı ($)</Label>
              <Input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="0.00"
                className="bg-slate-700 border-slate-600 text-white mt-2"
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                ℹ️ Çekim talebiniz admin onayından sonra hesabınıza yansıyacaktır. 
                Ana bakiyeniz haftalık kazancınız ve komisyonlarınızın toplamıdır.
              </p>
            </div>
            
            <Button
              onClick={handleWithdrawal}
              disabled={withdrawalLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-6 text-lg font-bold"
            >
              {withdrawalLoading ? 'İşleniyor...' : 'Çekim Yap'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Management Dialog */}
      <Dialog open={managementOpen} onOpenChange={setManagementOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Referans Ağı Yönetimi</DialogTitle>
            <p className="text-gray-400">Referanslarınızı sol veya sağ kolunuza yerleştirin</p>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Unplaced Referrals */}
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-4">⏳ Yerleşmemiş Referanslar ({myReferrals.unplaced.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {myReferrals.unplaced.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Henüz yerleşmemiş referans yok</p>
                ) : (
                  myReferrals.unplaced.map((referral) => (
                    <Card key={referral.id} className="bg-slate-700/50 border-amber-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{referral.name}</p>
                            <p className="text-sm text-gray-400">{referral.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Yatırım: ${referral.total_invested || 0}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                          onClick={() => {
                            setSelectedReferral(referral);
                            setSelectedUpline(user.id);
                            setPlacementModalOpen(true);
                          }}
                        >
                          🎯 Yerleştir
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Placed Referrals */}
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-4">✅ Yerleşmiş Referanslar ({myReferrals.placed.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {myReferrals.placed.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Henüz yerleşmiş referans yok</p>
                ) : (
                  myReferrals.placed.map((referral) => (
                    <Card key={referral.id} className={`border-2 ${
                      referral.current_position === 'left' 
                        ? 'bg-blue-500/10 border-blue-500/30' 
                        : 'bg-purple-500/10 border-purple-500/30'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-white font-medium">{referral.name}</p>
                            <p className="text-sm text-gray-400">{referral.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded ${
                                referral.current_position === 'left'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-purple-500 text-white'
                              }`}>
                                {referral.current_position === 'left' ? '👈 Sol Kol' : '👉 Sağ Kol'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Yatırım: ${referral.total_invested || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white"
                          onClick={() => {
                            setSelectedReferral(referral);
                            setSelectedUpline(referral.parent_id || user.id);
                            setPlacementModalOpen(true);
                          }}
                        >
                          🔄 Yeniden Yerleştir
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              ℹ️ <strong>Bilgi:</strong> Referanslarınızı istediğiniz zaman sol veya sağ kolunuza yerleştirebilir, 
              daha sonra konumlarını değiştirebilirsiniz. Binary kazançlarınız her iki koldaki hacimlere göre hesaplanır.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Placement Selection Dialog */}
      <Dialog open={placementModalOpen} onOpenChange={setPlacementModalOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              {selectedReferral?.name} - Yerleştirme
            </DialogTitle>
            <p className="text-gray-400">Binary ağacınızda nereye yerleştirmek istiyorsunuz?</p>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Select Upline */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hangi üyenin altına yerleştirilsin?
              </label>
              <select
                value={selectedUpline}
                onChange={(e) => setSelectedUpline(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
              >
                <option value={user?.id}>🔹 Kendi Altıma (Benim direkt referansım olsun)</option>
                {myReferrals.placed.map((ref) => (
                  <option key={ref.id} value={ref.id}>
                    {ref.current_position === 'left' ? '👈' : '👉'} {ref.name} - {ref.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                💡 İpucu: Referansınızı kendi altınıza veya ağınızdaki herhangi bir üyenin altına yerleştirebilirsiniz
              </p>
            </div>

            {/* Select Position */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Pozisyon Seçin
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPlacementPosition('left')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    placementPosition === 'left'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-blue-400'
                  }`}
                >
                  <div className="text-4xl mb-2">👈</div>
                  <div className="text-white font-semibold">Sol Kol</div>
                  <div className="text-xs text-gray-400 mt-1">Left Branch</div>
                </button>
                <button
                  onClick={() => setPlacementPosition('right')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    placementPosition === 'right'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-slate-600 bg-slate-700/50 hover:border-purple-400'
                  }`}
                >
                  <div className="text-4xl mb-2">👉</div>
                  <div className="text-white font-semibold">Sağ Kol</div>
                  <div className="text-xs text-gray-400 mt-1">Right Branch</div>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                ℹ️ <strong>Bilgi:</strong> Seçtiğiniz üyenin {placementPosition === 'left' ? 'sol' : 'sağ'} kolu boş olmalıdır. 
                Eğer dolu ise, önce o kişiyi başka bir yere taşıyın.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => {
                  setPlacementModalOpen(false);
                  setSelectedReferral(null);
                }}
              >
                İptal
              </Button>
              <Button
                className={`flex-1 text-white ${
                  placementPosition === 'left'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                }`}
                onClick={() => {
                  if (selectedReferral && selectedUpline) {
                    handlePlaceReferral(selectedReferral.id, selectedUpline, placementPosition);
                    setPlacementModalOpen(false);
                  }
                }}
              >
                {placementPosition === 'left' ? '👈' : '👉'} Yerleştir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Network Dialog */}
      <Dialog open={joinNetworkOpen} onOpenChange={setJoinNetworkOpen}>
        <DialogContent className="bg-slate-800 border-amber-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Ağa Katıl</DialogTitle>
            <p className="text-gray-400">Başkasının referans kodunu girerek ağına katılın</p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                ℹ️ <strong>Önemli:</strong> Referans kodu sadece BİR KEZ girebilirsiniz. 
                Bir kez bir ağa katıldıktan sonra değiştiremezsiniz.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Referans Kodu
              </label>
              <input
                type="text"
                value={joinReferralCode}
                onChange={(e) => setJoinReferralCode(e.target.value.trim())}
                placeholder="Kodunuzu buraya yapıştırın"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-xs text-gray-400 mt-2">
                💡 İpucu: Referans kodunu sponsor kişiden alın ve buraya yapıştırın (büyük/küçük harf, sayı, özel karakter)
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-400 text-sm">
                ⚠️ <strong>Uyarı:</strong> Kendi oluşturduğunuz kodları kullanamazsınız.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => {
                  setJoinNetworkOpen(false);
                  setJoinReferralCode('');
                }}
              >
                İptal
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                onClick={handleJoinNetwork}
                disabled={joinLoading}
              >
                {joinLoading ? 'Kontrol ediliyor...' : '✅ Katıl'}
              </Button>
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