export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PrayerTime {
  name: string;
  time: string;
}

export interface PrayerTimes {
  date: string;
  timings: {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    Sunrise?: string;
    Sunset?: string;
  };
  meta?: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: string;
  };
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameArabic: string;
  formatted: string;
}

export interface GregorianDate {
  day: number;
  month: number;
  year: number;
  formatted: string;
}

export interface CalendarDate {
  hijri: HijriDate;
  gregorian: GregorianDate;
}

export interface IslamicEvent {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  hijriMonth: number;
  hijriDay: number;
  significance: string;
}

export interface Surah {
  id: number;
  name: string;
  nameArabic: string;
  nameTransliteration: string;
  revelationPlace: 'Makkah' | 'Madinah';
  versesCount: number;
}

export interface Verse {
  id: number;
  surahId: number;
  verseNumber: number;
  textArabic: string;
  textTranslation: string;
  textTransliteration?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  surahId: number;
  verseNumber: number;
  note?: string;
  createdAt: string;
}

export interface DhikrCounter {
  id: string;
  userId: string;
  name: string;
  phraseArabic?: string;
  phraseEnglish?: string;
  count: number;
  targetCount?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DhikrGoal {
  id: string;
  userId: string;
  phraseArabic?: string;
  phraseEnglish?: string;
  targetCount: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  createdAt?: string;
  // Server-computed progress fields
  currentCount?: number;
  progressPercent?: number;
  daysRemaining?: number;
  isComplete?: boolean;
}

export interface DhikrStats {
  totalCount: number;
  dailyAverage: number;
  currentStreak: number;
  longestStreak: number;
  completedGoals?: number;
  mostRecitedPhrase?: string;
}

export interface DhikrHistoryEntry {
  id: string;
  date: string;
  phrase?: string;
  phraseArabic?: string;
  count: number;
  createdAt: string;
}

export interface PrayerLog {
  id: string;
  userId: string;
  prayerName: string;
  date: string;
  status: 'on_time' | 'late' | 'qada';
  createdAt: string;
}

export interface PrayerStats {
  totalPrayers: number;
  onTimePrayers: number;
  latePrayers: number;
  qadaPrayers: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

export interface Emotion {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Remedy {
  id: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  source: string;
}

export interface EmotionDetail extends Emotion {
  createdAt: string;
  updatedAt: string;
  remedies: Remedy[];
}

export interface DhikrPhrase {
  arabic: string;
  transliteration: string;
  english: string;
  category: string;
}

export interface Dua {
  id: string;
  categoryId: string;
  titleArabic: string;
  titleEnglish: string;
  textArabic: string;
  textTranslit?: string;
  textEnglish: string;
  reference?: string;
  audioUrl?: string;
  category?: DuaCategory;
}

export interface DuaCategory {
  id: string;
  name: string;
  nameArabic?: string;
  description?: string;
  duas?: Dua[];
}

export interface MuhammadName {
  id: number;
  nameArabic: string;
  nameTranslit: string;
  nameEnglish: string;
  meaning: string;
  description?: string | null;
  audioUrl?: string | null;
}

export interface UserPreference {
  id: string;
  userId: string;
  faith?: string;
  language?: string;
  countryCode?: string;
  timezone?: string;
  notificationPreferences?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
    dailyPacket?: boolean;
    aiGuru?: boolean;
  };
  contentPreferences?: {
    audioQuality?: 'standard' | 'high' | 'premium';
    downloadQuality?: 'standard' | 'high';
  };
}
