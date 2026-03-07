import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLoaderData } from "react-router";
import { ArrowLeft, Loader2, AlertCircle, Search, X, BookOpen, Library, ChevronRight, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { hadithsAPI } from "~/services/api";
import type { HadithBook, Hadith, PaginatedHadiths } from "~/types";
import { JsonLd } from "~/components/JsonLd";
import { PremiumGate, PremiumBadge } from "~/components/PremiumGate";
import { useAuth } from "~/contexts/AuthContext";

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [booksRes, dailyRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/v1/islam/hadiths/books`),
    fetch(`${API_BASE}/api/v1/islam/hadiths/daily`),
  ]);

  let books: unknown[] = [];
  let dailyHadith: unknown = null;

  if (booksRes.status === 'fulfilled' && booksRes.value.ok) {
    const json = await booksRes.value.json();
    books = json.data || json;
  }
  if (dailyRes.status === 'fulfilled' && dailyRes.value.ok) {
    const json = await dailyRes.value.json();
    dailyHadith = json.data || json;
  }

  return { books, dailyHadith };
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function HadithsPage() {
  const { books: loaderBooks, dailyHadith: loaderDailyHadith } = useLoaderData<typeof loader>();
  const { isPremium } = useAuth();

  const [books] = useState<HadithBook[]>((loaderBooks as unknown as HadithBook[]) || []);
  const [dailyHadith] = useState<Hadith | null>((loaderDailyHadith as unknown as Hadith) || null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Hadith[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadithsRef = useRef<HTMLDivElement>(null);

  // Separate books into categories
  const majorBooks = books.filter(b => b.totalHadiths > 100);
  const curated40 = books.filter(b => b.totalHadiths <= 100);
  const totalHadithsCount = books.reduce((sum, b) => sum + b.totalHadiths, 0);

  // Fetch hadiths when a book is selected
  useEffect(() => {
    if (selectedBookId === null) return;

    const bookId = selectedBookId === 'all' ? undefined : selectedBookId;
    setLoading(true);
    setError("");
    setPage(1);
    hadithsAPI.getHadiths(bookId, 1, 20)
      .then(res => {
        const data = res.data?.data || res.data;
        if (data && data.hadiths) {
          setHadiths(data.hadiths);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || 0);
        } else if (Array.isArray(data)) {
          setHadiths(data);
        }
      })
      .catch(err => {
        if (err.response?.status === 403) {
          setHadiths([]);
        } else {
          setError('Failed to load hadiths.');
        }
      })
      .finally(() => setLoading(false));
  }, [selectedBookId]);

  // Load favorites for premium users
  useEffect(() => {
    if (isPremium) {
      hadithsAPI.getFavorites()
        .then(res => {
          const data = res.data?.data || res.data;
          if (Array.isArray(data)) {
            setFavorites(new Set(data.map((h: Hadith) => h.id)));
          }
        })
        .catch(() => {});
    }
  }, [isPremium]);

  // Cleanup search timer
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const selectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setSearchQuery("");
    setSearchResults([]);
    setShowFavoritesOnly(false);
    // Scroll to hadiths section
    setTimeout(() => {
      hadithsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    // Auto-select "all" when searching if no book selected
    if (selectedBookId === null) {
      setSelectedBookId('all');
    }

    setSearchLoading(true);
    searchTimerRef.current = setTimeout(() => {
      const searchFn = isPremium ? hadithsAPI.searchPremium : hadithsAPI.search;
      searchFn(query)
        .then(res => {
          const data = res.data?.data || res.data;
          setSearchResults(Array.isArray(data) ? data : []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
  }, [isPremium, selectedBookId]);

  const loadMore = () => {
    const nextPage = page + 1;
    const bookId = selectedBookId === 'all' || selectedBookId === null ? undefined : selectedBookId;
    setLoadingMore(true);
    hadithsAPI.getHadiths(bookId, nextPage, 20)
      .then(res => {
        const data = res.data?.data || res.data;
        if (data && data.hadiths) {
          setHadiths(prev => [...prev, ...data.hadiths]);
          setPage(nextPage);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || 0);
        } else if (Array.isArray(data)) {
          setHadiths(prev => [...prev, ...data]);
          setPage(nextPage);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const toggleFavorite = async (hadithId: string) => {
    const wasFav = favorites.has(hadithId);
    setFavorites(prev => {
      const next = new Set(prev);
      wasFav ? next.delete(hadithId) : next.add(hadithId);
      return next;
    });
    try {
      wasFav ? await hadithsAPI.removeFavorite(hadithId) : await hadithsAPI.addFavorite(hadithId);
    } catch {
      setFavorites(prev => {
        const next = new Set(prev);
        wasFav ? next.add(hadithId) : next.delete(hadithId);
        return next;
      });
    }
  };

  // Determine which hadiths to display
  const selectedBook = books.find(b => b.id === selectedBookId);
  const isSelectedBookPremium = selectedBook?.isPremium && !isPremium;

  let displayHadiths: Hadith[] = [];
  if (searchQuery) {
    displayHadiths = searchResults;
  } else if (showFavoritesOnly) {
    displayHadiths = hadiths.filter(h => favorites.has(h.id));
  } else {
    displayHadiths = hadiths;
  }

  return (
    <div className="bg-gradient-surface min-h-screen pb-12">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Hadith Collections",
        "description": "Explore authentic sayings and traditions of Prophet Muhammad \uFDFA from 10 major collections with over 36,000 hadiths",
        "url": "https://www.siraat.website/hadiths"
      }} />

      {/* Hero */}
      <div className="bg-hero-gradient text-white pattern-islamic pt-safe-top">
        <div className="container-faith py-8 md:py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-4">
              <Library size={14} />
              Prophetic Traditions
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-4">
              Hadith Collections
            </h1>
            <p className="text-white/90 text-lg leading-relaxed">
              Explore {formatNumber(totalHadithsCount)} hadiths from {books.length} authentic collections of Prophet Muhammad &#xFDFA;
            </p>
          </div>
        </div>
      </div>

      {/* Hadith of the Day */}
      {dailyHadith && (
        <div className="container-faith mt-6 mb-0 relative z-10">
          <div className="card-elevated p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-playfair text-xl md:text-2xl font-bold text-text">Hadith of the Day</h2>
              {dailyHadith.grade && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  dailyHadith.grade === 'Sahih' ? 'bg-green-500/10 text-green-700' :
                  dailyHadith.grade === 'Hasan' ? 'bg-amber-500/10 text-amber-700' :
                  'bg-red-500/10 text-red-700'
                }`}>{dailyHadith.grade}</span>
              )}
            </div>
            <p className="font-amiri text-xl sm:text-2xl text-text text-right leading-loose line-clamp-3 mb-4" dir="rtl">
              {dailyHadith.textArabic}
            </p>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed line-clamp-3 mb-4">
              {dailyHadith.textEnglish}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-border-light">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">{dailyHadith.book?.name}</span>
                {dailyHadith.reference && <span className="text-xs text-text-muted">&bull; {dailyHadith.reference}</span>}
              </div>
              <Link to={`/hadiths/${dailyHadith.id}`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                Read full hadith <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={`container-faith ${dailyHadith ? '-mt-8' : 'mt-6'} relative z-10`}>
        {/* Collections Grid */}
        {selectedBookId === null && !searchQuery && (
          <div className="animate-fade-in-up">
            {/* Search Bar */}
            <div className="card-elevated p-4 mb-6">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search across all hadiths..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input-field input-with-left-icon w-full pr-10"
                />
              </div>
            </div>

            {/* Major Collections (Kutub al-Sittah + Muwatta) */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-playfair text-xl font-bold text-text">Major Collections</h2>
                <span className="text-xs text-text-muted">{majorBooks.length} books</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {majorBooks.map((book, i) => (
                  <button
                    key={book.id}
                    onClick={() => selectBook(book.id)}
                    className="card-elevated p-5 text-left hover:border-primary/20 border border-transparent transition-all animate-fade-in-up group"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                        <Library size={18} className="text-primary" />
                      </div>
                      {book.isPremium && !isPremium && <PremiumBadge />}
                    </div>
                    <h3 className="font-semibold text-text text-sm mb-0.5 group-hover:text-primary transition-colors">
                      {book.name}
                    </h3>
                    <p className="font-amiri text-text-muted text-sm mb-2" dir="rtl">
                      {book.nameArabic}
                    </p>
                    <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-3">
                      {book.description || `By ${book.author}`}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border-light">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={12} className="text-text-muted" />
                        <span className="text-xs font-medium text-text-muted">
                          {formatNumber(book.totalHadiths)} hadiths
                        </span>
                      </div>
                      <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Browse &rarr;
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Curated 40 Hadith Collections */}
            {curated40.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-playfair text-xl font-bold text-text">Curated Collections</h2>
                  <span className="text-xs text-text-muted">{curated40.length} books</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {curated40.map((book, i) => (
                    <button
                      key={book.id}
                      onClick={() => selectBook(book.id)}
                      className="card-elevated p-5 text-left hover:border-primary/20 border border-transparent transition-all animate-fade-in-up group"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/8 flex items-center justify-center">
                          <BookOpen size={16} className="text-amber-600" />
                        </div>
                        {book.isPremium && !isPremium && <PremiumBadge />}
                      </div>
                      <h3 className="font-semibold text-text text-sm mb-0.5 group-hover:text-primary transition-colors">
                        {book.name}
                      </h3>
                      <p className="font-amiri text-text-muted text-xs mb-2" dir="rtl">
                        {book.nameArabic}
                      </p>
                      <p className="text-text-muted text-xs leading-relaxed line-clamp-2 mb-3">
                        {book.description || `By ${book.author}`}
                      </p>
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border-light">
                        <BookOpen size={12} className="text-text-muted" />
                        <span className="text-xs font-medium text-text-muted">
                          {book.totalHadiths} hadiths
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Browse All Button */}
            <div className="text-center">
              <button
                onClick={() => selectBook("all")}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Library size={16} />
                Browse All {formatNumber(totalHadithsCount)} Hadiths
              </button>
            </div>
          </div>
        )}

        {/* Hadith Browsing View (when a book is selected) */}
        {(selectedBookId !== null || searchQuery) && (
          <div ref={hadithsRef}>
            {loading ? (
              <div className="card-elevated p-12 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="animate-spin text-primary mb-4" />
                <p className="text-text-muted">Loading hadiths...</p>
              </div>
            ) : error ? (
              <div className="card-elevated p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle size={32} className="text-red-500 mb-4" />
                <p className="text-text font-semibold mb-2">Something went wrong</p>
                <p className="text-text-muted max-w-md mx-auto mb-6">{error}</p>
                <button onClick={() => setSelectedBookId(selectedBookId)} className="btn-primary">
                  Try Again
                </button>
              </div>
            ) : (
              <div className="animate-fade-in-up">
                {/* Back to Collections + Current Book Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => { setSelectedBookId(null); setSearchQuery(""); setSearchResults([]); }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors"
                  >
                    <ArrowLeft size={14} />
                    All Collections
                  </button>
                  {selectedBook && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text">{selectedBook.name}</p>
                      <p className="text-xs text-text-muted">{formatNumber(total)} hadiths</p>
                    </div>
                  )}
                  {selectedBookId === 'all' && (
                    <p className="text-xs text-text-muted">{formatNumber(total)} hadiths across all collections</p>
                  )}
                </div>

                {/* Search Bar */}
                <div className="card-elevated p-4 mb-4">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      type="text"
                      placeholder={selectedBook ? `Search in ${selectedBook.name}...` : "Search hadiths..."}
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="input-field input-with-left-icon w-full pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Compact Book Filter Pills */}
                {books.length > 0 && !searchQuery && (
                  <div className="mb-4 overflow-x-auto">
                    <div className="flex items-center gap-1.5 min-w-max pb-1">
                      <button
                        onClick={() => setSelectedBookId("all")}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                          selectedBookId === "all"
                            ? "bg-primary text-white shadow-sm"
                            : "text-text-muted hover:text-text hover:bg-black/5 border border-border-light"
                        }`}
                      >
                        All
                      </button>
                      {books.slice(0, showAllBooks ? books.length : 6).map((book) => (
                        <button
                          key={book.id}
                          onClick={() => setSelectedBookId(book.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                            selectedBookId === book.id
                              ? "bg-primary text-white shadow-sm"
                              : book.isPremium && !isPremium
                              ? "text-text-muted/50 border border-border-light"
                              : "text-text-muted hover:text-text hover:bg-black/5 border border-border-light"
                          }`}
                        >
                          {book.name.replace('Sahih al-', '').replace('Sunan ', '').replace('Jami at-', '').replace('Muwatta Imam ', '').replace('40 Hadith ', '')}
                          {book.isPremium && !isPremium && <PremiumBadge />}
                        </button>
                      ))}
                      {books.length > 6 && (
                        <button
                          onClick={() => setShowAllBooks(!showAllBooks)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium text-primary hover:bg-primary/5 transition-colors flex items-center gap-1"
                        >
                          {showAllBooks ? (
                            <><ChevronUp size={12} /> Less</>
                          ) : (
                            <><ChevronDown size={12} /> +{books.length - 6} more</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Favorites Toggle */}
                {isPremium && !searchQuery && (
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setShowFavoritesOnly(false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        !showFavoritesOnly ? 'bg-primary text-white' : 'text-text-muted hover:bg-black/5'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setShowFavoritesOnly(true)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                        showFavoritesOnly ? 'bg-primary text-white' : 'text-text-muted hover:bg-black/5'
                      }`}
                    >
                      <Heart size={12} /> Favorites ({favorites.size})
                    </button>
                  </div>
                )}

                {/* Hadith Results */}
                {searchLoading ? (
                  <div className="card-elevated p-12 flex flex-col items-center justify-center min-h-[300px]">
                    <Loader2 size={24} className="animate-spin text-primary mb-3" />
                    <p className="text-text-muted text-sm">Searching...</p>
                  </div>
                ) : isSelectedBookPremium ? (
                  <PremiumGate isPremium={isPremium} featureName="Premium Hadith Collections">
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="card-elevated p-5 sm:p-6 flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/8 text-primary text-xs font-bold">
                              {i}
                            </span>
                            <span className="text-xs text-text-muted">Premium Collection</span>
                          </div>
                          <p className="font-amiri text-lg sm:text-xl text-text text-right leading-loose" dir="rtl">
                            ...
                          </p>
                          <p className="text-text-secondary text-sm leading-relaxed">
                            This hadith is available with a premium subscription.
                          </p>
                        </div>
                      ))}
                    </div>
                  </PremiumGate>
                ) : displayHadiths.length === 0 ? (
                  <div className="card-elevated p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                      <BookOpen size={28} className="text-primary/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-2">
                      {searchQuery ? "No hadiths found" : showFavoritesOnly ? "No favorites yet" : "No hadiths available"}
                    </h3>
                    <p className="text-text-muted max-w-sm">
                      {searchQuery
                        ? `No results for "${searchQuery}". Try a different search term.`
                        : showFavoritesOnly
                        ? "Tap the heart icon on any hadith to add it to your favorites."
                        : "No hadiths found for this selection."}
                    </p>
                    {searchQuery ? (
                      <button onClick={() => handleSearch("")} className="btn-secondary mt-4">
                        Clear search
                      </button>
                    ) : showFavoritesOnly ? (
                      <button onClick={() => setShowFavoritesOnly(false)} className="btn-secondary mt-4">
                        View all hadiths
                      </button>
                    ) : (
                      <button onClick={() => setSelectedBookId(null)} className="btn-secondary mt-4">
                        View all collections
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {displayHadiths.map((hadith, i) => {
                      const isAllView = selectedBookId === 'all' || !!searchQuery;
                      const shortBookName = hadith.book?.name?.replace('Sahih al-', '').replace('Sahih ', '').replace('Sunan ', '').replace('Jami at-', '').replace('Muwatta Imam ', '').replace('40 Hadith ', '').replace('Forty Hadith of ', '') || '';
                      return (
                      <Link
                        key={hadith.id}
                        to={`/hadiths/${hadith.id}`}
                        className="card-elevated p-5 sm:p-6 flex flex-col gap-3 hover:border-primary/20 border border-transparent transition-all animate-fade-in-up group"
                        style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isAllView ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-[11px] font-semibold">
                                <Library size={11} />
                                {shortBookName} #{hadith.hadithNumber}
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/8 text-primary text-xs font-bold">
                                {hadith.hadithNumber}
                              </span>
                            )}
                            {hadith.chapterTitle && (
                              <span className="text-xs text-text-muted line-clamp-1 max-w-[200px]">{hadith.chapterTitle}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {hadith.grade && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                hadith.grade === 'Sahih' ? 'bg-green-500/10 text-green-700' :
                                hadith.grade === 'Hasan' ? 'bg-amber-500/10 text-amber-700' :
                                hadith.grade.startsWith('Hasan') ? 'bg-amber-500/10 text-amber-700' :
                                hadith.grade === "Da'if" ? 'bg-red-500/10 text-red-700' :
                                'bg-gray-500/10 text-gray-700'
                              }`}>{hadith.grade}</span>
                            )}
                            {isPremium && (
                              <button
                                onClick={(e) => { e.preventDefault(); toggleFavorite(hadith.id); }}
                                className="p-1 hover:bg-primary/5 rounded-lg transition-colors"
                              >
                                <Heart size={14} className={favorites.has(hadith.id) ? 'fill-red-500 text-red-500' : 'text-text-muted'} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="font-amiri text-lg sm:text-xl text-text text-right leading-loose line-clamp-2" dir="rtl">
                          {hadith.textArabic}
                        </p>
                        <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
                          {hadith.textEnglish}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border-light mt-auto">
                          <span className="text-[11px] text-text-muted">{hadith.book?.name} &bull; {hadith.reference}</span>
                          <span className="text-xs text-primary font-medium group-hover:underline">Read more &rarr;</span>
                        </div>
                      </Link>
                    );})}
                  </div>
                )}

                {/* Load More */}
                {page < totalPages && !searchQuery && !showFavoritesOnly && !isSelectedBookPremium && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <><Loader2 size={16} className="animate-spin" /> Loading...</>
                      ) : (
                        `Load More (${hadiths.length} of ${formatNumber(total)})`
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
