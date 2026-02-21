import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'en' | 'ar' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.name': 'Unified Faith',
    'nav.calendar': 'Calendar',
    'nav.prayers': 'Prayers',
    'nav.quran': 'Quran',
    'nav.dhikr': 'Dhikr',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Sign Out',
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
  },
  ar: {
    'app.name': 'توحيد الإيمان',
    'nav.calendar': 'التقويم',
    'nav.prayers': 'أوقات الصلاة',
    'nav.quran': 'القرآن الكريم',
    'nav.dhikr': 'الأذكار',
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'تسجيل جديد',
    'auth.logout': 'تسجيل الخروج',
    'settings.language': 'اللغة',
    'settings.notifications': 'إشعارات',
  },
  ur: {
    'app.name': 'یونیفائیڈ فیتھ',
    'nav.calendar': 'کیلنڈر',
    'nav.prayers': 'نماز کے اوقات',
    'nav.quran': 'قرآن مجید',
    'nav.dhikr': 'اذکار',
    'auth.login': 'لاگ ان',
    'auth.register': 'رجسٹر',
    'auth.logout': 'سائن آؤٹ',
    'settings.language': 'زبان',
    'settings.notifications': 'نوٹیفیکیشن',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['en', 'ar', 'ur'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const dir = language === 'en' ? 'ltr' : 'rtl';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
