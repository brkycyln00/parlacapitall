import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '../components/Navbar';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navbar />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Hakkımızda</h1>
          <p className="text-xl text-gray-300">Kripto yatırımlarında güvenilir ortağınız</p>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Misyonumuz</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              ParlaCapital olarak, kripto para piyasalarında yatırımcılarımıza güvenli ve karlı 
              bir yatırım deneyimi sunmayı hedefliyoruz. Özel yazılım ve analitik altyapımızla, 
              müşterilerimizin dijital varlıklarını profesyonel bir şekilde yönetiyoruz.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Vizyonumuz</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Gelecek artık dijitalde değil, dijitalin ta kendisi! Kripto dünyasında lider bir 
              yatırım platformu olmayı ve her seviyeden yatırımcıya finansal özgürlük kapılarını 
              açmayı amaçlıyoruz.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Deneyimimiz</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              5 yıllık tecrübemizle kripto piyasalarında derin bir uzmanlık geliştirdik. 
              Binlerce yatırımcıya hizmet verdik ve onların finansal hedeflerine ulaşmalarına 
              yardımcı olduk. Güvenilir altyapımız ve şeffaf işleyişimizle sektörde öncü bir 
              konumdayız.
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-2 border-amber-500 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Neden ParlaCapital?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Güvenilir Altyapı</h3>
                  <p className="text-gray-300">Bankacılık seviyesinde güvenlik protokolleri</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Şeffaf İşleyiş</h3>
                  <p className="text-gray-300">Her işlem kayıt altında ve raporlanabilir</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Profesyonel Ekip</h3>
                  <p className="text-gray-300">Uzman analistler ve destek ekibi</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Garantili Getiri</h3>
                  <p className="text-gray-300">Haftalık %5 sabit kar garantisi</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button onClick={() => navigate('/packages')} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-12 py-6 text-lg font-bold">
              Yatırıma Başla
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}