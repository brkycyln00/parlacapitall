export const translations = {
  tr: {
    // Navbar
    nav: {
      home: 'Ana Sayfa',
      about: 'Hakkımızda',
      packages: 'Paketler',
      earningSystems: 'Kazanç Sistemleri',
      faq: 'SSS',
      contact: 'İletişim',
      login: 'Giriş Yap',
      dashboard: 'Panelim',
      admin: 'Admin',
      logout: 'Çıkış'
    },
    // Home Page
    home: {
      heroTitle1: 'Gelecek Artık Dijitalde Değil,',
      heroTitle2: 'Dijitalin Ta Kendisi!',
      heroDesc: 'ParlaCapital ile kripto piyasasında güvenli yatırım yapın. Haftalık %5 sabit getiri, referans komisyonları ve binary kazanç sistemiyle finansal özgürlüğünüze ulaşın.',
      getStarted: 'Hemen Başla',
      viewPackages: 'Paketleri İncele',
      activeInvestors: 'Aktif Yatırımcı',
      cryptoMarket: 'Kripto Piyasası',
      livePrices: 'Canlı fiyatlar - Her 60 saniyede güncellenir',
      howItWorks: 'Sistem Nasıl Çalışır?',
      howItWorksDesc: 'ParlaCapital, özel yazılım ve analitik altyapısıyla müşterilerinin kripto piyasasındaki yatırımlarını yönetir.',
      weeklyReturn: 'Haftalık %5 Sabit Getiri',
      weeklyReturnDesc: 'Yatırımınızın her hafta %5\'ini garantili olarak kazanın. Örneğin, $1000 yatırımla haftalık $50 kar elde edin.',
      referralCommissions: 'Referans Komisyonları',
      referralCommissionsDesc: 'Arkadaşlarınızı davet edin ve paketlerine göre %5, %10 veya %15 komisyon kazanın.',
      binarySystem: 'Binary Kazanç Sistemi',
      binarySystemDesc: 'Sol ve sağ ağınızda $1000 + $1000 satış yaparak $100 binary kazancı elde edin. 11. seviyeye kadar aktif.',
      careerLevels: 'Kariyer Seviyeleri',
      careerLevelsDesc: 'Ağ satış hacminizi artırarak özel ödüller kazanın',
      points: 'Puan',
      reward: 'Ödül',
      ctaTitle: 'Finansal Özgürlüğünüze Başlayın',
      ctaDesc: 'ParlaCapital ile kripto dünyasında güvenli ve karlı yatırım deneyimi yaşayın',
      joinNow: 'Üye Ol ve Kazanmaya Başla',
      footerDesc: 'Kripto yatırımlarınızı güvenle yönetin',
      footerCopyright: '© 2025 ParlaCapital. Tüm hakları saklıdır.'
    },
    // Auth Modal
    auth: {
      login: 'Giriş Yap',
      register: 'Kayıt Ol',
      email: 'E-posta',
      password: 'Şifre',
      name: 'Ad Soyad',
      referralCode: 'Referans Kodu (Opsiyonel)',
      or: 'veya',
      googleLogin: 'Google ile Giriş Yap'
    }
  },
  en: {
    // Navbar
    nav: {
      home: 'Home',
      about: 'About',
      packages: 'Packages',
      earningSystems: 'Earning Systems',
      faq: 'FAQ',
      contact: 'Contact',
      login: 'Login',
      dashboard: 'Dashboard',
      admin: 'Admin',
      logout: 'Logout'
    },
    // Home Page
    home: {
      heroTitle1: 'The Future Is Not Digital,',
      heroTitle2: 'It Is Digital Itself!',
      heroDesc: 'Invest securely in the crypto market with ParlaCapital. Achieve financial freedom with weekly 5% fixed returns, referral commissions, and binary earning system.',
      getStarted: 'Get Started',
      viewPackages: 'View Packages',
      activeInvestors: 'Active Investors',
      cryptoMarket: 'Crypto Market',
      livePrices: 'Live prices - Updates every 60 seconds',
      howItWorks: 'How It Works?',
      howItWorksDesc: 'ParlaCapital manages customer investments in the crypto market with its proprietary software and analytics infrastructure.',
      weeklyReturn: 'Weekly 5% Fixed Return',
      weeklyReturnDesc: 'Earn 5% of your investment guaranteed every week. For example, earn $50 weekly with $1000 investment.',
      referralCommissions: 'Referral Commissions',
      referralCommissionsDesc: 'Invite your friends and earn 5%, 10%, or 15% commission based on their packages.',
      binarySystem: 'Binary Earning System',
      binarySystemDesc: 'Earn $100 binary income by making $1000 + $1000 sales in your left and right network. Active up to level 11.',
      careerLevels: 'Career Levels',
      careerLevelsDesc: 'Increase your network sales volume and earn special rewards',
      points: 'Points',
      reward: 'Reward',
      ctaTitle: 'Start Your Financial Freedom',
      ctaDesc: 'Experience secure and profitable investment in the crypto world with ParlaCapital',
      joinNow: 'Join Now and Start Earning',
      footerDesc: 'Manage your crypto investments securely',
      footerCopyright: '© 2025 ParlaCapital. All rights reserved.'
    },
    // Auth Modal
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      name: 'Full Name',
      referralCode: 'Referral Code (Optional)',
      or: 'or',
      googleLogin: 'Login with Google'
    }
  }
};

export const t = (language, key) => {
  const keys = key.split('.');
  let value = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};
