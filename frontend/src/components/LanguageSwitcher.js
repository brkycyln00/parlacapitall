import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <button
        onClick={toggleLanguage}
        className="group relative bg-slate-800/90 backdrop-blur-sm border-2 border-amber-500/30 hover:border-amber-500 rounded-full p-3 shadow-lg hover:shadow-amber-500/20 transition-all duration-300 hover:scale-110"
        aria-label="Change Language"
      >
        {/* Flag Display */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          {language === 'tr' ? (
            // Turkish Flag
            <div className="text-4xl leading-none" title="Türkçe">
              🇹🇷
            </div>
          ) : (
            // English Flag
            <div className="text-4xl leading-none" title="English">
              🇬🇧
            </div>
          )}
        </div>
        
        {/* Hover Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          {language === 'tr' ? 'Switch to English' : 'Türkçe\'ye Geç'}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      </button>
    </div>
  );
}
