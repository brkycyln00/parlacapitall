import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="flex gap-2 bg-slate-800/90 backdrop-blur-sm border-2 border-amber-500/30 rounded-full p-2 shadow-lg">
        {/* Turkish Button */}
        <button
          onClick={() => setLanguage('tr')}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            language === 'tr' 
              ? 'bg-amber-500 border-2 border-amber-400 shadow-lg shadow-amber-500/50 scale-105' 
              : 'bg-slate-700/50 border-2 border-transparent hover:border-amber-500/50 hover:bg-slate-600/50'
          }`}
          aria-label="Türkçe"
          title="Türkçe"
        >
          <span className="text-2xl">🇹🇷</span>
        </button>

        {/* English Button */}
        <button
          onClick={() => setLanguage('en')}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            language === 'en' 
              ? 'bg-amber-500 border-2 border-amber-400 shadow-lg shadow-amber-500/50 scale-105' 
              : 'bg-slate-700/50 border-2 border-transparent hover:border-amber-500/50 hover:bg-slate-600/50'
          }`}
          aria-label="English"
          title="English"
        >
          <span className="text-white font-bold text-lg">EN</span>
        </button>
      </div>
    </div>
  );
}
