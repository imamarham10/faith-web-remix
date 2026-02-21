import { quranAPI } from '../services/api';
import type { Verse } from '../types';

interface InspirationVerse {
  text: string;
  source: string;
  arabic?: string;
  translation?: string;
}

/**
 * Fetches verses matching "allah" and selects one deterministically based on the current date.
 */
export async function getDailyInspiration(): Promise<InspirationVerse | null> {
  try {
    // 1. Fetch verses matching "allah"
    const response = await quranAPI.searchVerses('allah');
    
    // Handle API response structure (it returns a list of verses)
    // The API response might be { data: Verse[] } or just Verse[] depending on the backend wrapper
    // Based on api.ts: api.get('/api/v1/islam/quran/search', { params: { q: query } })
    const results = response.data?.data || response.data;
    
    if (!Array.isArray(results) || results.length === 0) {
      console.warn('No verses found for daily inspiration');
      return null;
    }

    // 2. Select a random element based on the current date
    const today = new Date();
    // Create a seed from specific date components (year, month, day)
    // This ensures the same verse is selected for the entire day
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Simple seeded random to pick an index
    const index = seed % results.length;
    const selectedVerse = results[index];

    // 3. Map to InspirationVerse format
    const translation = Array.isArray(selectedVerse.translations) && selectedVerse.translations.length > 0
      ? selectedVerse.translations[0].text
      : selectedVerse.textTranslation || selectedVerse.text || "No translation available";

    const surahName = selectedVerse.surah?.nameEnglish || selectedVerse.surah?.nameTransliteration || selectedVerse.surah?.name || selectedVerse.surahId;

    return {
      text: translation,
      source: `Surah ${surahName} ${selectedVerse.verseNumber}`,
      arabic: selectedVerse.textArabic,
      translation: translation
    };

  } catch (error) {
    console.error('Failed to get daily inspiration:', error);
    return null;
  }
}
