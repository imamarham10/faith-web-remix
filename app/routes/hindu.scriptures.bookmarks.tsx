import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Calendar,
  Loader2,
  Trash2,
} from "lucide-react";
import { hinduScripturesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";

// ---------- Types ----------

interface BookmarkVerse {
  id: string;
  verseNumber: number;
  sanskritText: string;
  transliteration?: string;
  chapter?: { chapterNumber: number; nameEnglish?: string };
  text?: { slug: string; nameEnglish: string };
  translations?: { languageCode: string; authorName?: string; text: string }[];
}

interface ScriptureBookmark {
  id: string;
  note?: string;
  createdAt: string;
  verse: BookmarkVerse;
}

// ---------- Meta ----------

const APP_URL = "https://www.siraat.website";

export function meta() {
  const title = "My Scripture Bookmarks | Siraat";
  const description =
    "Your saved Bhagavad Gita verses — revisit the teachings you bookmarked while reading.";
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: `${APP_URL}/hindu/scriptures/bookmarks` },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: `${APP_URL}/hindu/scriptures/bookmarks` },
  ];
}

// ---------- Page ----------

export default function HinduScriptureBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<ScriptureBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    hinduScripturesAPI
      .getBookmarks()
      .then((res) => {
        const data = res.data?.data || res.data;
        setBookmarks(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load bookmarks. Please try again."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleDelete = async (verseId: string) => {
    try {
      await hinduScripturesAPI.deleteBookmark(verseId);
      setBookmarks((prev) => prev.filter((b) => b.verse?.id !== verseId));
    } catch {
      // silently fail — bookmark stays in list
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex items-center justify-center">
        <div className="rounded-2xl bg-white border border-[#E8DCC4] shadow-[0_8px_24px_-12px_rgba(74,17,25,0.12)] p-10 text-center max-w-md w-full mx-4">
          <Bookmark size={40} className="text-[#9A7B3A] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#3A0F18] font-playfair mb-2">
            Sign in to view your bookmarks
          </h2>
          <p className="text-[#6B5642] text-sm mb-6">
            Sign in to save verses while reading and find them all here.
          </p>
          <Link to="/auth/login" className="btn-hindu-primary inline-flex">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

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
            {
              "@type": "ListItem",
              position: 4,
              name: "My Bookmarks",
              item: `${APP_URL}/hindu/scriptures/bookmarks`,
            },
          ],
        }}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-10 md:py-14">
          <Link
            to="/hindu/scriptures"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-5 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Scriptures
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Bookmark size={28} className="text-[#E8D5A0]" />
            <h1 className="text-3xl sm:text-4xl font-bold font-playfair">
              My Bookmarks
            </h1>
          </div>
          <p className="text-white/80 text-sm">Your saved scripture verses</p>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#6B1F2A]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 text-center">
            <Bookmark size={40} className="text-[#A33B47] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#3A0F18] mb-2">
              Something went wrong
            </h3>
            <p className="text-[#6B5642] text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-hindu-primary"
            >
              Try Again
            </button>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 text-center">
            <BookOpen size={40} className="text-[#9A7B3A] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#3A0F18] mb-2">
              No bookmarks yet
            </h3>
            <p className="text-[#6B5642] text-sm mb-6">
              Start reading the Bhagavad Gita and save verses that speak to you.
            </p>
            <Link to="/hindu/scriptures" className="btn-hindu-primary inline-flex">
              Browse Scriptures
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {bookmarks.map((b) => {
              const chapterNumber = b.verse?.chapter?.chapterNumber;
              const textSlug = b.verse?.text?.slug || "bhagavad-gita";
              const textName = b.verse?.text?.nameEnglish || "Bhagavad Gita";
              const translation = b.verse?.translations?.[0];
              return (
                <div
                  key={b.id}
                  className="rounded-2xl bg-white border border-[#E8DCC4] shadow-[0_1px_2px_rgba(74,17,25,0.04)] p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6B1F2A]/8 flex items-center justify-center">
                      <Bookmark size={18} className="text-[#6B1F2A]" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-[#9A7B3A]">
                        <Calendar size={12} />
                        <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(b.verse.id)}
                        className="p-1 rounded-lg hover:bg-[#FBE9EA] text-[#9A7B3A] hover:text-[#A33B47] transition-colors"
                        aria-label="Remove bookmark"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-[#3A0F18]">
                      {textName}
                      {chapterNumber != null && (
                        <> {chapterNumber}.{b.verse.verseNumber}</>
                      )}
                    </h3>

                    {b.verse?.sanskritText && (
                      <p
                        className="text-lg text-[#3A0F18] leading-relaxed line-clamp-3"
                        style={{ fontFamily: "var(--font-devanagari)" }}
                        lang="sa"
                      >
                        {b.verse.sanskritText}
                      </p>
                    )}

                    {translation?.text && (
                      <p className="text-sm text-[#6B5642] leading-relaxed line-clamp-3">
                        {translation.text}
                      </p>
                    )}

                    {b.note && (
                      <p className="text-sm text-[#6B5642] italic border-l-2 border-[#6B1F2A]/30 pl-3">
                        {b.note}
                      </p>
                    )}

                    {chapterNumber != null && (
                      <div className="pt-3 border-t border-[#F1E7D2]">
                        <Link
                          to={`/hindu/scriptures/${textSlug}/${chapterNumber}?verse=${b.verse.verseNumber}`}
                          className="inline-flex items-center gap-1.5 text-[#6B1F2A] text-sm font-semibold hover:underline transition-colors"
                        >
                          <BookOpen size={14} />
                          Read in chapter
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
