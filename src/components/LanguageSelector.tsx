import React from 'react';
import { Globe } from 'lucide-react';
import { User } from '../types';

interface LanguageSelectorProps {
  activeUser: User | null;
  onUpdateUserProfile: (updates: Partial<User>) => void;
  t: (key: string) => string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  activeUser,
  onUpdateUserProfile,
  t,
}) => {
  const currentLang = activeUser?.language || localStorage.getItem('xguard_lang') || 'fa';

  const handleSelectLanguage = (newLang: 'fa' | 'en') => {
    localStorage.setItem('xguard_lang', newLang);
    onUpdateUserProfile({ language: newLang });
    
    // Dispatch custom event to notify other components (like LockScreen if it wants to sync)
    window.dispatchEvent(new Event('xguard_lang_changed'));
  };

  return (
    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3" id="persistent-language-selector">
      <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5 justify-start">
        <Globe className="w-4 h-4 text-cyan-400" />
        <span>{t('lang_picker_title')}</span>
      </h4>
      <p className="text-[9px] text-slate-500 leading-normal text-right">
        {t('lang_picker_desc')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { id: 'fa', name: 'فارسی (Persian)', desc: 'زبان فارسی پیش‌فرض سیستم' },
          { id: 'en', name: 'English (Gamers Slang)', desc: 'Colloquial english with sleek vibe' }
        ].map((langObj) => {
          const isCurrent = currentLang === langObj.id;
          return (
            <button
              key={langObj.id}
              onClick={() => handleSelectLanguage(langObj.id as 'fa' | 'en')}
              className={`p-3 rounded-xl border text-right transition cursor-pointer flex gap-2 items-center justify-between ${
                isCurrent
                  ? 'border-cyan-500/80 bg-slate-900 shadow-md'
                  : 'border-slate-850 bg-slate-950/40 hover:bg-slate-900'
              }`}
            >
              <div className="leading-tight flex-1">
                <p className="text-[10px] font-black text-slate-200">{langObj.name}</p>
                <p className="text-[8px] text-slate-500 mt-0.5">{langObj.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
