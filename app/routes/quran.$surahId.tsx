import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { quranAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import type { Surah, Verse } from "~/types";

export default function SurahDetailPage() {
  const { surahId } = useParams();
  const { user } = useAuth();
  const [surah, setSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

  useEffect(() => {
    if (!surahId) return;
    setLoading(true);
    quranAPI
      .getSurah(Number(surahId))
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data) {
          setSurah({
            id: data.id || Number(surahId),
            name: data.name,
            nameArabic: data.nameArabic || data.name_arabic,
            nameTransliteration: data.nameTransliteration || data.name_transliteration || data.name,
            revelationPlace: data.revelationPlace || data.revelation_place,
            versesCount: data.versesCount || data.verses_count || data.verses?.length || 0,
          });
          const rawVerses: any[] = data.verses || [];
          setVerses(
            rawVerses.map((v: any) => {
              // Get translation from either flat field or translations array
              let translation = v.textTranslation || v.text_translation || "";
              if (!translation && v.translations?.length > 0) {
                translation = v.translations[0].text || "";
              }
              return {
                id: v.id,
                surahId: v.surahId || v.surah_id || Number(surahId),
                verseNumber: v.verseNumber || v.verse_number || v.id,
                textArabic: v.textArabic || v.text_arabic || "",
                textTranslation: translation,
                textTransliteration: v.textTransliteration || v.text_transliteration,
              };
            })
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [surahId]);

  const handleCopy = async (verse: Verse) => {
    const text = `${verse.textArabic}\n${verse.textTranslation}\n— Surah ${surah?.nameTransliteration}, ${verse.verseNumber}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVerse(verse.verseNumber || verse.id);
      setTimeout(() => setCopiedVerse(null), 2000);
    } catch {}
  };

  const handleBookmark = async (verse: Verse) => {
    if (!user) return;
    try {
      await quranAPI.addBookmark(Number(surahId), verse.verseNumber || 1);
    } catch {}
  };

  const prevSurah = Number(surahId) > 1 ? Number(surahId) - 1 : null;
  const nextSurah = Number(surahId) < 114 ? Number(surahId) + 1 : null;

  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero */}
      <section className="bg-hero-warm text-white pattern-islamic">
        <div className="container-faith py-8 md:py-12">
          <Link
            to="/quran"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            All Surahs
          </Link>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-10 w-48 bg-white/10 rounded-lg mb-3" />
              <div className="h-5 w-32 bg-white/10 rounded-lg" />
            </div>
          ) : surah ? (
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-4">
                <BookOpen size={14} />
                Surah {surah.id}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">
                {surah.nameTransliteration}
              </h1>
              <p className="font-amiri text-2xl sm:text-3xl text-white/70 mb-3">
                {surah.nameArabic}
              </p>
              <div className="flex items-center justify-center gap-4 text-white/50 text-sm">
                <span>{surah.versesCount} Ayahs</span>
                {surah.revelationPlace && (
                  <>
                    <span>·</span>
                    <span>{surah.revelationPlace}</span>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="container-faith py-8 md:py-12 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-text-muted text-sm">Loading verses...</p>
          </div>
        ) : verses.length > 0 ? (
          <>
            {/* Bismillah */}
            {Number(surahId) !== 9 && Number(surahId) !== 1 && (
              <div className="text-center mb-8">
                <p className="font-amiri text-2xl sm:text-3xl text-text leading-relaxed" dir="rtl">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <p className="text-sm text-text-muted mt-2">
                  In the name of Allah, the Most Gracious, the Most Merciful
                </p>
              </div>
            )}

            {/* Verses */}
            <div className="space-y-4 stagger-children">
              {verses.map((verse) => {
                const verseNum = verse.verseNumber || verse.id;
                const arabicText = verse.textArabic || "";
                const translation = verse.textTranslation || "";
                const isCopied = copiedVerse === verseNum;

                return (
                  <div key={verseNum} className="card p-5 sm:p-6">
                    {/* Verse Number + Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{verseNum}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(verse)}
                          className="p-2 rounded-lg hover:bg-black/3 text-text-muted hover:text-text transition-colors"
                          title="Copy verse"
                        >
                          {isCopied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                        </button>
                        {user && (
                          <button
                            onClick={() => handleBookmark(verse)}
                            className="p-2 rounded-lg hover:bg-black/3 text-text-muted hover:text-primary transition-colors"
                            title="Bookmark"
                          >
                            <Bookmark size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Arabic Text */}
                    {arabicText && (
                      <p
                        className="font-amiri text-2xl sm:text-[1.75rem] text-text leading-[2.2] text-right mb-4"
                        dir="rtl"
                      >
                        {arabicText}
                      </p>
                    )}

                    {/* Translation */}
                    {translation && (
                      <p className="text-text-secondary text-sm sm:text-[0.9375rem] leading-relaxed">
                        {translation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border-light">
              {prevSurah ? (
                <Link
                  to={`/quran/${prevSurah}`}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <ChevronLeft size={16} />
                  Previous Surah
                </Link>
              ) : (
                <div />
              )}
              {nextSurah ? (
                <Link
                  to={`/quran/${nextSurah}`}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Next Surah
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-text-secondary">No verses available for this Surah.</p>
          </div>
        )}
      </div>
    </div>
  );
}
