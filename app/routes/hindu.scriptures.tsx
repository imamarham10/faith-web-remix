import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLoaderData } from "react-router";
import {
  Search,
  BookOpen,
  Loader2,
  Bookmark,
  Sparkles,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { hinduScripturesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

// ---------- Types ----------

interface ScriptureText {
  id: string;
  slug: string;
  nameEnglish: string;
  nameSanskrit: string;
  type: string;
  totalVerses: number;
  isPremium?: boolean;
  chapterCount?: number;
}

interface ScriptureChapter {
  id: string;
  chapterNumber: number;
  nameSanskrit: string;
  nameEnglish: string;
  verseCount: number;
}

interface ScriptureTextDetail extends Omit<ScriptureText, "chapterCount"> {
  chapters: ScriptureChapter[];
}

interface VerseTranslation {
  id?: string;
  languageCode: string;
  authorName?: string;
  text: string;
}

interface ScriptureVerse {
  id: string;
  verseNumber: number;
  sanskritText: string;
  transliteration?: string;
  isFeatured?: boolean;
  chapter?: { chapterNumber: number; nameEnglish?: string };
  text?: { slug: string; nameEnglish: string };
  translations?: VerseTranslation[];
}

// ---------- Loader (SSR, public data) ----------

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const get = async (path: string) => {
    try {
      const res = await fetch(`${API_BASE}${path}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || json;
    } catch {
      return null;
    }
  };

  const [texts, gita, featured] = await Promise.all([
    get("/api/v1/hindu/scriptures/texts"),
    get("/api/v1/hindu/scriptures/texts/bhagavad-gita"),
    get("/api/v1/hindu/scriptures/featured?lang=en&slug=bhagavad-gita"),
  ]);

  return {
    texts: Array.isArray(texts) ? texts : [],
    gita: gita && gita.slug ? gita : null,
    featured: Array.isArray(featured) ? featured : [],
  };
}

// ---------- Meta ----------

const APP_URL = "https://www.siraat.website";

export function meta() {
  const title = "Hindu Scriptures Online — Bhagavad Gita & Valmiki Ramayana | Siraat";
  const description =
    "Read the Bhagavad Gita (18 chapters) and the complete Valmiki Ramayana (7 kandas, 19,371 shlokas) verse by verse — Devanagari Sanskrit, IAST transliteration, and English translation.";
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: `${APP_URL}/hindu/scriptures` },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: `${APP_URL}/hindu/scriptures` },
    ...HINDU_OG_TAGS,
  ];
}

// ---------- Page ----------

export default function HinduScriptures() {
  const {
    texts: loaderTexts,
    gita: loaderGita,
    featured: loaderFeatured,
  } = useLoaderData<typeof loader>();
  const { isAuthenticated } = useAuth();

  const [texts, setTexts] = useState<ScriptureText[]>(loaderTexts || []);
  const [gita, setGita] = useState<ScriptureTextDetail | null>(loaderGita || null);
  const [featured, setFeatured] = useState<ScriptureVerse[]>(loaderFeatured || []);
  const [loading, setLoading] = useState(!loaderGita);
  const [error, setError] = useState("");

  // Debounced verse search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScriptureVerse[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!q.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    timerRef.current = setTimeout(() => {
      hinduScripturesAPI
        .search(q)
        .then((res) => {
          const data = res.data?.data || res.data;
          setResults(Array.isArray(data) ? data : []);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Client-side fallback when SSR loader could not reach the API
  useEffect(() => {
    if (loaderGita) return;
    Promise.all([
      hinduScripturesAPI.getTexts().catch(() => null),
      hinduScripturesAPI.getText("bhagavad-gita").catch(() => null),
      hinduScripturesAPI.getFeatured().catch(() => null),
    ])
      .then(([t, g, f]) => {
        const tData = t?.data?.data || t?.data;
        const gData = g?.data?.data || g?.data;
        const fData = f?.data?.data || f?.data;
        if (Array.isArray(tData)) setTexts(tData);
        if (gData?.slug) setGita(gData);
        if (Array.isArray(fData)) setFeatured(fData);
        if (!gData?.slug) setError("Failed to load scriptures. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [loaderGita]);

  const isSearchActive = query.trim().length > 0;

  // The API lists texts alphabetically; kandas must appear in epic order.
  const RAMAYANA_ORDER = [
    "ramayana-bala-kanda",
    "ramayana-ayodhya-kanda",
    "ramayana-aranya-kanda",
    "ramayana-kishkindha-kanda",
    "ramayana-sundara-kanda",
    "ramayana-yuddha-kanda",
    "ramayana-uttara-kanda",
  ];
  const kandas = RAMAYANA_ORDER.map((slug) =>
    texts.find((t) => t.slug === slug),
  ).filter((t): t is ScriptureText => Boolean(t));

  return (
    <div className="min-h-screen bg-[#FBF6EC]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
            { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
            {
              "@type": "ListItem",
              position: 3,
              name: "Scriptures",
              item: `${APP_URL}/hindu/scriptures`,
            },
          ],
        }}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <BookOpen size={12} />
              Scriptures
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight mb-3">
              Sacred Texts
            </h1>
            <p
              className="text-[#E8D5A0] text-2xl mb-4"
              style={{ fontFamily: "var(--font-devanagari)" }}
              lang="sa"
            >
              गीता · रामायणम्
            </p>
            <p className="text-white/80 text-base max-w-xl mx-auto mb-8">
              The Bhagavad Gita and the complete Valmiki Ramayana — read verse
              by verse in Devanagari Sanskrit with transliteration and English
              translation.
            </p>

            {/* Verse search */}
            <div className="max-w-xl mx-auto relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80"
              />
              <input
                type="text"
                placeholder="Search verses — try “surrender” or “karma”..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl py-3.5 pl-11 pr-5 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-faith py-10 md:py-14">
        {/* Search results take over the page body while a query is active */}
        {isSearchActive ? (
          <section aria-labelledby="search-heading">
            <div className="flex items-center justify-between mb-5">
              <h2
                id="search-heading"
                className="font-playfair text-2xl font-bold text-[#3A0F18]"
              >
                {searching
                  ? "Searching..."
                  : `${results.length} result${results.length !== 1 ? "s" : ""} for “${query}”`}
              </h2>
              <button
                onClick={() => handleSearch("")}
                className="text-sm font-semibold text-[#6B1F2A] hover:underline"
              >
                Clear search
              </button>
            </div>

            {searching ? (
              <div className="flex flex-col items-center py-20 gap-3">
                <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
                <p className="text-sm text-[#6B5642]">Searching verses…</p>
              </div>
            ) : results.length === 0 ? (
              <EmptyCard
                title="No verses found"
                subtitle={`Nothing matched “${query}”. Try a different word — search covers English translations and transliterations.`}
              />
            ) : (
              <div className="space-y-4">
                {results.map((v) => (
                  <VerseCard key={v.id} verse={v} />
                ))}
              </div>
            )}
          </section>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
            <p className="text-sm text-[#6B5642]">Loading scriptures…</p>
          </div>
        ) : error && !gita ? (
          <ErrorCard message={error} />
        ) : (
          <div className="space-y-10 md:space-y-12">
            {/* Bhagavad Gita — flagship */}
            <section aria-labelledby="texts-heading">
              <div className="flex items-center justify-between mb-5">
                <SectionTitle
                  id="texts-heading"
                  eyebrow="Smriti"
                  title="Bhagavad Gita"
                />
                {isAuthenticated && (
                  <Link
                    to="/hindu/scriptures/bookmarks"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B1F2A] hover:underline shrink-0"
                  >
                    <Bookmark size={15} />
                    My Bookmarks
                  </Link>
                )}
              </div>
              {!gita && texts.length === 0 ? (
                <EmptyCard
                  title="No scriptures available yet"
                  subtitle="Sacred texts are being prepared. Please check back soon."
                />
              ) : (
                <Link
                  to="/hindu/scriptures/bhagavad-gita"
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl bg-white border border-[#6B1F2A]/15 hover:border-[#6B1F2A]/40 p-6 md:p-7 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-2xl md:text-3xl text-[#3A0F18] font-semibold mb-1.5 leading-tight"
                      style={{ fontFamily: "var(--font-devanagari)" }}
                      lang="sa"
                    >
                      श्रीमद्भगवद्गीता
                    </p>
                    <h3 className="text-lg font-bold text-[#1A1D23] tracking-tight mb-2 group-hover:text-[#6B1F2A] transition-colors">
                      Bhagavad Gita
                    </h3>
                    <p className="text-sm text-[#6B5642]">
                      18 chapters · 701 verses · Hindi &amp; English narration ·
                      सरल हिन्दी अनुवाद
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 self-start sm:self-center rounded-xl bg-[#6B1F2A] group-hover:bg-[#4A1119] text-white text-sm font-semibold px-5 py-2.5 transition-colors shrink-0">
                    Start reading
                    <ChevronRight size={15} />
                  </span>
                </Link>
              )}
            </section>

            {/* Chapters */}
            {gita && gita.chapters && gita.chapters.length > 0 && (
              <section aria-labelledby="chapters-heading">
                <SectionTitle
                  id="chapters-heading"
                  eyebrow="Adhyaya"
                  title="The 18 Chapters"
                  subtitle="Each chapter is a yoga — a path of practice and understanding"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {gita.chapters.map((ch) => (
                    <Link
                      key={ch.chapterNumber}
                      to={`/hindu/scriptures/${gita.slug}/${ch.chapterNumber}`}
                      className="group flex items-center gap-4 rounded-2xl bg-white border border-[#E8DCC4] hover:border-[#6B1F2A]/30 p-4 sm:p-5 transition-colors shadow-[0_1px_2px_rgba(74,17,25,0.04)]"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#6B1F2A]/8 flex items-center justify-center shrink-0 group-hover:bg-[#6B1F2A]/15 transition-colors">
                        <span className="text-sm font-bold text-[#6B1F2A]">
                          {ch.chapterNumber}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[0.9375rem] font-semibold text-[#3A0F18] group-hover:text-[#6B1F2A] transition-colors truncate">
                          {ch.nameEnglish}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs text-[#6B5642] truncate"
                            style={{ fontFamily: "var(--font-devanagari)" }}
                            lang="sa"
                          >
                            {ch.nameSanskrit}
                          </span>
                          <span className="text-[#C8A55A]">·</span>
                          <span className="text-xs text-[#6B5642] whitespace-nowrap">
                            {ch.verseCount} verses
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-[#9A7B3A] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Valmiki Ramayana — the seven kandas */}
            {kandas.length > 0 && (
              <section aria-labelledby="ramayana-heading">
                <SectionTitle
                  id="ramayana-heading"
                  eyebrow="Itihasa"
                  title="Valmiki Ramayana"
                  subtitle="The complete epic — seven kandas, 642 sargas, 19,371 shlokas in Sanskrit and English"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {kandas.map((k, i) => (
                    <Link
                      key={k.slug}
                      to={`/hindu/scriptures/${k.slug}`}
                      className="group flex items-center gap-4 rounded-2xl bg-white border border-[#E8DCC4] hover:border-[#6B1F2A]/30 p-4 sm:p-5 transition-colors shadow-[0_1px_2px_rgba(74,17,25,0.04)]"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#6B1F2A]/8 flex items-center justify-center shrink-0 group-hover:bg-[#6B1F2A]/15 transition-colors">
                        <span className="text-sm font-bold text-[#6B1F2A]">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[0.9375rem] font-semibold text-[#3A0F18] group-hover:text-[#6B1F2A] transition-colors truncate">
                          {k.nameEnglish.replace("Valmiki Ramayana — ", "")}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs text-[#6B5642] truncate"
                            style={{ fontFamily: "var(--font-devanagari)" }}
                            lang="sa"
                          >
                            {k.nameSanskrit}
                          </span>
                          <span className="text-[#C8A55A]">·</span>
                          <span className="text-xs text-[#6B5642] whitespace-nowrap">
                            {k.chapterCount} sargas
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-[#9A7B3A] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Featured verses */}
            <section aria-labelledby="featured-heading">
              <SectionTitle
                id="featured-heading"
                eyebrow="Amrita Vachana"
                title="Featured Verses"
                subtitle="Some of the most beloved teachings of the Gita"
              />
              {featured.length === 0 ? (
                <EmptyCard
                  title="No featured verses yet"
                  subtitle="Featured verses will appear here once available."
                />
              ) : (
                <div className="space-y-4">
                  {featured.map((v) => (
                    <VerseCard key={v.id} verse={v} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Pieces ----------

function SectionTitle({
  id,
  eyebrow,
  title,
  subtitle,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 md:mb-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B3A] font-semibold mb-1.5">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-playfair text-2xl md:text-3xl font-bold text-[#3A0F18] leading-tight"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-[#6B5642] mt-1.5 max-w-xl">{subtitle}</p>
      )}
    </div>
  );
}

function VerseCard({ verse }: { verse: ScriptureVerse }) {
  const chapterNumber = verse.chapter?.chapterNumber;
  const slug = verse.text?.slug || "bhagavad-gita";
  const translation = verse.translations?.[0];

  return (
    <article className="rounded-2xl bg-white border border-[#E8DCC4] p-5 sm:p-6 shadow-[0_1px_2px_rgba(74,17,25,0.04)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6B1F2A]/8 text-[#6B1F2A] text-xs font-semibold">
          <Sparkles size={11} />
          {verse.text?.nameEnglish || "Bhagavad Gita"}
        </span>
        {chapterNumber != null && (
          <span className="text-xs text-[#6B5642]">
            {chapterNumber}.{verse.verseNumber}
          </span>
        )}
      </div>
      {verse.sanskritText && (
        <p
          className="text-xl sm:text-2xl text-[#3A0F18] leading-relaxed mb-2"
          style={{ fontFamily: "var(--font-devanagari)" }}
          lang="sa"
        >
          {verse.sanskritText}
        </p>
      )}
      {verse.transliteration && (
        <p className="text-sm text-[#6B5642] italic leading-relaxed mb-2">
          {verse.transliteration}
        </p>
      )}
      {translation?.text && (
        <p className="text-[0.9375rem] text-[#1A1D23] leading-relaxed">
          {translation.text}
        </p>
      )}
      {chapterNumber != null && (
        <div className="mt-4 pt-3 border-t border-[#F1E7D2]">
          <Link
            to={`/hindu/scriptures/${slug}/${chapterNumber}?verse=${verse.verseNumber}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B1F2A] hover:underline"
          >
            <BookOpen size={14} />
            Read in context
          </Link>
        </div>
      )}
    </article>
  );
}

function EmptyCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#E8DCC4] p-10 text-center">
      <BookOpen size={32} className="text-[#9A7B3A] mx-auto mb-3" />
      <h3 className="text-base font-semibold text-[#3A0F18] mb-1">{title}</h3>
      <p className="text-sm text-[#6B5642] max-w-md mx-auto">{subtitle}</p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={22} />
      </div>
      <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
        Scriptures unavailable
      </h2>
      <p className="text-sm text-[#6B5642] mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="btn-hindu-primary"
      >
        Retry
      </button>
    </div>
  );
}
