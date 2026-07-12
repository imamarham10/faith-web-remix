import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLoaderData } from "react-router";
import {
  ScrollText,
  Search,
  X,
  Loader2,
  AlertTriangle,
  Heart,
  BookOpen,
} from "lucide-react";
import { hinduStoriesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";
import { deityLabel, deityBadgeClass } from "~/lib/hinduDeities";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

const APP_URL = "https://www.siraat.website";

// ---------- Types (API contract §C5) ----------

interface StoryCollection {
  id: string;
  slug: string;
  name: string;
  sourceText: string;
  isPremium: boolean;
  storyCount: number;
}

interface StoryListItem {
  id: string;
  storyNumber: number;
  title: string;
  summary: string;
  deityKey: string | null;
  characters: string[];
  collection: { slug: string; name: string; sourceText: string } | null;
}

interface StoryFavorite {
  id: string;
  createdAt: string;
  story: StoryListItem;
}

// ---------- Loader (SSR) ----------

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [storiesRes, collectionsRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/v1/hindu/stories`),
    fetch(`${API_BASE}/api/v1/hindu/stories/collections`),
  ]);

  let stories: unknown[] = [];
  let collections: unknown[] = [];

  if (storiesRes.status === "fulfilled" && storiesRes.value.ok) {
    const json = await storiesRes.value.json();
    stories = json.data || json;
  }
  if (collectionsRes.status === "fulfilled" && collectionsRes.value.ok) {
    const json = await collectionsRes.value.json();
    collections = json.data || json;
  }

  return { stories, collections };
}

// ---------- Meta ----------

export function meta() {
  return [
    { title: "Sacred Stories from the Puranas & Ramayana | Siraat" },
    {
      name: "description",
      content:
        "Timeless Hindu stories — Dhruva, Prahlada, Hanuman's leap to Lanka and more — retold from the Puranas and the Ramayana for children and adults.",
    },
    { tagName: "link", rel: "canonical", href: `${APP_URL}/hindu/stories` },
    {
      property: "og:title",
      content: "Sacred Stories from the Puranas & Ramayana | Siraat",
    },
    {
      property: "og:description",
      content:
        "Tales of devotion from the Puranas and stories of the Ramayana, told simply and reverently.",
    },
    { property: "og:url", content: `${APP_URL}/hindu/stories` },
    ...HINDU_OG_TAGS,
  ];
}

// ---------- Page ----------

type Tab = "all" | string | "favorites"; // collection slug tabs + special tabs

export default function HinduStoriesPage() {
  const { stories: loaderStories, collections: loaderCollections } =
    useLoaderData<typeof loader>();
  const { isAuthenticated } = useAuth();

  const [stories, setStories] = useState<StoryListItem[]>(
    (loaderStories as unknown as StoryListItem[]) || [],
  );
  const [collections, setCollections] = useState<StoryCollection[]>(
    (loaderCollections as unknown as StoryCollection[]) || [],
  );
  const [tab, setTab] = useState<Tab>("all");
  const [deityFilter, setDeityFilter] = useState<string>("all");
  const [favorites, setFavorites] = useState<StoryFavorite[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [loading, setLoading] = useState(
    !(Array.isArray(loaderStories) && loaderStories.length > 0),
  );
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StoryListItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError("");
    Promise.all([hinduStoriesAPI.getCollections(), hinduStoriesAPI.getAll()])
      .then(([collectionsRes, storiesRes]) => {
        const collectionsData = collectionsRes.data?.data || collectionsRes.data;
        const storiesData = storiesRes.data?.data || storiesRes.data;
        if (Array.isArray(collectionsData)) setCollections(collectionsData);
        if (Array.isArray(storiesData)) {
          setStories(storiesData);
        } else {
          setError("Failed to load stories. Please try again.");
        }
      })
      .catch(() => {
        setError("Failed to load stories. Please make sure the backend is running.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setFavoritesLoading(true);
    hinduStoriesAPI
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
      hinduStoriesAPI
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

  // Deity chips are derived from the deities actually present in the data.
  const deityOptions = Array.from(
    new Set(stories.map((s) => s.deityKey).filter(Boolean)),
  ) as string[];

  const byTab =
    tab === "all" || tab === "favorites"
      ? stories
      : stories.filter((s) => s.collection?.slug === tab);

  const byDeity =
    deityFilter === "all" ? byTab : byTab.filter((s) => s.deityKey === deityFilter);

  const visible: StoryListItem[] = searchQuery
    ? searchResults
    : tab === "favorites"
      ? favorites.map((f) => f.story).filter(Boolean)
      : byDeity;

  return (
    <div className="min-h-screen bg-[#FBF6EC] pb-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Sacred Stories from the Puranas & Ramayana",
            description:
              "Timeless Hindu stories retold from the Puranas and the Ramayana.",
            url: `${APP_URL}/hindu/stories`,
            mainEntity: {
              "@type": "ItemList",
              name: "Hindu Sacred Stories",
              numberOfItems: stories.length,
              itemListElement: stories.slice(0, 50).map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: s.title,
                url: `${APP_URL}/hindu/stories/${s.id}`,
              })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
              { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
              { "@type": "ListItem", position: 3, name: "Stories", item: `${APP_URL}/hindu/stories` },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <ScrollText size={12} />
              Kathas
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight mb-4">
              Sacred Stories
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl">
              Dhruva's resolve, Hanuman's leap, the churning of the ocean — timeless
              stories from the Puranas and the Ramayana, told simply for children and
              adults alike.
            </p>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
            <p className="text-sm text-[#6B5642]">Loading stories…</p>
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
                  placeholder="Search stories…"
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

            {/* Collection tabs + deity chips */}
            {!searchQuery && (
              <div className="rounded-2xl bg-white border border-[#E8DCC4] p-4 mb-6 shadow-[0_1px_2px_rgba(74,17,25,0.04)] space-y-3">
                <div className="flex items-center gap-2 min-w-max overflow-x-auto">
                  <Chip active={tab === "all"} onClick={() => setTab("all")}>
                    All
                  </Chip>
                  {collections.map((c) => (
                    <Chip
                      key={c.id}
                      active={tab === c.slug}
                      onClick={() => setTab(c.slug)}
                    >
                      {c.name}
                      <span className="ml-1.5 text-[11px] opacity-70">
                        {c.storyCount}
                      </span>
                    </Chip>
                  ))}
                  <span className="w-px h-5 bg-[#E8DCC4] mx-1" aria-hidden />
                  <Chip active={tab === "favorites"} onClick={() => setTab("favorites")}>
                    <Heart size={13} className="mr-1.5" />
                    Favorites
                  </Chip>
                </div>

                {tab !== "favorites" && deityOptions.length > 0 && (
                  <div className="flex items-center gap-2 min-w-max overflow-x-auto pt-3 border-t border-[#F1E7D2]">
                    <button
                      onClick={() => setDeityFilter("all")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                        deityFilter === "all"
                          ? "bg-[#6B1F2A] text-white border-[#6B1F2A]"
                          : "text-[#6B5642] border-[#E8DCC4] hover:border-[#6B1F2A]/30"
                      }`}
                    >
                      All deities
                    </button>
                    {deityOptions.map((key) => (
                      <button
                        key={key}
                        onClick={() => setDeityFilter(key)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                          deityFilter === key
                            ? "bg-[#6B1F2A] text-white border-[#6B1F2A]"
                            : `${deityBadgeClass(key)} hover:opacity-80`
                        }`}
                      >
                        {deityLabel(key)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Grid / states */}
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="animate-spin text-[#6B1F2A]" />
                <p className="text-sm text-[#6B5642]">Searching…</p>
              </div>
            ) : tab === "favorites" && !searchQuery && !isAuthenticated ? (
              <LoginCta />
            ) : tab === "favorites" && !searchQuery && favoritesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="animate-spin text-[#6B1F2A]" />
                <p className="text-sm text-[#6B5642]">Loading favorites…</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 flex flex-col items-center justify-center text-center min-h-[280px]">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF1D9] text-[#9A7B3A] flex items-center justify-center mb-4">
                  <ScrollText size={22} />
                </div>
                <h3 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
                  {searchQuery
                    ? "No stories found"
                    : tab === "favorites"
                      ? "No favorites yet"
                      : "No stories match these filters"}
                </h3>
                <p className="text-sm text-[#6B5642] max-w-sm">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search term.`
                    : tab === "favorites"
                      ? "Tap the heart on any story to keep it here."
                      : "Try another collection or deity filter."}
                </p>
                <button
                  onClick={() => {
                    handleSearch("");
                    setTab("all");
                    setDeityFilter("all");
                  }}
                  className="btn-hindu-primary mt-5"
                >
                  View all stories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                {visible.map((s) => (
                  <StoryCard key={s.id} story={s} />
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

function StoryCard({ story }: { story: StoryListItem }) {
  return (
    <Link
      to={`/hindu/stories/${story.id}`}
      className="group rounded-2xl bg-white border border-[#E8DCC4] p-6 flex flex-col gap-3 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] hover:border-[#6B1F2A]/25 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {story.collection && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6B1F2A]/8 text-[#6B1F2A] text-[11px] font-semibold">
            <BookOpen size={11} />
            {story.collection.name}
          </span>
        )}
        {story.deityKey && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${deityBadgeClass(story.deityKey)}`}
          >
            {deityLabel(story.deityKey)}
          </span>
        )}
      </div>

      <h3 className="font-playfair text-lg font-bold text-[#3A0F18] leading-snug group-hover:text-[#6B1F2A] transition-colors">
        {story.title}
      </h3>

      <p className="text-sm text-[#6B5642] leading-relaxed line-clamp-3">
        {story.summary}
      </p>

      {story.characters?.length > 0 && (
        <div className="mt-auto pt-2 flex items-center gap-1.5 flex-wrap">
          {story.characters.slice(0, 4).map((name) => (
            <span
              key={name}
              className="px-2 py-0.5 rounded-md bg-[#FBF6EC] border border-[#E8DCC4] text-[11px] text-[#6B5642]"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function LoginCta() {
  return (
    <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 flex flex-col items-center justify-center text-center min-h-[280px]">
      <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mb-4">
        <Heart size={22} />
      </div>
      <h3 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
        Sign in to see your favorite stories
      </h3>
      <p className="text-sm text-[#6B5642] max-w-sm mb-6">
        Create a free account to save stories and find them here on any device.
      </p>
      <Link to="/auth/login" className="btn-hindu-primary">
        Sign in
      </Link>
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
        Stories unavailable
      </h2>
      <p className="text-sm text-[#6B5642] mb-6">{message}</p>
      <button onClick={onRetry} className="btn-hindu-primary">
        Retry
      </button>
    </div>
  );
}
