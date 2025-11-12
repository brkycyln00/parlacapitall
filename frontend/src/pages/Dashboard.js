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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`, { withCredentials: true });
      setDashboard(response.data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
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
    const link = `${process.env.REACT_APP_BASE_URL}/?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referans linki kopyalandı!');
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
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xl">PC</span>
            </div>
            <span className="text-xl font-bold text-white">ParlaCapital</span>
          </div>
        </div>

        <nav className="flex-1 px-3">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-amber-500 text-slate-900 font-semibold mb-2">
            <TrendingUp size={20} />
            <span>Panel</span>
          </button>
          <button 
            onClick={() => navigate('/packages')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 mb-2"
          >
            <Wallet size={20} />
            <span>Yatırımlar</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 mb-2">
            <Award size={20} />
            <span>Komisyonlar</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 mb-2">
            <Users size={20} />
            <span>Referans Ağı</span>
          </button>
          <div className="border-t border-slate-700 my-4"></div>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 mb-2">
            <span>⚙️</span>
            <span>Ayarlar</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700">
            <span>❓</span>
            <span>Destek</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Hoş Geldiniz, {user?.name}!</h1>
              <p className="text-gray-400 mt-1">İşte yatırım performansınızın özeti</p>
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
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Yatırım Bakiyesi</CardTitle>
                <Wallet className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">₺{(user?.wallet_balance || 0).toLocaleString('tr-TR')}</div>
                <p className="text-xs text-green-500 mt-2 flex items-center">
                  <TrendingUp size={14} className="mr-1" />
                  +12.5% Toplam aktif yatırım
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Haftalık Kazanç</CardTitle>
                <TrendingUp className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">₺{(user?.weekly_earnings || 0).toLocaleString('tr-TR')}</div>
                <p className="text-xs text-green-500 mt-2">+8.2% Bu hafta</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Toplam Komisyon</CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">₺{(user?.total_commissions || 0).toLocaleString('tr-TR')}</div>
                <p className="text-xs text-green-500 mt-2">+15.3% Tüm zamanlar</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Referans Ağı</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{dashboard?.referrals?.length || 0}</div>
                <p className="text-xs text-green-500 mt-2">+5 Aktif üyeler</p>
              </CardContent>
            </Card>
          </div>

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
                <div className="bg-slate-800/80 rounded-xl p-6 border border-amber-500/20">
                  <p className="text-sm text-gray-400 mb-2">Referans Kodunuz</p>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex-1 bg-slate-900 rounded-lg px-4 py-3 border border-amber-500/30">
                      <p className="text-2xl font-bold text-amber-400 font-mono">{user?.referral_code}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(user?.referral_code);
                        toast.success('Referans kodu kopyalandı!');
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6"
                    >
                      Kopyala
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">Davet Linkiniz</p>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={`${process.env.REACT_APP_BASE_URL}/?ref=${user?.referral_code}`}
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

                <div className="bg-slate-800/80 rounded-xl p-6 border border-amber-500/20">
                  <p className="text-sm text-gray-400 mb-4">Komisyon Oranları</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Silver Paket</span>
                      <span className="text-purple-400 font-bold">%5 Komisyon</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Gold Paket</span>
                      <span className="text-amber-400 font-bold">%10 Komisyon</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Platinum Paket</span>
                      <span className="text-cyan-400 font-bold">%15 Komisyon</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Toplam Kazancınız</span>
                      <span className="text-2xl font-bold text-green-400">₺{user?.total_commissions?.toLocaleString('tr-TR') || '0'}</span>
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
                            ₺{ref.total_invested?.toLocaleString('tr-TR') || '0'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-green-400 font-bold">
                              +₺{((ref.package_amount || 0) * (
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
                    <span className="text-sm text-white">₺{user?.left_volume?.toLocaleString('tr-TR') || '0'} / ₺50,000</span>
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
                    <span className="text-sm text-white">₺{user?.right_volume?.toLocaleString('tr-TR') || '0'} / ₺50,000</span>
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
                  <p className="text-3xl font-bold text-amber-500">₺{user?.binary_earnings?.toLocaleString('tr-TR') || '0'}</p>
                  <p className="text-xs text-gray-500 mt-2">Hedef: ₺10,000 • Kalan: ₺{(10000 - (user?.binary_earnings || 0)).toLocaleString('tr-TR')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

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
                        {tx.type === 'withdrawal' ? '-' : '+'}₺{tx.amount.toLocaleString('tr-TR')}
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
    </div>
  );
}