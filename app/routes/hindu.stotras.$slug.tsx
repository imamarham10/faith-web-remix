import { useState, useEffect } from "react";
import { Link, useParams, useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  ArrowLeft,
  Heart,
  Loader2,
  AlertTriangle,
  Music,
} from "lucide-react";
import { hinduStotrasAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";
import { deityLabel, deityBadgeClass } from "~/lib/hinduDeities";

const APP_URL = "https://www.siraat.website";

// ---------- Types (API contract §C2#4) ----------

interface StotraTranslation {
  languageCode: string;
  text: string;
}

interface StotraVerse {
  id: string;
  verseNumber: number;
  sanskritText: string;
  transliteration: string | null;
  translations: StotraTranslation[];
}

interface StotraDetail {
  id: string;
  slug: string;
  titleSanskrit: string;
  titleEnglish: string;
  type: "stotra" | "aarti" | "bhajan";
  deityKey: string | null;
  category: { slug: string; name: string } | null;
  verses: StotraVerse[];
}

// ---------- Loader (SSR) ----------

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  if (!params.slug) return { stotra: null };
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/hindu/stotras/${params.slug}?lang=en`,
    );
    if (!res.ok) return { stotra: null };
    const json = await res.json();
    return { stotra: json.data || json };
  } catch {
    return { stotra: null };
  }
}

// ---------- Meta ----------

export function meta({ data, params }: { data?: { stotra: StotraDetail | null }; params: { slug?: string } }) {
  const stotra = data?.stotra;
  const title = stotra
    ? `${stotra.titleEnglish} — Sanskrit Text & Meaning | Siraat`
    : "Stotra | Siraat";
  const description = stotra
    ? `Read ${stotra.titleEnglish} (${stotra.titleSanskrit}) — full Sanskrit text with transliteration and English meaning, verse by verse.`
    : "Read Hindu stotras and aartis with Sanskrit text, transliteration and English meaning.";
  const url = `${APP_URL}/hindu/stotras/${stotra?.slug || params.slug || ""}`;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
  ];
}

// ---------- Page ----------

export default function StotraDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { stotra: loaderStotra } = useLoaderData<typeof loader>();

  const [stotra, setStotra] = useState<StotraDetail | null>(
    (loaderStotra as StotraDetail) || null,
  );
  const [loading, setLoading] = useState(!loaderStotra);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const fetchStotra = () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    hinduStotrasAPI
      .getBySlug(slug)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && data.id) {
          setStotra(data);
        } else {
          setError("Could not load this stotra. It may not exist.");
        }
      })
      .catch((err: any) => {
        setError(
          err?.response?.status === 404
            ? "This stotra could not be found."
            : "Failed to load this stotra. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStotra();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Favorite state — authed only, client-side.
  useEffect(() => {
    if (!isAuthenticated || !stotra?.id) return;
    hinduStotrasAPI
      .getFavorites()
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          setIsFavorite(data.some((f: any) => f.stotra?.id === stotra.id));
        }
      })
      .catch(() => {});
  }, [isAuthenticated, stotra?.id]);

  const toggleFavorite = async () => {
    if (!stotra) return;
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    setFavoriteBusy(true);
    try {
      if (isFavorite) {
        await hinduStotrasAPI.removeFavorite(stotra.id);
        setIsFavorite(false);
      } else {
        await hinduStotrasAPI.addFavorite(stotra.id);
        setIsFavorite(true);
      }
    } catch {
      // keep previous state on failure
    } finally {
      setFavoriteBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
        <p className="text-sm text-[#6B5642]">Loading stotra…</p>
      </div>
    );
  }

  if (error || !stotra) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </div>
        <h2 className="font-playfair text-2xl font-bold text-[#3A0F18] mb-2">
          Stotra not found
        </h2>
        <p className="text-sm text-[#6B5642] mb-6 max-w-md">
          {error || "This stotra could not be found."}
        </p>
        <Link to="/hindu/stotras" className="btn-hindu-primary">
          Browse all stotras
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF6EC] pb-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: stotra.titleEnglish,
            alternativeHeadline: stotra.titleSanskrit,
            description: `${stotra.titleEnglish} with full Sanskrit text, transliteration and English meaning.`,
            url: `${APP_URL}/hindu/stotras/${stotra.slug}`,
            inLanguage: ["en", "sa"],
            mainEntityOfPage: `${APP_URL}/hindu/stotras/${stotra.slug}`,
            author: { "@type": "Organization", name: "Siraat", url: APP_URL },
            publisher: { "@type": "Organization", name: "Siraat", url: APP_URL },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
              { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
              { "@type": "ListItem", position: 3, name: "Stotras", item: `${APP_URL}/hindu/stotras` },
              {
                "@type": "ListItem",
                position: 4,
                name: stotra.titleEnglish,
                item: `${APP_URL}/hindu/stotras/${stotra.slug}`,
              },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-10 md:py-14">
          <Link
            to="/hindu/stotras"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            All Stotras
          </Link>

          <div className="max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0]">
                <Music size={11} />
                {stotra.category?.name || stotra.type}
              </span>
              {stotra.deityKey && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${deityBadgeClass(stotra.deityKey)}`}
                >
                  {deityLabel(stotra.deityKey)}
                </span>
              )}
            </div>

            <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
              {stotra.titleEnglish}
            </h1>
            <p
              className="text-2xl sm:text-3xl text-[#E8D5A0] leading-relaxed"
              style={{ fontFamily: "var(--font-devanagari)" }}
              lang="sa"
            >
              {stotra.titleSanskrit}
            </p>

            <button
              onClick={toggleFavorite}
              disabled={favoriteBusy}
              className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60 ${
                isFavorite
                  ? "bg-white text-[#6B1F2A] border-white"
                  : "bg-white/10 text-white border-white/25 hover:bg-white/20"
              }`}
              aria-pressed={isFavorite}
            >
              <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? "Favorited" : "Add to favorites"}
            </button>
          </div>
        </div>
      </section>

      {/* Verses */}
      <div className="container-faith py-8 md:py-10 max-w-3xl">
        {stotra.verses.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 text-center">
            <h3 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
              Verses coming soon
            </h3>
            <p className="text-sm text-[#6B5642]">
              The text of this hymn hasn't been added yet. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-5">
            {stotra.verses.map((verse) => (
              <VerseBlock key={verse.id} verse={verse} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Verse block (3-layer typography) ----------

function VerseBlock({ verse }: { verse: StotraVerse }) {
  const translation = verse.translations?.[0]?.text;
  return (
    <article className="rounded-2xl bg-white border border-[#E8DCC4] p-6 md:p-8 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)]">
      <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-lg bg-[#FAF1D9] text-[#7A5B19] text-sm font-semibold mb-4">
        {verse.verseNumber}
      </span>
      <p
        className="text-xl md:text-2xl text-[#3A0F18] leading-relaxed whitespace-pre-line mb-4"
        style={{ fontFamily: "var(--font-devanagari)" }}
        lang="sa"
      >
        {verse.sanskritText}
      </p>
      {verse.transliteration && (
        <p className="italic text-[#6B5642] text-base leading-relaxed whitespace-pre-line mb-4">
          {verse.transliteration}
        </p>
      )}
      {translation && (
        <p className="text-[#1A1D23] text-base leading-relaxed pt-4 border-t border-[#F1E7D2]">
          {translation}
        </p>
      )}
    </article>
  );
}
