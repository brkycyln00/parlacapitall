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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersRes, txRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { withCredentials: true }),
        axios.get(`${API}/admin/transactions`, { withCredentials: true }),
        axios.get(`${API}/admin/stats`, { withCredentials: true })
      ]);
      setUsers(usersRes.data);
      setTransactions(txRes.data);
      setStats(statsRes.data);
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
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-gray-400">ParlaCapital Yönetim Paneli</p>
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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
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
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="bg-slate-800 border border-amber-500/30">
            <TabsTrigger data-testid="transactions-tab" value="transactions" className="data-[state=active]:bg-amber-500">İşlemler</TabsTrigger>
            <TabsTrigger data-testid="users-tab" value="users" className="data-[state=active]:bg-amber-500">Kullanıcılar</TabsTrigger>
          </TabsList>

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
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold">{u.name}</p>
                            {u.is_admin && (
                              <span className="bg-amber-500 text-slate-900 text-xs px-2 py-1 rounded font-bold">ADMIN</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{u.email}</p>
                          <p className="text-gray-500 text-xs mt-1">ID: {u.id}</p>
                          <p className="text-gray-500 text-xs">Referans Kodu: {u.referral_code}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-amber-400 font-semibold">{u.package ? u.package.toUpperCase() : 'Paket Yok'}</p>
                          <p className="text-gray-400 text-sm">Bakiye: ${u.wallet_balance?.toFixed(2) || '0.00'}</p>
                          <p className="text-gray-400 text-sm">Yatırım: ${u.total_invested?.toFixed(2) || '0.00'}</p>
                          <p className="text-gray-400 text-sm">Komisyon: ${u.total_commissions?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      {!u.is_admin && (
                        <div className="mt-3">
                          <Button
                            data-testid={`make-admin-${idx}`}
                            onClick={() => handleMakeAdmin(u.id)}
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                          >
                            Admin Yap
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