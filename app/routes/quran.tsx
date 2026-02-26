import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Search, BookOpen, Loader2, MapPin, ChevronRight, Bookmark } from "lucide-react";
import { quranAPI } from "~/services/api";
import type { Surah } from "~/types";
import { JsonLd } from "~/components/JsonLd";

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${API_BASE}/api/v1/islam/quran/surahs`);
    if (!res.ok) return { surahs: [] };
    const json = await res.json();
    return { surahs: json.data || json };
  } catch {
    return { surahs: [] };
  }
}

export default function QuranPage() {
  const { surahs: loaderSurahs } = useLoaderData<typeof loader>();
  const [surahs, setSurahs] = useState<Surah[]>(loaderSurahs || []);
  const [loading, setLoading] = useState(loaderSurahs?.length > 0 ? false : true);
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"surahs" | "verses">("surahs");
  const [verseQuery, setVerseQuery] = useState("");
  const [verseResults, setVerseResults] = useState<any[]>([]);
  const [verseSearchLoading, setVerseSearchLoading] = useState(false);
  const verseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVerseSearch = useCallback((query: string) => {
    setVerseQuery(query);
    if (verseTimerRef.current) clearTimeout(verseTimerRef.current);

    if (!query.trim()) {
      setVerseResults([]);
      setVerseSearchLoading(false);
      return;
    }

    setVerseSearchLoading(true);
    verseTimerRef.current = setTimeout(() => {
      quranAPI
        .searchVerses(query)
        .then((res) => {
          const data = res.data?.data || res.data;
          setVerseResults(Array.isArray(data) ? data : []);
        })
        .catch(() => setVerseResults([]))
        .finally(() => setVerseSearchLoading(false));
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (verseTimerRef.current) clearTimeout(verseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (loaderSurahs?.length > 0) return;
    quranAPI
      .getSurahs()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setSurahs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = surahs.filter(
    (s) =>
      s.nameTransliteration?.toLowerCase().includes(search.toLowerCase()) ||
      s.nameArabic?.includes(search) ||
      String(s.id).includes(search)
  );

  return (
    <div className="bg-gradient-surface min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "The Noble Quran - All 114 Surahs",
        "description": "Read the Holy Quran with Arabic text, English translation, and transliteration. Browse all 114 Surahs.",
        "url": "https://siraatt.vercel.app/quran",
        "mainEntity": {
          "@type": "ItemList",
          "name": "114 Surahs of the Holy Quran",
          "numberOfItems": 114,
          "itemListElement": Array.from({ length: 114 }, (_, i) => {
            const surahNames: Record<number, string> = {
              1:"Al-Fatihah",2:"Al-Baqarah",3:"Ali 'Imran",4:"An-Nisa",5:"Al-Ma'idah",6:"Al-An'am",7:"Al-A'raf",8:"Al-Anfal",9:"At-Tawbah",10:"Yunus",
              11:"Hud",12:"Yusuf",13:"Ar-Ra'd",14:"Ibrahim",15:"Al-Hijr",16:"An-Nahl",17:"Al-Isra",18:"Al-Kahf",19:"Maryam",20:"Taha",
              21:"Al-Anbiya",22:"Al-Hajj",23:"Al-Mu'minun",24:"An-Nur",25:"Al-Furqan",26:"Ash-Shu'ara",27:"An-Naml",28:"Al-Qasas",29:"Al-'Ankabut",30:"Ar-Rum",
              31:"Luqman",32:"As-Sajdah",33:"Al-Ahzab",34:"Saba",35:"Fatir",36:"Ya-Sin",37:"As-Saffat",38:"Sad",39:"Az-Zumar",40:"Ghafir",
              41:"Fussilat",42:"Ash-Shura",43:"Az-Zukhruf",44:"Ad-Dukhan",45:"Al-Jathiyah",46:"Al-Ahqaf",47:"Muhammad",48:"Al-Fath",49:"Al-Hujurat",50:"Qaf",
              51:"Adh-Dhariyat",52:"At-Tur",53:"An-Najm",54:"Al-Qamar",55:"Ar-Rahman",56:"Al-Waqi'ah",57:"Al-Hadid",58:"Al-Mujadila",59:"Al-Hashr",60:"Al-Mumtahanah",
              61:"As-Saff",62:"Al-Jumu'ah",63:"Al-Munafiqun",64:"At-Taghabun",65:"At-Talaq",66:"At-Tahrim",67:"Al-Mulk",68:"Al-Qalam",69:"Al-Haqqah",70:"Al-Ma'arij",
              71:"Nuh",72:"Al-Jinn",73:"Al-Muzzammil",74:"Al-Muddaththir",75:"Al-Qiyamah",76:"Al-Insan",77:"Al-Mursalat",78:"An-Naba",79:"An-Nazi'at",80:"'Abasa",
              81:"At-Takwir",82:"Al-Infitar",83:"Al-Mutaffifin",84:"Al-Inshiqaq",85:"Al-Buruj",86:"At-Tariq",87:"Al-A'la",88:"Al-Ghashiyah",89:"Al-Fajr",90:"Al-Balad",
              91:"Ash-Shams",92:"Al-Layl",93:"Ad-Duhaa",94:"Ash-Sharh",95:"At-Tin",96:"Al-'Alaq",97:"Al-Qadr",98:"Al-Bayyinah",99:"Az-Zalzalah",100:"Al-'Adiyat",
              101:"Al-Qari'ah",102:"At-Takathur",103:"Al-'Asr",104:"Al-Humazah",105:"Al-Fil",106:"Quraysh",107:"Al-Ma'un",108:"Al-Kawthar",109:"Al-Kafirun",110:"An-Nasr",
              111:"Al-Masad",112:"Al-Ikhlas",113:"Al-Falaq",114:"An-Nas"
            };
            return {
              "@type": "ListItem",
              "position": i + 1,
              "name": `Surah ${surahNames[i + 1] || i + 1}`,
              "url": `https://siraatt.vercel.app/quran/${i + 1}`
            };
          })
        }
      }} />
      {/* Hero */}
      <section className="bg-hero-warm text-white pattern-islamic">
        <div className="container-faith py-10 md:py-16 text-center">
          <div className="animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
              <BookOpen size={28} className="text-gold-light" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair mb-3">
              The Noble Quran
            </h1>
            <p className="text-white/90 text-base max-w-lg mx-auto mb-8">
              Read, reflect, and find guidance in the words of Allah
            </p>

            {/* Search Mode Toggle */}
            <div className="max-w-xl mx-auto mb-3">
              <div className="inline-flex items-center gap-1 bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => setSearchMode("surahs")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    searchMode === "surahs"
                      ? "bg-white/20 text-white"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  Filter Surahs
                </button>
                <button
                  onClick={() => setSearchMode("verses")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    searchMode === "verses"
                      ? "bg-white/20 text-white"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  Search Verses
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="max-w-xl mx-auto relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/90"
              />
              {searchMode === "surahs" ? (
                <input
                  type="text"
                  placeholder="Search by Surah name or number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-with-left-icon w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl py-3.5 pr-5 text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Search verses by keyword..."
                  value={verseQuery}
                  onChange={(e) => handleVerseSearch(e.target.value)}
                  className="input-with-left-icon w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl py-3.5 pr-5 text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
        {/* Educational Introduction */}
        <div className="card-elevated p-6 md:p-8 mb-8">
          <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">About the Holy Quran</h2>
          <div className="space-y-3">
            <p className="text-text-secondary text-sm leading-relaxed">
              The Quran is the central religious text of Islam, believed by Muslims to be the literal word of Allah as revealed to the Prophet Muhammad (peace be upon him) through the Angel Jibreel over a period of approximately 23 years, beginning in 610 CE. It comprises 114 chapters known as surahs, which range from the shortest at just three verses to the longest containing 286 verses. The surahs are broadly classified as Meccan or Medinan, reflecting whether they were revealed before or after the Prophet's migration to Medina. Meccan surahs tend to focus on matters of faith and the hereafter, while Medinan surahs often address social laws and community life.
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              This reader presents the Arabic text alongside the Saheeh International English translation, widely regarded for its clarity and faithfulness to the original meaning. You can browse all 114 surahs below, filter by name or number, or search directly through verses using keywords. Select any surah to read its full text with Arabic script, transliteration, and translation side by side.
            </p>
          </div>
        </div>

        {searchMode === "verses" ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-text-secondary">
                {verseSearchLoading
                  ? "Searching..."
                  : verseQuery
                  ? `${verseResults.length} result${verseResults.length !== 1 ? "s" : ""}`
                  : "Enter a keyword to search verses"}
              </p>
              <div className="flex items-center gap-3">
                {verseQuery && (
                  <button
                    onClick={() => handleVerseSearch("")}
                    className="text-sm text-primary font-medium"
                  >
                    Clear search
                  </button>
                )}
                <Link
                  to="/quran/bookmarks"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                >
                  <Bookmark size={15} />
                  My Bookmarks
                </Link>
              </div>
            </div>

            {verseSearchLoading ? (
              <div className="flex flex-col items-center py-20">
                <Loader2 size={32} className="animate-spin text-primary mb-3" />
                <p className="text-text-muted text-sm">Searching verses...</p>
              </div>
            ) : verseQuery && verseResults.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-text-secondary">
                  No verses found for "{verseQuery}"
                </p>
              </div>
            ) : verseResults.length > 0 ? (
              <div className="space-y-3 stagger-children">
                {verseResults.map((verse, i) => (
                  <Link
                    key={`${verse.surahId || verse.surah_id}-${verse.verseNumber || verse.verse_number}-${i}`}
                    to={`/quran/${verse.surahId || verse.surah_id}`}
                    className="card p-5 block hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/8 text-primary text-xs font-semibold">
                        <BookOpen size={11} />
                        {verse.surahName || verse.surah_name || `Surah ${verse.surahId || verse.surah_id}`}
                      </span>
                      <span className="text-xs text-text-muted">
                        Verse {verse.verseNumber || verse.verse_number}
                      </span>
                    </div>
                    {verse.textArabic && (
                      <p
                        className="font-amiri text-xl text-text leading-loose text-right mb-2"
                        dir="rtl"
                      >
                        {verse.textArabic}
                      </p>
                    )}
                    {(verse.textEnglish || verse.translation) && (
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {verse.textEnglish || verse.translation}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Search size={36} className="text-text-muted mx-auto mb-3" />
                <h3 className="text-base font-semibold text-text mb-1">
                  Search the Quran
                </h3>
                <p className="text-sm text-text-muted">
                  Type a keyword above to search through all verses
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Surah Count + Bookmarks link */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-text-secondary">
                {loading ? "Loading..." : `${filtered.length} Surahs`}
              </p>
              <div className="flex items-center gap-3">
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-sm text-primary font-medium"
                  >
                    Clear search
                  </button>
                )}
                <Link
                  to="/quran/bookmarks"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                >
                  <Bookmark size={15} />
                  My Bookmarks
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-20">
                <Loader2 size={32} className="animate-spin text-primary mb-3" />
                <p className="text-text-muted text-sm">Loading Surahs...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-text-secondary">No surahs found for "{search}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
                {filtered.map((surah) => (
                  <Link
                    key={surah.id}
                    to={`/quran/${surah.id}`}
                    className="card p-4 sm:p-5 group flex items-center gap-4 hover:border-primary/20"
                  >
                    {/* Number */}
                    <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <span className="text-sm font-bold text-primary">
                        {surah.id}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[0.9375rem] font-semibold text-text group-hover:text-primary transition-colors">
                        {surah.nameTransliteration || surah.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted">
                          {surah.versesCount} Ayahs
                        </span>
                        {surah.revelationPlace && (
                          <>
                            <span className="text-text-muted">·</span>
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <MapPin size={10} />
                              {surah.revelationPlace}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Arabic Name */}
                    <div className="text-right shrink-0">
                      <p className="font-amiri text-lg text-text leading-none">
                        {surah.nameArabic}
                      </p>
                    </div>

                    <ChevronRight
                      size={16}
                      className="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
