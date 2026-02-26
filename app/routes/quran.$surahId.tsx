import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
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
import { JsonLd } from "~/components/JsonLd";

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const id = params.surahId;
  if (!id) return { surah: null, verses: [] };
  try {
    const res = await fetch(`${API_BASE}/api/v1/islam/quran/surah/${id}`);
    if (!res.ok) return { surah: null, verses: [] };
    const json = await res.json();
    const data = json.data || json;
    if (!data) return { surah: null, verses: [] };

    const surah: Surah = {
      id: data.id || Number(id),
      name: data.name,
      nameArabic: data.nameArabic || data.name_arabic,
      nameTransliteration: data.nameTransliteration || data.name_transliteration || data.name,
      revelationPlace: data.revelationPlace || data.revelation_place,
      versesCount: data.versesCount || data.verses_count || data.verses?.length || 0,
    };

    const rawVerses: any[] = data.verses || [];
    const verses: Verse[] = rawVerses.map((v: any) => {
      let translation = v.textTranslation || v.text_translation || "";
      if (!translation && v.translations?.length > 0) {
        translation = v.translations[0].text || "";
      }
      return {
        id: v.id,
        surahId: v.surahId || v.surah_id || Number(id),
        verseNumber: v.verseNumber || v.verse_number || v.id,
        textArabic: v.textArabic || v.text_arabic || "",
        textTranslation: translation,
        textTransliteration: v.textTransliteration || v.text_transliteration,
      };
    });

    return { surah, verses };
  } catch {
    return { surah: null, verses: [] };
  }
}

export default function SurahDetailPage() {
  const { surahId } = useParams();
  const { user } = useAuth();
  const loaderData = useLoaderData<typeof loader>();
  const [surah, setSurah] = useState<Surah | null>(loaderData?.surah || null);
  const [verses, setVerses] = useState<Verse[]>(loaderData?.verses || []);
  const [loading, setLoading] = useState(loaderData?.surah ? false : true);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const [bookmarkedVerse, setBookmarkedVerse] = useState<number | null>(null);
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const [searchParams] = useSearchParams();
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);

  useEffect(() => {
    if (!surahId) return;
    if (loaderData?.surah && String(loaderData.surah.id) === surahId) return;
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

  // Scroll to and highlight a specific verse when ?verse=N is in the URL
  useEffect(() => {
    const verseParam = searchParams.get('verse');
    if (!verseParam || verses.length === 0) return;
    const verseNum = parseInt(verseParam, 10);
    if (isNaN(verseNum)) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const el = document.getElementById(`verse-${verseNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedVerse(verseNum);
        // Remove highlight after 30 seconds
        setTimeout(() => setHighlightedVerse(null), 30000);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [verses, searchParams]);

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
    const verseNum = verse.verseNumber || verse.id;
    try {
      await quranAPI.addBookmark(Number(surahId), verseNum);
      // Show inline icon feedback
      setBookmarkedVerse(verseNum);
      setTimeout(() => setBookmarkedVerse(null), 2500);
      // Show toast
      setShowBookmarkToast(true);
      setTimeout(() => setShowBookmarkToast(false), 2500);
    } catch {}
  };

  const prevSurah = Number(surahId) > 1 ? Number(surahId) - 1 : null;
  const nextSurah = Number(surahId) < 114 ? Number(surahId) + 1 : null;

  return (
    <div className="bg-gradient-surface min-h-screen">
      {surah && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `Surah ${surah.nameTransliteration || surah.name} - ${surah.nameArabic || surah.name}`,
          "description": `Read Surah ${surah.nameTransliteration || surah.name} (${surah.nameArabic || surah.name}) with Arabic text and English translation. ${surah.versesCount} Ayahs${surah.revelationPlace ? `, revealed in ${surah.revelationPlace}` : ""}.`,
          "url": `https://www.siraat.website/quran/${surah.id}`,
          "inLanguage": ["en", "ar"],
          "image": "https://www.siraat.website/og-image.png",
          "datePublished": "2026-02-01",
          "dateModified": new Date().toISOString().split("T")[0],
          "mainEntityOfPage": `https://www.siraat.website/quran/${surah.id}`,
          "author": { "@type": "Organization", "name": "Siraat", "url": "https://www.siraat.website" },
          "publisher": { "@type": "Organization", "name": "Siraat", "url": "https://www.siraat.website", "logo": { "@type": "ImageObject", "url": "https://www.siraat.website/og-image.png" } }
        }} />
      )}
      {/* Bookmark toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 bg-text text-white rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
          showBookmarkToast
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <BookmarkCheck size={16} className="text-primary shrink-0" />
        Verse saved to bookmarks
      </div>

      {/* Hero */}
      <section className="bg-hero-warm text-white pattern-islamic">
        <div className="container-faith py-8 md:py-12">
          <Link
            to="/quran"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm mb-6 transition-colors"
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
              <p className="font-amiri text-2xl sm:text-3xl text-white/80 mb-3">
                {surah.nameArabic}
              </p>
              <div className="flex items-center justify-center gap-4 text-white/90 text-sm">
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
                const isBookmarked = bookmarkedVerse === verseNum;

                return (
                  <div
                    key={verseNum}
                    id={`verse-${verseNum}`}
                    className={`card p-5 sm:p-6 transition-all duration-500 ${
                      highlightedVerse === verseNum
                        ? 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                        : ''
                    }`}
                  >
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
                            className="p-2 rounded-lg hover:bg-black/3 transition-colors"
                            title={isBookmarked ? "Bookmarked!" : "Bookmark this verse"}
                          >
                            {isBookmarked
                              ? <BookmarkCheck size={15} className="text-primary" />
                              : <Bookmark size={15} className="text-text-muted hover:text-primary" />
                            }
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
