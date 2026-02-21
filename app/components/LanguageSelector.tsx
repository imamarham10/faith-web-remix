import React from 'react';
import { X, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageSelector({ isOpen, onClose }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  if (!isOpen) return null;

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold font-quicksand text-white mb-6">
          Select Language
        </h3>

        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as any);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                language === lang.code
                  ? 'bg-gradient-to-r from-gold to-gold-light'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className={`text-sm font-bold ${language === lang.code ? 'text-white' : 'text-white'}`}>
                  {lang.name}
                </span>
                <span className={`text-xs ${language === lang.code ? 'text-white/80' : 'text-white/60'}`}>
                  {lang.native}
                </span>
              </div>
              {language === lang.code && (
                <Check className="w-5 h-5 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
