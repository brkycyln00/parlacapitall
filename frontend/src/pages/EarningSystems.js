import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function EarningSystems() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_investparla/artifacts/pu93i0x2_ChatGPT%20Image%20Nov%209%2C%202025%2C%2008_35_50%20PM.png\" 
                alt="ParlaCapital Logo" 
                className="h-12 w-auto"
              />
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10">
              Ana Sayfa
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Kazanç Sistemleri</h1>
          <p className="text-xl text-gray-300">ParlaCapital ile çoklu gelir akışları yaratın</p>
        </div>

        <div className="space-y-12">
          {/* Weekly Profit */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-2xl p-8 hover:border-amber-500 transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4">1. Haftalık %5 Sabit Kar</h2>
                <p className="text-gray-300 text-lg mb-4">
                  Yatırımınızın her hafta %5'ini garantili olarak kazanın. Bu sistem tamamen otomatiktir 
                  ve her pazartesi hesabınıza eklenir.
                </p>
                <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                  <h3 className="text-amber-400 font-semibold mb-2">Örnek Hesaplama:</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• $250 yatırım → Haftalık $12.50 kar</li>
                    <li>• $500 yatırım → Haftalık $25 kar</li>
                    <li>• $1000 yatırım → Haftalık $50 kar</li>
                    <li>• Yıllık toplam: Yatırımın %260'ı (52 hafta × %5)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Commissions */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-2xl p-8 hover:border-amber-500 transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4">2. Referans Komisyonları</h2>
                <p className="text-gray-300 text-lg mb-4">
                  Arkadaşlarınızı davet edin ve onların yatırımlarından komisyon kazanın. 
                  Komisyon oranı seçtikleri pakete göre değişir.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 border-2 border-purple-500/30">
                    <h3 className="text-purple-400 font-bold text-xl mb-2">Silver Paketi</h3>
                    <p className="text-3xl font-bold text-white mb-1">%5</p>
                    <p className="text-gray-400">$250 yatırımdan</p>
                    <p className="text-amber-400 mt-2">= $12.50 komisyon</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border-2 border-amber-500/30">
                    <h3 className="text-amber-400 font-bold text-xl mb-2">Gold Paketi</h3>
                    <p className="text-3xl font-bold text-white mb-1">%10</p>
                    <p className="text-gray-400">$500 yatırımdan</p>
                    <p className="text-amber-400 mt-2">= $50 komisyon</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 border-2 border-cyan-500/30">
                    <h3 className="text-cyan-400 font-bold text-xl mb-2">Platinum Paketi</h3>
                    <p className="text-3xl font-bold text-white mb-1">%15</p>
                    <p className="text-gray-400">$1000 yatırımdan</p>
                    <p className="text-amber-400 mt-2">= $150 komisyon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Binary System */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-2xl p-8 hover:border-amber-500 transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4">3. Binary Kazanç Sistemi</h2>
                <p className="text-gray-300 text-lg mb-4">
                  Ağınızın her iki tarafında (sol ve sağ) $1000 + $1000 satış yaptığınızda $100 kazanırsınız. 
                  Bu sistem 11. seviyeye kadar aktiftir.
                </p>
                <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                  <h3 className="text-amber-400 font-semibold mb-3">Binary Sistemi Nasıl Çalışır?</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Her üye sol ve sağ olmak üzere 2 kolda ağ oluşturur</li>
                    <li>• Sol kolda $1000 ve sağ kolda $1000 hacim oluştuğunda $100 kazanırsınız</li>
                    <li>• Her $1000 + $1000 eşleşmesi için yeni $100 kazanç</li>
                    <li>• Maksimum 11 seviye derinliğine kadar geçerli</li>
                    <li>• Hacimler otomatik olarak yukarı doğru aktarılır</li>
                  </ul>
                  <div className="mt-4 p-4 bg-amber-500/20 border border-amber-500 rounded-lg">
                    <p className="text-amber-400 font-semibold">Örnek:</p>
                    <p className="text-gray-300">Sol kolda $5000, sağ kolda $3000 hacminiz var.</p>
                    <p className="text-green-400">→ 3 eşleşme × $100 = $300 binary kazanç</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Career Levels */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-2xl p-8 hover:border-amber-500 transition-all duration-300">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4">4. Kariyer Ödülleri</h2>
                <p className="text-gray-300 text-lg mb-4">
                  Ağ satış hacminizi artırdıkça kariyer seviyelerinde yükselir ve özel ödüller kazanırsınız. 
                  1 puan = $1 satış değeri.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {[
                    { name: 'Amethyst', points: '5.000-5.000', reward: '$500', color: 'from-purple-400 to-purple-600' },
                    { name: 'Sapphire', points: '10.000-10.000', reward: '$1.000', color: 'from-blue-400 to-blue-600' },
                    { name: 'Ruby', points: '20.000-20.000', reward: '$3.000', color: 'from-red-400 to-red-600' },
                    { name: 'Emerald', points: '50.000-50.000', reward: '$7.500', color: 'from-green-400 to-green-600' },
                    { name: 'Diamond', points: '100.000-100.000', reward: '$20.000', color: 'from-cyan-400 to-cyan-600' },
                    { name: 'Crown', points: '300.000-300.000', reward: '0 km TOGG', color: 'from-amber-400 to-amber-600' },
                  ].map((level, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded-lg p-4 border border-amber-500/20">
                      <div className={`w-10 h-10 bg-gradient-to-br ${level.color} rounded-lg mb-3`}></div>
                      <h3 className="text-xl font-bold text-white mb-1">{level.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">Hedef: {level.points} puan</p>
                      <p className="text-amber-400 font-bold">{level.reward}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-2xl text-white mb-6">4 farklı kazanç akışıyla pasif gelirinizi maksimize edin!</p>
          <Button onClick={() => navigate('/packages')} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-12 py-6 text-lg font-bold">
            Hemen Başla
          </Button>
        </div>
      </div>
    </div>
  );
}