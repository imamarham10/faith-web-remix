import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Bookmark, Loader2, BookOpen, ArrowLeft, Calendar, Trash2 } from "lucide-react";
import { quranAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import type { Bookmark as BookmarkType } from "~/types";

export default function QuranBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  const handleDeleteBookmark = async (id: string) => {
    try {
      await quranAPI.deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch {
      // silently fail — bookmark stays in list
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    quranAPI
      .getBookmarks()
      .then((res) => {
        const data = res.data?.data || res.data;
        setBookmarks(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load bookmarks. Please try again."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-surface min-h-screen flex items-center justify-center">
        <div className="card-elevated p-10 text-center max-w-md w-full mx-4">
          <Bookmark size={40} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text font-playfair mb-2">
            Sign in to view your bookmarks
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            Sign in to view your saved bookmarks
          </p>
          <Link to="/auth/login" className="btn-primary inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14">
          <div className="animate-fade-in-up">
            <Link
              to="/quran"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-5 transition-colors"
            >
              <ArrowLeft size={15} />
              Back to Quran
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <Bookmark size={28} className="text-gold-light" />
              <h1 className="text-3xl sm:text-4xl font-bold font-playfair">
                My Bookmarks
              </h1>
            </div>
            <p className="text-white/80 text-sm">
              Your saved Quran verses
            </p>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="card-elevated p-12 text-center">
            <Bookmark size={40} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Something went wrong</h3>
            <p className="text-text-secondary text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <BookOpen size={40} className="text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">
              No bookmarks yet
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              Start reading the Quran and save verses you love.
            </p>
            <Link to="/quran" className="btn-primary inline-block">
              Browse the Quran
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 stagger-children">
            {bookmarks.map((b, i) => (
              <div
                key={b.id}
                className="card-elevated p-5 animate-fade-in-up"
                style={{ animationDelay: `${(i % 12) * 0.04}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Bookmark size={18} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Calendar size={12} />
                      <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteBookmark(b.id)}
                      className="p-1 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                      aria-label="Remove bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-text">
                    Surah {b.surahId}, Verse {b.verseNumber}
                  </h3>

                  {b.note && (
                    <p className="text-sm text-text-secondary italic border-l-2 border-primary/30 pl-3">
                      {b.note}
                    </p>
                  )}

                  <div className="pt-3 border-t border-border-light">
                    <Link
                      to={`/quran/${b.surahId}?verse=${b.verseNumber}`}
                      className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline transition-colors"
                    >
                      <BookOpen size={14} />
                      Read in Surah
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
