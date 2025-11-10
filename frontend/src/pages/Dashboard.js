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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [cryptoType, setCryptoType] = useState('usdt');
  const [walletAddress, setWalletAddress] = useState('');

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
    const link = `https://investparla.preview.emergentagent.com/?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referans linki kopyalandı!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-container">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container min-h-screen">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_investparla/artifacts/pu93i0x2_ChatGPT%20Image%20Nov%209%2C%202025%2C%2008_35_50%20PM.png" 
                alt="ParlaCapital Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Hoş Geldin, {user?.name}</h1>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {user?.is_admin && (
                <Button onClick={() => navigate('/admin')} data-testid="admin-panel-button" variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10">
                  Admin Panel
                </Button>
              )}
              <Button onClick={() => navigate('/')} data-testid="home-button" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Ana Sayfa
              </Button>
              <Button onClick={logout} data-testid="logout-button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Balance */}
        <div className="mb-8">
          <Card className="glass-card border-2 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-white flex justify-between items-center">
                <span>Cüzdan Bakiyesi</span>
                <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="withdraw-button" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                      Para Çek
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-amber-500/30">
                    <DialogHeader>
                      <DialogTitle className="text-white">Para Çekme Talebi</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label className="text-gray-300">Miktar (USD)</Label>
                        <Input
                          data-testid="withdrawal-amount-input"
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
                          <SelectTrigger data-testid="crypto-type-select" className="bg-slate-700 border-amber-500/30 text-white">
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
                          data-testid="wallet-address-input"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          placeholder="0x..."
                          className="bg-slate-700 border-amber-500/30 text-white"
                        />
                      </div>
                      <Button data-testid="submit-withdrawal-button" onClick={handleWithdrawal} className="w-full bg-gradient-to-r from-amber-500 to-amber-600">
                        Talep Gönder
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-amber-400">${user?.wallet_balance?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card" data-testid="package-card">
            <CardHeader>
              <CardTitle className="text-gray-300 text-sm">Paket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {dashboard?.user?.package ? dashboard.user.package.toUpperCase() : 'Yok'}
              </div>
              {dashboard?.user?.package_amount > 0 && (
                <p className="text-gray-400 mt-2">${dashboard.user.package_amount}</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="weekly-earnings-card">
            <CardHeader>
              <CardTitle className="text-gray-300 text-sm">Haftalık Kazanç</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">${dashboard?.user?.weekly_earnings?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="commissions-card">
            <CardHeader>
              <CardTitle className="text-gray-300 text-sm">Toplam Komisyon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">${dashboard?.user?.total_commissions?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="binary-earnings-card">
            <CardHeader>
              <CardTitle className="text-gray-300 text-sm">Binary Kazanç</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">${dashboard?.user?.binary_earnings?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Referans Linkiniz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  data-testid="referral-link-input"
                  value={`https://investparla.preview.emergentagent.com/?ref=${user?.referral_code}`}
                  readOnly
                  className="bg-slate-700 border-amber-500/30 text-white"
                />
                <Button data-testid="copy-referral-button" onClick={copyReferralLink} className="bg-amber-500 hover:bg-amber-600">
                  Kopyala
                </Button>
              </div>
              <p className="text-gray-400 text-sm mt-2">Referans Kodu: <span className="text-amber-400 font-mono">{user?.referral_code}</span></p>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="career-level-card">
            <CardHeader>
              <CardTitle className="text-white">Kariyer Seviyesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400 mb-2">{dashboard?.user?.career_level || 'None'}</div>
              <p className="text-gray-400">Puan: {dashboard?.user?.career_points?.toFixed(0) || 0}</p>
              <p className="text-gray-400">Ödüller: ${dashboard?.user?.career_rewards?.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Network */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-white">Binary Ağınız</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-3">Sol Ağ</h3>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  {dashboard?.network?.left ? (
                    <div>
                      <p className="text-white font-semibold">{dashboard.network.left.name}</p>
                      <p className="text-gray-400 text-sm">{dashboard.network.left.package || 'Paket yok'}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Henüz üye yok</p>
                  )}
                  <p className="text-amber-400 mt-2">Hacim: ${dashboard?.user?.left_volume?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-3">Sağ Ağ</h3>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  {dashboard?.network?.right ? (
                    <div>
                      <p className="text-white font-semibold">{dashboard.network.right.name}</p>
                      <p className="text-gray-400 text-sm">{dashboard.network.right.package || 'Paket yok'}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Henüz üye yok</p>
                  )}
                  <p className="text-amber-400 mt-2">Hacim: ${dashboard?.user?.right_volume?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referrals */}
        {dashboard?.referrals?.length > 0 && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-white">Direkt Referanslarınız ({dashboard.referrals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.referrals.map((ref, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">{ref.name}</p>
                      <p className="text-gray-400 text-sm">{ref.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-semibold">{ref.package ? ref.package.toUpperCase() : 'Yok'}</p>
                      <p className="text-gray-400 text-sm">${ref.total_invested?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        {dashboard?.transactions?.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Son İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.transactions.map((tx, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-gray-400 text-sm">{tx.description}</p>
                      <p className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        tx.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toFixed(2)}
                      </p>
                      <p className={`text-sm ${
                        tx.status === 'completed' ? 'text-green-400' :
                        tx.status === 'pending' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {tx.status === 'completed' ? 'Tamamlandı' :
                         tx.status === 'pending' ? 'Beklemede' :
                         'Reddedildi'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Package CTA */}
        {!dashboard?.user?.package && (
          <div className="mt-8 text-center">
            <Card className="glass-card border-2 border-amber-500/50">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold text-white mb-4">Henüz paket seçmediniz</h2>
                <p className="text-gray-400 mb-6">Kazanmaya başlamak için bir paket seçin</p>
                <Button onClick={() => navigate('/packages')} data-testid="select-package-button" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-8 py-6 text-lg">
                  Paketleri İncele
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}