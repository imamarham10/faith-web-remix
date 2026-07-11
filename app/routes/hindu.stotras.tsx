import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLoaderData } from "react-router";
import {
  Music,
  Search,
  X,
  Loader2,
  AlertTriangle,
  Heart,
  Sparkles,
} from "lucide-react";
import { hinduStotrasAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";
import { deityLabel, deityBadgeClass } from "~/lib/hinduDeities";

const APP_URL = "https://www.siraat.website";

// ---------- Types (API contract §C2) ----------

interface StotraCategory {
  id: string;
  slug: string;
  name: string;
  deityKey: string | null;
  stotraCount: number;
}

interface StotraListItem {
  id: string;
  slug: string;
  titleSanskrit: string;
  titleEnglish: string;
  type: "stotra" | "aarti" | "bhajan";
  deityKey: string | null;
  isPremium: boolean;
  verseCount: number;
  category: { slug: string; name: string } | null;
}

interface StotraFavorite {
  id: string;
  createdAt: string;
  stotra: StotraListItem;
}

// ---------- Loader (SSR) ----------

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [stotrasRes, catsRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/v1/hindu/stotras`),
    fetch(`${API_BASE}/api/v1/hindu/stotras/categories`),
  ]);

  let stotras: unknown[] = [];
  let categories: unknown[] = [];

  if (stotrasRes.status === "fulfilled" && stotrasRes.value.ok) {
    const json = await stotrasRes.value.json();
    stotras = json.data || json;
  }
  if (catsRes.status === "fulfilled" && catsRes.value.ok) {
    const json = await catsRes.value.json();
    categories = json.data || json;
  }

  return { stotras, categories };
}

// ---------- Meta ----------

export function meta() {
  return [
    { title: "Stotras, Aartis & Bhajans | Siraat" },
    {
      name: "description",
      content:
        "A library of Hindu hymns — stotras and aartis for Ganesha, Shiva, Vishnu, Devi and Hanuman with full Sanskrit text, transliteration and English meaning.",
    },
    { tagName: "link", rel: "canonical", href: `${APP_URL}/hindu/stotras` },
    { property: "og:title", content: "Stotras, Aartis & Bhajans | Siraat" },
    {
      property: "og:description",
      content:
        "Hanuman Chalisa, Shiva Tandava Stotram, Bhaja Govindam and more — Sanskrit hymns with transliteration and meaning.",
    },
    { property: "og:url", content: `${APP_URL}/hindu/stotras` },
  ];
}

// ---------- Page ----------

type Tab = "all" | "favorites";

export default function HinduStotrasPage() {
  const { stotras: loaderStotras, categories: loaderCategories } =
    useLoaderData<typeof loader>();
  const { isAuthenticated } = useAuth();

  const [stotras, setStotras] = useState<StotraListItem[]>(
    (loaderStotras as unknown as StotraListItem[]) || [],
  );
  const [categories, setCategories] = useState<StotraCategory[]>(
    (loaderCategories as unknown as StotraCategory[]) || [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [tab, setTab] = useState<Tab>("all");
  const [favorites, setFavorites] = useState<StotraFavorite[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [loading, setLoading] = useState(
    !(Array.isArray(loaderStotras) && loaderStotras.length > 0),
  );
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StotraListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError("");
    Promise.all([hinduStotrasAPI.getCategories(), hinduStotrasAPI.getAll()])
      .then(([catsRes, stotrasRes]) => {
        const catsData = catsRes.data?.data || catsRes.data;
        const stotrasData = stotrasRes.data?.data || stotrasRes.data;
        if (Array.isArray(catsData)) setCategories(catsData);
        if (Array.isArray(stotrasData)) {
          setStotras(stotrasData);
        } else {
          setError("Failed to load stotras. Please try again.");
        }
      })
      .catch(() => {
        setError("Failed to load stotras. Please make sure the backend is running.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Authed favorites are always fetched client-side.
  useEffect(() => {
    if (!isAuthenticated) return;
    setFavoritesLoading(true);
    hinduStotrasAPI
      .getFavorites()
      .then((res) => {
        const data = res.data?.data || res.data;
        setFavorites(Array.isArray(data) ? data : []);
      })
      .catch(() => setFavorites([]))
      .finally(() => setFavoritesLoading(false));
  }, [isAuthenticated]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchTimerRef.current = setTimeout(() => {
      hinduStotrasAPI
        .search(query)
        .then((res) => {
          const data = res.data?.data || res.data;
          setSearchResults(Array.isArray(data) ? data : []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const filtered =
    selectedCategory === "all"
      ? stotras
      : stotras.filter((s) => s.category?.slug === selectedCategory);

  const visible: StotraListItem[] = searchQuery
    ? searchResults
    : tab === "favorites"
      ? favorites.map((f) => f.stotra).filter(Boolean)
      : filtered;

  return (
    <div className="min-h-screen bg-[#FBF6EC] pb-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Stotras, Aartis & Bhajans",
            description:
              "A library of Hindu hymns with Sanskrit text, transliteration and English meaning.",
            url: `${APP_URL}/hindu/stotras`,
            mainEntity: {
              "@type": "ItemList",
              name: "Hindu Stotras & Aartis",
              numberOfItems: stotras.length,
              itemListElement: stotras.slice(0, 50).map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: s.titleEnglish,
                url: `${APP_URL}/hindu/stotras/${s.slug}`,
              })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
              { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
              { "@type": "ListItem", position: 3, name: "Stotras", item: `${APP_URL}/hindu/stotras` },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <Music size={12} />
              Stotras
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight mb-4">
              Stotras, Aartis &amp; Bhajans
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl">
              Sacred hymns of praise — from the Hanuman Chalisa to Bhaja Govindam —
              with full Sanskrit text, transliteration and English meaning.
            </p>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
            <p className="text-sm text-[#6B5642]">Loading stotras…</p>
          </div>
        ) : error ? (
          <ErrorCard message={error} onRetry={fetchData} />
        ) : (
          <>
            {/* Search */}
            <div className="rounded-2xl bg-white border border-[#E8DCC4] p-4 mb-5 shadow-[0_1px_2px_rgba(74,17,25,0.04)]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A7B3A]"
                />
                <input
                  type="text"
                  placeholder="Search stotras and aartis…"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-xl border border-[#E8DCC4] bg-[#FBF6EC]/60 pl-11 pr-10 py-2.5 text-sm text-[#3A0F18] placeholder:text-[#9A8A70] focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8A70] hover:text-[#3A0F18] transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs + category chips */}
            {!searchQuery && (
              <div className="rounded-2xl bg-white border border-[#E8DCC4] p-4 mb-6 overflow-x-auto shadow-[0_1px_2px_rgba(74,17,25,0.04)]">
                <div className="flex items-center gap-2 min-w-max">
                  <Chip
                    active={tab === "all" && selectedCategory === "all"}
                    onClick={() => {
                      setTab("all");
                      setSelectedCategory("all");
                    }}
                  >
                    All
                  </Chip>
                  {categories.map((cat) => (
                    <Chip
                      key={cat.id}
                      active={tab === "all" && selectedCategory === cat.slug}
                      onClick={() => {
                        setTab("all");
                        setSelectedCategory(cat.slug);
                      }}
                    >
                      {cat.name}
                      <span className="ml-1.5 text-[11px] opacity-70">{cat.stotraCount}</span>
                    </Chip>
                  ))}
                  <span className="w-px h-5 bg-[#E8DCC4] mx-1" aria-hidden />
                  <Chip active={tab === "favorites"} onClick={() => setTab("favorites")}>
                    <Heart size={13} className="mr-1.5" />
                    Favorites
                  </Chip>
                </div>
              </div>
            )}

            {/* Grid / states */}
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="animate-spin text-[#6B1F2A]" />
                <p className="text-sm text-[#6B5642]">Searching…</p>
              </div>
            ) : tab === "favorites" && !searchQuery && !isAuthenticated ? (
              <LoginCta subject="favorite stotras" />
            ) : tab === "favorites" && !searchQuery && favoritesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="animate-spin text-[#6B1F2A]" />
                <p className="text-sm text-[#6B5642]">Loading favorites…</p>
              </div>
            ) : visible.length === 0 ? (
              <EmptyCard
                title={
                  searchQuery
                    ? "No stotras found"
                    : tab === "favorites"
                      ? "No favorites yet"
                      : "No stotras match these filters"
                }
                message={
                  searchQuery
                    ? `No results for "${searchQuery}". Try a different search term.`
                    : tab === "favorites"
                      ? "Tap the heart on any stotra to keep it here for quick access."
                      : "Try another category, or view the full library."
                }
                action={
                  searchQuery ? (
                    <button onClick={() => handleSearch("")} className="btn-hindu-primary mt-5">
                      Clear search
                    </button>
                  ) : selectedCategory !== "all" || tab === "favorites" ? (
                    <button
                      onClick={() => {
                        setTab("all");
                        setSelectedCategory("all");
                      }}
                      className="btn-hindu-primary mt-5"
                    >
                      View all stotras
                    </button>
                  ) : null
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {visible.map((s) => (
                  <StotraCard key={s.id} stotra={s} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Pieces ----------

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-[#6B1F2A] text-white shadow-sm"
          : "text-[#6B5642] hover:text-[#3A0F18] hover:bg-[#6B1F2A]/5"
      }`}
    >
      {children}
    </button>
  );
}

function StotraCard({ stotra }: { stotra: StotraListItem }) {
  return (
    <Link
      to={`/hindu/stotras/${stotra.slug}`}
      className="group rounded-2xl bg-white border border-[#E8DCC4] p-6 flex flex-col gap-3 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] hover:border-[#6B1F2A]/25 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6B1F2A]/8 text-[#6B1F2A] text-[11px] font-semibold uppercase tracking-wide">
          {stotra.type}
        </span>
        {stotra.deityKey && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${deityBadgeClass(stotra.deityKey)}`}
          >
            {deityLabel(stotra.deityKey)}
          </span>
        )}
      </div>

      <p
        className="text-xl text-[#3A0F18] leading-relaxed"
        style={{ fontFamily: "var(--font-devanagari)" }}
        lang="sa"
      >
        {stotra.titleSanskrit}
      </p>

      <h3 className="text-base font-semibold text-[#1A1D23] leading-snug group-hover:text-[#6B1F2A] transition-colors">
        {stotra.titleEnglish}
      </h3>

      <div className="mt-auto pt-2 flex items-center justify-between text-xs text-[#6B5642]">
        <span>{stotra.category?.name}</span>
        <span className="inline-flex items-center gap-1">
          <Sparkles size={11} className="text-[#9A7B3A]" />
          {stotra.verseCount} verses
        </span>
      </div>
    </Link>
  );
}

function LoginCta({ subject }: { subject: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 flex flex-col items-center justify-center text-center min-h-[280px]">
      <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mb-4">
        <Heart size={22} />
      </div>
      <h3 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
        Sign in to see your {subject}
      </h3>
      <p className="text-sm text-[#6B5642] max-w-sm mb-6">
        Create a free account to save hymns and find them here on any device.
      </p>
      <Link to="/auth/login" className="btn-hindu-primary">
        Sign in
      </Link>
    </div>
  );
}

function EmptyCard({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 flex flex-col items-center justify-center text-center min-h-[280px]">
      <div className="w-14 h-14 rounded-2xl bg-[#FAF1D9] text-[#9A7B3A] flex items-center justify-center mb-4">
        <Music size={22} />
      </div>
      <h3 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">{title}</h3>
      <p className="text-sm text-[#6B5642] max-w-sm">{message}</p>
      {action}
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={22} />
      </div>
      <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
        Stotras unavailable
      </h2>
      <p className="text-sm text-[#6B5642] mb-6">{message}</p>
      <button onClick={onRetry} className="btn-hindu-primary">
        Retry
      </button>
    </div>
  );
}
