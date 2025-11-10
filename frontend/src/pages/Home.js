import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_users: 0, total_volume: 0 });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/public/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-amber-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Gelecek Artık Dijitalde Değil,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Dijitalin Ta Kendisi!</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            ParlaCapital ile kripto piyasasında güvenli yatırım yapın. Haftalık %5 sabit getiri, 
            referans komisyonları ve binary kazanç sistemiyle finansal özgürlüğünüze ulaşın.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button onClick={handleLogin} data-testid="get-started-button" size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-6 rounded-full text-lg font-bold">
              Hemen Başla
            </Button>
            <Button onClick={() => navigate('/packages')} data-testid="view-packages-button" size="lg" variant="outline" className="border-2 border-amber-500 text-amber-400 hover:bg-amber-500/10 px-8 py-6 rounded-full text-lg font-semibold">
              Paketleri İncele
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto mt-16">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6">
              <div className="text-4xl font-bold text-amber-400 mb-2">{stats.total_users}+</div>
              <div className="text-gray-300">Aktif Yatırımcı</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6">
              <div className="text-4xl font-bold text-amber-400 mb-2">${stats.total_volume.toLocaleString()}+</div>
              <div className="text-gray-300">Toplam Yatırım Hacmi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-20 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Sistem Nasıl Çalışır?</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              ParlaCapital, özel yazılım ve analitik altyapısıyla müşterilerinin kripto piyasasındaki yatırımlarını yönetir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-8 hover:border-amber-500 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Haftalık %5 Sabit Getiri</h3>
              <p className="text-gray-400">Yatırımınızın her hafta %5'ini garantili olarak kazanın. Örneğin, $1000 yatırımla haftalık $50 kar elde edin.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-8 hover:border-amber-500 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Referans Komisyonları</h3>
              <p className="text-gray-400">Arkadaşlarınızı davet edin ve paketlerine göre %5, %10 veya %15 komisyon kazanın.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 rounded-2xl p-8 hover:border-amber-500 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Binary Kazanç Sistemi</h3>
              <p className="text-gray-400">Sol ve sağ ağınızda $1000 + $1000 satış yaparak $100 binary kazancı elde edin. 11. seviyeye kadar aktif.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Levels */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Kariyer Seviyeleri</h2>
            <p className="text-xl text-gray-400">Ağ satış hacminizi artırarak özel ödüller kazanın</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Amethyst', points: '5.000-5.000', reward: '$500', color: 'from-purple-400 to-purple-600' },
              { name: 'Sapphire', points: '10.000-10.000', reward: '$1.000', color: 'from-blue-400 to-blue-600' },
              { name: 'Ruby', points: '20.000-20.000', reward: '$3.000', color: 'from-red-400 to-red-600' },
              { name: 'Emerald', points: '50.000-50.000', reward: '$7.500', color: 'from-green-400 to-green-600' },
              { name: 'Diamond', points: '100.000-100.000', reward: '$20.000', color: 'from-cyan-400 to-cyan-600' },
              { name: 'Crown', points: '300.000-300.000', reward: '0 km TOGG', color: 'from-amber-400 to-amber-600' },
            ].map((level, idx) => (
              <div key={idx} className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6 hover:border-amber-500 transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${level.color} rounded-lg mb-4`}></div>
                <h3 className="text-2xl font-bold text-white mb-2">{level.name}</h3>
                <p className="text-gray-400 mb-1">Puan: {level.points}</p>
                <p className="text-amber-400 font-semibold text-lg">Ödül: {level.reward}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-amber-500 to-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">Finansal Özgürlüğünüze Başlayın</h2>
          <p className="text-xl text-slate-800 mb-8">
            ParlaCapital ile kripto dünyasında güvenli ve karlı yatırım deneyimi yaşayın
          </p>
          <Button onClick={handleLogin} data-testid="cta-button" size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-12 py-6 rounded-full text-lg font-bold">
            Üye Ol ve Kazanmaya Başla
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-amber-500/20 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_investparla/artifacts/pu93i0x2_ChatGPT%20Image%20Nov%209%2C%202025%2C%2008_35_50%20PM.png" 
              alt="ParlaCapital Logo" 
              className="h-12 w-auto"
            />
          </div>
          <p className="text-gray-400 mb-6">Kripto yatırımlarınızı güvenle yönetin</p>
          <p className="text-gray-500 text-sm">© 2025 ParlaCapital. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}