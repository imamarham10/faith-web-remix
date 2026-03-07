import { useState, useEffect } from "react";
import { Link, useParams, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Library,
  Heart,
  Share2,
} from "lucide-react";
import { hadithsAPI } from "~/services/api";
import type { Hadith } from "~/types";
import { JsonLd } from "~/components/JsonLd";
import { PremiumBadge } from "~/components/PremiumGate";
import { useAuth } from "~/contexts/AuthContext";

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  if (!params.hadithId) return { hadith: null };
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/islam/hadiths/${params.hadithId}`
    );
    if (!res.ok) return { hadith: null };
    const json = await res.json();
    return { hadith: json.data || json };
  } catch {
    return { hadith: null };
  }
}

export default function HadithDetailPage() {
  const { hadithId } = useParams();
  const { hadith: loaderHadith } = useLoaderData<typeof loader>();
  const [hadith, setHadith] = useState<Hadith | null>(
    (loaderHadith as Hadith) || null
  );
  const [loading, setLoading] = useState(loaderHadith ? false : true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const { isPremium } = useAuth();

  // Client-side fetch (fallback)
  useEffect(() => {
    if (!hadithId) return;

    setLoading(true);
    hadithsAPI
      .getHadith(hadithId)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && data.id) {
          setHadith(data);
        } else {
          setError("Could not load this hadith.");
        }
      })
      .catch(() => setError("Failed to load this hadith."))
      .finally(() => setLoading(false));
  }, [hadithId]);

  // Check if favorited (premium users)
  useEffect(() => {
    if (!isPremium || !hadithId) return;
    hadithsAPI
      .getFavorites()
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          setIsFavorited(data.some((h: any) => h.id === hadithId));
        }
      })
      .catch(() => {});
  }, [isPremium, hadithId]);

  const handleCopy = () => {
    if (!hadith) return;
    const text = `${hadith.textArabic}\n\n${hadith.textEnglish}${
      hadith.narratorChain ? `\n\nNarrator: ${hadith.narratorChain}` : ""
    }${hadith.reference ? `\n\n— ${hadith.reference}` : ""}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleFavorite = async () => {
    if (!isPremium || !hadith) return;
    const wasFav = isFavorited;
    setIsFavorited(!wasFav);
    try {
      wasFav
        ? await hadithsAPI.removeFavorite(hadith.id)
        : await hadithsAPI.addFavorite(hadith.id);
    } catch {
      setIsFavorited(wasFav);
    }
  };

  const handleShare = () => {
    if (!hadith) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `Hadith - ${hadith.book?.name || "Prophetic Tradition"}`,
          text: hadith.textEnglish,
          url: window.location.href,
        })
        .catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-surface min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hadith) {
    return (
      <div className="bg-gradient-surface min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">
          Something went wrong
        </h2>
        <p className="text-text-secondary mb-6">
          {error || "Hadith not found"}
        </p>
        <Link to="/hadiths" className="btn-primary">
          Browse All Hadiths
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-surface min-h-screen pb-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Hadith ${hadith.hadithNumber} - ${hadith.book?.name || "Prophetic Tradition"}`,
          description: hadith.textEnglish?.substring(0, 200),
          url: `https://www.siraat.website/hadiths/${hadith.id}`,
          inLanguage: ["en", "ar"],
          datePublished: "2026-03-01",
          dateModified: new Date().toISOString().split("T")[0],
          author: {
            "@type": "Organization",
            name: "Siraat",
            url: "https://www.siraat.website",
          },
          publisher: {
            "@type": "Organization",
            name: "Siraat",
            url: "https://www.siraat.website",
          },
        }}
      />

      {/* Hero */}
      <div className="bg-hero-gradient text-white pattern-islamic pt-safe-top">
        <div className="container-faith py-8 md:py-12">
          <Link
            to="/hadiths"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            All Hadiths
          </Link>

          <div className="max-w-3xl">
            {hadith.book && (
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold mb-4">
                <Library size={12} />
                {hadith.book.name}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-3">
              Hadith {hadith.hadithNumber}
            </h1>

            {hadith.chapterTitle && (
              <p className="text-white/80 text-lg">{hadith.chapterTitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div className="container-faith -mt-8 relative z-10 max-w-3xl mx-auto">
        <div className="card-elevated p-6 sm:p-10 animate-fade-in-up">
          {/* Action buttons row */}
          <div className="flex items-center justify-end gap-2 mb-6">
            {/* Favorite button */}
            {isPremium ? (
              <button
                onClick={toggleFavorite}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors border border-border-light"
              >
                <Heart
                  size={15}
                  className={
                    isFavorited ? "fill-red-500 text-red-500" : ""
                  }
                />
                {isFavorited ? "Saved" : "Save"}
              </button>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted cursor-not-allowed border border-border-light opacity-50"
              >
                <Heart size={15} /> Save <PremiumBadge />
              </button>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors border border-border-light"
            >
              <Share2 size={15} /> Share
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors border border-border-light"
              title="Copy Arabic text and translation"
            >
              {copied ? (
                <>
                  <Check size={15} className="text-green-500" />
                  <span className="text-green-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="space-y-8">
            {/* Arabic Text */}
            <div>
              <p
                className="font-amiri text-3xl sm:text-4xl md:text-5xl text-text text-right leading-[2] sm:leading-[2.2]"
                dir="rtl"
              >
                {hadith.textArabic}
              </p>
            </div>

            {/* Narrator Chain */}
            {hadith.narratorChain && (
              <div className="pt-4 border-t border-border-light">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Narrator
                </p>
                <p className="text-text-secondary italic text-base leading-relaxed">
                  {hadith.narratorChain}
                </p>
              </div>
            )}

            {/* English Translation */}
            <div className="pt-4 border-t border-border-light">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Translation
              </p>
              <p className="text-text text-lg sm:text-xl font-medium leading-relaxed">
                {hadith.textEnglish}
              </p>
            </div>

            {/* Grade + Reference */}
            <div className="pt-4 border-t border-border-light flex items-center justify-between flex-wrap gap-3">
              {hadith.grade && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Grade:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      hadith.grade === "Sahih"
                        ? "bg-green-500/10 text-green-700"
                        : hadith.grade === "Hasan"
                          ? "bg-amber-500/10 text-amber-700"
                          : "bg-red-500/10 text-red-700"
                    }`}
                  >
                    {hadith.grade}
                  </span>
                </div>
              )}
              {hadith.reference && (
                <p className="text-text-muted text-sm">
                  <span className="font-semibold">Reference:</span>{" "}
                  {hadith.reference}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/hadiths"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Hadiths
          </Link>
        </div>
      </div>
    </div>
  );
}
