import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [investmentRequests, setInvestmentRequests] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placementHistory, setPlacementHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUpline, setSelectedUpline] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('left');
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedInvestments, setApprovedInvestments] = useState([]);
  
  // Profit distribution state
  const [profitModalOpen, setProfitModalOpen] = useState(false);
  const [selectedUserForProfit, setSelectedUserForProfit] = useState(null);
  const [profitAmount, setProfitAmount] = useState('');
  const [profitDescription, setProfitDescription] = useState('Haftalık kar payı');
  const [distributingProfit, setDistributingProfit] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersRes, txRes, statsRes, investReqRes, withdrawalReqRes, placementRes, pendingRes, approvedRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { withCredentials: true }),
        axios.get(`${API}/admin/transactions`, { withCredentials: true }),
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/investment-requests`, { withCredentials: true }),
        axios.get(`${API}/admin/withdrawal-requests`, { withCredentials: true }),
        axios.get(`${API}/admin/placement-history`, { withCredentials: true }),
        axios.get(`${API}/admin/pending-count`, { withCredentials: true }),
        axios.get(`${API}/admin/approved-investments`, { withCredentials: true })
      ]);
      setUsers(usersRes.data);
      setTransactions(txRes.data);
      setStats(statsRes.data);
      setInvestmentRequests(investReqRes.data.requests || []);
      setWithdrawalRequests(withdrawalReqRes.data.requests || []);
      setPlacementHistory(placementRes.data || []);
      setPendingCount(pendingRes.data.pending_count || 0);
      setApprovedInvestments(approvedRes.data.approved_investments || []);
    } catch (error) {
      console.error('Admin data error:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async (txId) => {
    try {
      await axios.post(
        `${API}/admin/transactions/${txId}/approve`,
        {},
        { withCredentials: true }
      );
      toast.success('İşlem onaylandı');
      fetchAdminData();
    } catch (error) {
      toast.error('Onaylama başarısız');
    }
  };

  const handleRejectTransaction = async (txId) => {
    try {
      await axios.post(
        `${API}/admin/transactions/${txId}/reject`,
        {},
        { withCredentials: true }
      );
      toast.success('İşlem reddedildi');
      fetchAdminData();
    } catch (error) {
      toast.error('Reddetme başarısız');
    }
  };

  const handleDistributeWeeklyProfit = async () => {
    if (!window.confirm('Tüm aktif yatırımcılara haftalık kar dağıtılımsın mı?')) return;
    
    try {
      const response = await axios.post(
        `${API}/admin/weekly-profit/distribute`,
        {},
        { withCredentials: true }
      );
      toast.success(`${response.data.distributed_to} kişiye toplam $${response.data.total_amount.toFixed(2)} dağıtıldı`);
      fetchAdminData();
    } catch (error) {
      toast.error('Kar dağıtımı başarısız');
    }
  };

  const handleDistributeProfit = async (e) => {
    e.preventDefault();
    
    if (!profitAmount || parseFloat(profitAmount) <= 0) {
      toast.error('Lütfen geçerli bir kar miktarı girin');
      return;
    }
    
    setDistributingProfit(true);
    try {
      const response = await axios.post(
        `${API}/admin/distribute-profit`,
        null,
        {
          params: {
            user_id: selectedUserForProfit.id,
            amount: parseFloat(profitAmount),
            description: profitDescription
          },
          withCredentials: true
        }
      );
      
      toast.success(response.data.message);
      setProfitModalOpen(false);
      setProfitAmount('');
      setProfitDescription('Haftalık kar payı');
      setSelectedUserForProfit(null);
      fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kar dağıtımı başarısız');
    } finally {
      setDistributingProfit(false);
    }
  };

  const openProfitModal = (user) => {
    setSelectedUserForProfit(user);
    setProfitModalOpen(true);
  };


  const handleApproveInvestmentRequest = async (requestId) => {
    try {
      await axios.post(
        `${API}/admin/investment-requests/${requestId}/approve`,
        {},
        { withCredentials: true }
      );
      toast.success('Yatırım talebi onaylandı');
      fetchAdminData();
    } catch (error) {
      toast.error('Onaylama başarısız');
    }
  };



  const handleApproveWithdrawal = async (requestId) => {
    try {
      await axios.post(
        `${API}/admin/withdrawal-requests/${requestId}/approve`,
        {},
        { withCredentials: true }
      );
      toast.success('Çekim talebi onaylandı');
      fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Onaylama başarısız');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`${userName} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) return;
    
    try {
      await axios.delete(
        `${API}/admin/users/${userId}`,
        { withCredentials: true }
      );
      toast.success('Kullanıcı silindi');
      fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme başarısız');
    }
  };
  const handlePlaceUser = async () => {
    if (!selectedUser || !selectedUpline || !selectedPosition) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (selectedUser === selectedUpline) {
      toast.error('Kullanıcı kendi altına yerleştirilemez');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/admin/place-user`,
        {
          user_id: selectedUser,
          upline_id: selectedUpline,
          position: selectedPosition
        },
        { withCredentials: true }
      );
      toast.success(response.data.message);
      setSelectedUser('');
      setSelectedUpline('');
      setSelectedPosition('left');
      fetchAdminData();
    } catch (error) {
      console.error('Place user error:', error);
      toast.error(error.response?.data?.detail || 'Yerleştirme başarısız');
    }
  };


  const handleRejectWithdrawal = async (requestId) => {
    if (!window.confirm('Bu çekim talebini reddetmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.post(
        `${API}/admin/withdrawal-requests/${requestId}/reject`,
        {},
        { withCredentials: true }
      );
      toast.success('Çekim talebi reddedildi');
      fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Reddetme başarısız');
    }
  };



  const handleMakeAdmin = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı admin yapmak istediğinizden emin misiniz?')) return;
    
    try {
      await axios.post(
        `${API}/admin/users/${userId}/make-admin`,
        {},
        { withCredentials: true }
      );
      toast.success('Kullanıcı admin yapıldı');
      fetchAdminData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-panel">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="admin-panel min-h-screen">
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
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  Admin Panel
                  {pendingCount > 0 && (
                    <span className="relative flex items-center">
                      <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-red-500 text-white text-xs font-bold">
                        {pendingCount}
                      </span>
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-400">
                  ParlaCapital Yönetim Paneli
                  {pendingCount > 0 && <span className="text-red-400 ml-2">• {pendingCount} bekleyen talep</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/dashboard')} data-testid="user-dashboard-button" variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10">
                Kullanıcı Paneli
              </Button>
              <Button onClick={logout} data-testid="admin-logout-button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="stat-card" data-testid="stat-total-users">
            <CardHeader>
              <CardTitle className="text-gray-300 text-sm">Toplam Kullanıcı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{stats.total_users}</div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="stat-active-investments">
            <CardHeader>
              <CardTitle className="text-gray-300 text-sm">Aktif Yatırımlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-400">{stats.total_investments}</div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="stat-total-volume">
            <CardHeader>
              <CardTitle className="text-gray-300 text-sm">Toplam Hacim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-400">${stats.total_volume?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>

          <Card className="stat-card" data-testid="stat-pending-withdrawals">
            <CardHeader>
              <CardTitle className="text-gray-300 text-sm">Bekleyen Çekimler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-400">{stats.pending_withdrawals}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-white">Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              data-testid="distribute-weekly-profit-button"
              onClick={handleDistributeWeeklyProfit}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              Haftalık Kar Dağıt (%5)
            </Button>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="investments" className="space-y-4">
          <TabsList className="bg-slate-800 border border-amber-500/30">
            <TabsTrigger value="investments" className="data-[state=active]:bg-amber-500">Yatırım Talepleri</TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-amber-500">Çekim Talepleri</TabsTrigger>
            <TabsTrigger value="placement" className="data-[state=active]:bg-amber-500">Kullanıcı Yerleştirme</TabsTrigger>
            <TabsTrigger data-testid="transactions-tab" value="transactions" className="data-[state=active]:bg-amber-500">İşlemler</TabsTrigger>
            <TabsTrigger data-testid="users-tab" value="users" className="data-[state=active]:bg-amber-500">Kullanıcılar</TabsTrigger>
          </TabsList>

          {/* Investment Requests Tab */}
          <TabsContent value="investments">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">Yatırım Talepleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investmentRequests.filter(req => req.status === 'pending').map((req, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded-lg p-6 border border-amber-500/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">İsim Soyisim</p>
                          <p className="text-white font-semibold">{req.full_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Kullanıcı Adı</p>
                          <p className="text-white font-semibold">{req.username}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">E-posta</p>
                          <p className="text-white">{req.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">WhatsApp</p>
                          <p className="text-green-400">{req.whatsapp}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Platform</p>
                          <p className="text-amber-400 font-semibold">
                            {req.platform === 'tether_trc20' ? 'Tether (TRC20)' : 
                             req.platform === 'ethereum_erc20' ? 'Ethereum (ERC20)' : 
                             'IBAN'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Paket</p>
                          <p className="text-white font-bold">{req.package.toUpperCase()} - ${req.amount}</p>
                        </div>
                      </div>
                      <div className="text-gray-500 text-xs mb-4">
                        Talep Tarihi: {new Date(req.created_at).toLocaleString('tr-TR')}
                      </div>
                      <Button
                        onClick={() => handleApproveInvestmentRequest(req.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                      >
                        Yatırımı Onayla
                      </Button>
                    </div>
                  ))}
                  {investmentRequests.filter(req => req.status === 'pending').length === 0 && (
                    <p className="text-gray-500 text-center py-8">Bekleyen yatırım talebi yok</p>
                  )}
                </div>
                
                {/* Onaylanmış Talepler */}
                {approvedInvestments.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                      <span className="text-green-400">✓</span> Onaylanmış Yatırımlar
                      <span className="text-sm text-gray-400">({approvedInvestments.length})</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-green-500/30 bg-green-900/20">
                            <th className="text-left text-green-400 pb-3 px-4">Tarih & Saat</th>
                            <th className="text-left text-green-400 pb-3 px-4">Kullanıcı</th>
                            <th className="text-left text-green-400 pb-3 px-4">Email</th>
                            <th className="text-left text-green-400 pb-3 px-4">WhatsApp</th>
                            <th className="text-left text-green-400 pb-3 px-4">Platform</th>
                            <th className="text-left text-green-400 pb-3 px-4">Paket</th>
                            <th className="text-left text-green-400 pb-3 px-4">Miktar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedInvestments.map((req, idx) => (
                            <tr key={idx} className="border-b border-slate-700 hover:bg-green-900/10">
                              <td className="py-4 px-4">
                                <div className="text-white font-mono text-xs">
                                  {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                </div>
                                <div className="text-green-400 font-mono text-xs">
                                  {new Date(req.created_at).toLocaleTimeString('tr-TR')}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-white font-semibold">{req.full_name}</div>
                                <div className="text-gray-400 text-xs">@{req.username}</div>
                              </td>
                              <td className="py-4 px-4 text-gray-300">{req.email}</td>
                              <td className="py-4 px-4 text-green-400">{req.whatsapp}</td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-300">
                                  {req.platform === 'tether_trc20' ? 'USDT TRC20' : 
                                   req.platform === 'ethereum_erc20' ? 'ETH ERC20' : 
                                   'IBAN'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-white">{req.package.toUpperCase()}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-green-400 font-bold">${req.amount}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {approvedInvestments.length === 0 && investmentRequests.filter(req => req.status === 'pending').length === 0 && (
                  <div className="mt-8">
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <p className="text-white font-semibold text-center">Henüz onaylanmış yatırım yok</p>
                      <p className="text-gray-400 text-sm text-center">Bekleyen talepleri onaylayın</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Withdrawal Requests Tab */}
          <TabsContent value="withdrawals">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">Çekim Talepleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalRequests.filter(req => req.status === 'pending').map((req, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded-lg p-6 border border-green-500/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">İsim Soyisim</p>
                          <p className="text-white font-semibold">{req.full_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Kullanıcı</p>
                          <p className="text-white">{req.user_name}</p>
                          <p className="text-gray-500 text-xs">{req.user_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">IBAN</p>
                          <p className="text-white font-mono text-sm">{req.iban}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Çekim Tutarı</p>
                          <p className="text-green-400 font-bold text-xl">${req.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-gray-500 text-xs mb-4">
                        Talep Tarihi: {new Date(req.created_at).toLocaleString('tr-TR')}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveWithdrawal(req.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                          Çekimi Onayla
                        </Button>
                        <Button
                          onClick={() => handleRejectWithdrawal(req.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          Reddet
                        </Button>
                      </div>
                    </div>
                  ))}
                  {withdrawalRequests.filter(req => req.status === 'pending').length === 0 && (
                    <p className="text-gray-500 text-center py-8">Bekleyen çekim talebi yok</p>
                  )}
                </div>
                
                {/* Onaylanmış Çekimler */}
                {withdrawalRequests.filter(req => req.status === 'approved').length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-white font-semibold mb-4">Onaylanmış Çekimler</h3>
                    <div className="space-y-2">
                      {withdrawalRequests.filter(req => req.status === 'approved').map((req, idx) => (
                        <div key={idx} className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-semibold">{req.full_name}</p>
                              <p className="text-gray-400 text-sm">${req.amount.toFixed(2)} - {req.iban}</p>
                            </div>
                            <p className="text-green-400 font-semibold">✓ Onaylandı</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                
                {/* Reddedilen Çekimler */}
                {withdrawalRequests.filter(req => req.status === 'rejected').length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-white font-semibold mb-4">Reddedilen Çekimler</h3>
                    <div className="space-y-2">
                      {withdrawalRequests.filter(req => req.status === 'rejected').map((req, idx) => (
                        <div key={idx} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-semibold">{req.full_name}</p>
                              <p className="text-gray-400 text-sm">${req.amount.toFixed(2)} - {req.iban}</p>
                            </div>
                            <p className="text-red-400 font-semibold">✗ Reddedildi</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">Tüm İşlemler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx, idx) => (
                    <div key={idx} data-testid={`transaction-${idx}`} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-white font-semibold capitalize">{tx.type.replace('_', ' ')}</p>
                          <p className="text-gray-400 text-sm">{tx.description}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Kullanıcı ID: {tx.user_id}
                          </p>
                          <p className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-amber-400">${tx.amount.toFixed(2)}</p>
                          <p className={`text-sm mt-1 ${
                            tx.status === 'completed' ? 'text-green-400' :
                            tx.status === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {tx.status === 'completed' ? 'Tamamlandı' :
                             tx.status === 'pending' ? 'Beklemede' :
                             'Reddedildi'}
                          </p>
                          {tx.crypto_type && (
                            <p className="text-gray-400 text-xs">{tx.crypto_type.toUpperCase()}</p>
                          )}
                        </div>
                      </div>
                      {tx.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            data-testid={`approve-tx-${idx}`}
                            onClick={() => handleApproveTransaction(tx.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Onayla
                          </Button>
                          <Button
                            data-testid={`reject-tx-${idx}`}
                            onClick={() => handleRejectTransaction(tx.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            Reddet
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Henüz işlem yok</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Placement Tab */}
          <TabsContent value="placement">
            <div className="grid gap-6">
              {/* Placement Form */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">Kullanıcı Yerleştirme</CardTitle>
                  <p className="text-sm text-gray-400">Kullanıcıları manuel olarak binary ağaça yerleştirin</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {/* Select User to Place */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Yerleştirilecek Kullanıcı
                      </label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Seçin...</option>
                        {users.filter(u => !u.is_admin).map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} - {u.email}
                            {u.upline_id ? ` (${u.position === 'left' ? 'Sol' : 'Sağ'} kolda)` : ' (Yerleşmemiş)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Upline */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Üst Sponsor (Upline)
                      </label>
                      <select
                        value={selectedUpline}
                        onChange={(e) => setSelectedUpline(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Seçin...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} - {u.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Pozisyon
                      </label>
                      <div className="flex gap-4 mt-3">
                        <label className="flex items-center text-white cursor-pointer">
                          <input
                            type="radio"
                            value="left"
                            checked={selectedPosition === 'left'}
                            onChange={(e) => setSelectedPosition(e.target.value)}
                            className="mr-2"
                          />
                          Sol Kol
                        </label>
                        <label className="flex items-center text-white cursor-pointer">
                          <input
                            type="radio"
                            value="right"
                            checked={selectedPosition === 'right'}
                            onChange={(e) => setSelectedPosition(e.target.value)}
                            className="mr-2"
                          />
                          Sağ Kol
                        </label>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePlaceUser}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                  >
                    Kullanıcıyı Yerleştir
                  </Button>
                </CardContent>
              </Card>

              {/* Placement History */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">Yerleştirme Geçmişi</CardTitle>
                  <p className="text-sm text-gray-400">Son 100 yerleştirme kaydı</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left text-gray-400 pb-3">Tarih</th>
                          <th className="text-left text-gray-400 pb-3">Kullanıcı</th>
                          <th className="text-left text-gray-400 pb-3">Yeni Upline</th>
                          <th className="text-left text-gray-400 pb-3">Pozisyon</th>
                          <th className="text-left text-gray-400 pb-3">İşlem</th>
                          <th className="text-left text-gray-400 pb-3">Admin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {placementHistory.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center text-gray-400 py-8">
                              Henüz yerleştirme geçmişi yok
                            </td>
                          </tr>
                        ) : (
                          placementHistory.map((record) => (
                            <tr key={record.id} className="border-b border-slate-800">
                              <td className="py-3 text-white">
                                {new Date(record.created_at).toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-3 text-white">{record.user_name || 'N/A'}</td>
                              <td className="py-3 text-white">{record.new_upline_name || 'N/A'}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  record.new_position === 'left' 
                                    ? 'bg-blue-500/20 text-blue-300' 
                                    : 'bg-purple-500/20 text-purple-300'
                                }`}>
                                  {record.new_position === 'left' ? 'Sol Kol' : 'Sağ Kol'}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  record.action_type === 'initial_placement'
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-orange-500/20 text-orange-300'
                                }`}>
                                  {record.action_type === 'initial_placement' ? 'İlk Yerleşim' : 'Yeniden Yerleşim'}
                                </span>
                              </td>
                              <td className="py-3 text-gray-400">{record.admin_name}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">Tüm Kullanıcılar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((u, idx) => (
                    <div key={idx} data-testid={`user-${idx}`} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-white font-semibold text-lg">{u.name}</p>
                            {u.is_admin && (
                              <span className="bg-amber-500 text-slate-900 text-xs px-2 py-1 rounded font-bold">ADMIN</span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">E-posta</p>
                              <p className="text-gray-300">{u.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Kullanıcı ID</p>
                              <p className="text-gray-300 font-mono text-xs">{u.id}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Referans Kodu</p>
                              <p className="text-amber-400 font-mono">{u.referral_code}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Kayıt Tarihi</p>
                              <p className="text-gray-300">{new Date(u.created_at).toLocaleDateString('tr-TR', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Son Giriş</p>
                              <p className="text-green-400">
                                {u.last_login ? new Date(u.last_login).toLocaleDateString('tr-TR', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Henüz giriş yapmadı'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4 space-y-1">
                          <p className="text-amber-400 font-semibold text-lg">{u.package ? u.package.toUpperCase() : 'Paket Yok'}</p>
                          <p className="text-gray-400 text-sm">Bakiye: ${u.wallet_balance?.toLocaleString('tr-TR') || '0'}</p>
                          <p className="text-gray-400 text-sm">Yatırım: ${u.total_invested?.toLocaleString('tr-TR') || '0'}</p>
                          <p className="text-gray-400 text-sm">Komisyon: ${u.total_commissions?.toLocaleString('tr-TR') || '0'}</p>
                        </div>
                      </div>
                      {!u.is_admin && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={() => openProfitModal(u)}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                          >
                            💰 Kar Dağıt
                          </Button>
                          <Button
                            data-testid={`make-admin-${idx}`}
                            onClick={() => handleMakeAdmin(u.id)}
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                          >
                            Admin Yap
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            Kullanıcıyı Sil
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}