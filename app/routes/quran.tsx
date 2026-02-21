import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, BookOpen, Loader2, MapPin, ChevronRight, Bookmark } from "lucide-react";
import { quranAPI } from "~/services/api";
import type { Surah } from "~/types";

export default function QuranPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
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
            <p className="text-white/60 text-base max-w-lg mx-auto mb-8">
              Read, reflect, and find guidance in the words of Allah
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                placeholder="Search by Surah name or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-with-left-icon w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl py-3.5 pr-5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
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
      </div>
    </div>
  );
}
