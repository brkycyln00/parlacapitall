import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: 'ParlaCapital nedir?',
      answer: 'ParlaCapital, kripto para piyasalarında profesyonel yatırım hizmeti sunan bir platformdur. Özel yazılım ve analitik altyapımızla müşterilerimizin dijital varlıklarını yöneterek haftalık %5 sabit getiri sağlıyoruz.'
    },
    {
      question: 'Nasıl üye olabilirim?',
      answer: 'Üyelik için bir referans linkine ihtiyacınız var. Bir arkadaşınız sizi davet ettiyse, onun referans linkine tıklayarak kaydolabilirsiniz. Daha sonra Google hesabınızla giriş yaparak size uygun paketi seçebilirsiniz.'
    },
    {
      question: 'Minimum yatırım tutarı nedir?',
      answer: 'Minimum yatırım tutarı Silver paketi için $250\'dir. Daha yüksek komisyon oranları ve avantajlar için Gold ($500) veya Platinum ($1000) paketlerini tercih edebilirsiniz.'
    },
    {
      question: 'Haftalık %5 getiri nasıl hesaplanır?',
      answer: 'Yatırımınızın her hafta %5\'i otomatik olarak hesabınıza eklenir. Örneğin, $1000 yatırım yaptıysanız her hafta $50 kar elde edersiniz. Bu işlem her pazartesi otomatik olarak gerçekleşir.'
    },
    {
      question: 'Referans komisyonları nasıl çalışır?',
      answer: 'Arkadaşlarınızı davet ettiğinizde, onların seçtiği pakete göre komisyon kazanırsınız. Silver paket için %5, Gold paket için %10, Platinum paket için %15 komisyon alırsınız. Komisyon, yatırım tutarı üzerinden hesaplanır ve hemen hesabınıza eklenir.'
    },
    {
      question: 'Binary kazanç sistemi nedir?',
      answer: 'Binary sistem, ağınızın sol ve sağ kollarında oluşan satış hacimlerine göre kazanç sağlar. Her iki kolda da $1000 + $1000 hacim oluştuğunda $100 binary kazanç elde edersiniz. Bu sistem 11. seviyeye kadar aktiftir.'
    },
    {
      question: 'Kariyer seviyeleri nasıl çalışır?',
      answer: 'Ağınızdaki toplam satış hacmine göre kariyer seviyelerinde yükselirsiniz. Her seviye için belirli puan hedefleri vardır (1 puan = $1 satış). Amethyst seviyesinden başlayarak Crown seviyesine kadar çıkabilir ve toplam $32.000 + 0 km TOGG ödül kazanabilirsiniz.'
    },
    {
      question: 'Hangi kripto paralarla ödeme yapabilirim?',
      answer: 'USDT (Tether), BTC (Bitcoin) ve ETH (Ethereum) ile ödeme yapabilirsiniz. Tüm işlemler güvenli blockchain ağı üzerinden gerçekleşir.'
    },
    {
      question: 'Para çekme işlemi nasıl yapılır?',
      answer: 'Dashboard\'dan para çekme talebinde bulunabilirsiniz. Cüzdan bakiyeniz, çekmek istediğiniz miktar ve kripto cüzdan adresinizi girmeniz yeterlidir. Talepler admin onayından sonra işleme alınır.'
    },
    {
      question: 'Çekim süresi ne kadar?',
      answer: 'Çekim talepleri genellikle 24-48 saat içinde işleme alınır. Admin onayından sonra kripto cüzdanınıza transfer yapılır. Blockchain ağı yoğunluğuna bağlı olarak transfer süresi değişebilir.'
    },
    {
      question: 'Kazancımı nasıl takip edebilirim?',
      answer: 'Dashboard\'dan tüm kazancınızı detaylı olarak takip edebilirsiniz. Haftalık karlar, referans komisyonları, binary kazançlar ve kariyer ödülleri ayrı ayrı gösterilir. Ayrıca tüm işlem geçmişinizi de görebilirsiniz.'
    },
    {
      question: 'Referans linkim nerede?',
      answer: 'Giriş yaptıktan sonra Dashboard\'da referans linkinizi ve kodunuzu bulabilirsiniz. Bu linki arkadaşlarınızla paylaşarak onları sisteme davet edebilir ve komisyon kazanabilirsiniz.'
    },
    {
      question: 'Güvenli mi?',
      answer: 'Evet, platformumuz bankacılık seviyesinde güvenlik protokolleri kullanır. Tüm veriler şifrelenir ve kripto işlemleri güvenli blockchain ağı üzerinden yapılır. 5 yıllık tecrübemiz ve binlerce mutlu müşterimizle güvenilir bir platformuz.'
    },
    {
      question: 'Destek nasıl alabilirim?',
      answer: 'www.parlacapital.com adresinden veya İletişim sayfasındaki form aracılığıyla bize ulaşabilirsiniz. Profesyonel destek ekibimiz 7/24 hizmetinizdedir.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-xl">P</span>
              </div>
              <span className="text-2xl font-bold text-white">ParlaCapital</span>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10">
              Ana Sayfa
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Sıkça Sorulan Sorular</h1>
          <p className="text-xl text-gray-300">Merak ettiğiniz her şey burada</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-8">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-amber-500/20">
                <AccordionTrigger className="text-left text-white hover:text-amber-400 text-lg font-semibold py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 text-base leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-2 border-amber-500 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Başka sorularınız mı var?</h2>
          <p className="text-gray-300 mb-6">Destek ekibimiz size yardımcı olmaktan mutluluk duyar</p>
          <Button onClick={() => navigate('/contact')} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-8 py-6 text-lg font-bold">
            Bize Ulaşın
          </Button>
        </div>
      </div>
    </div>
  );
}