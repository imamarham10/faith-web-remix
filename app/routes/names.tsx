import { useState, useEffect } from "react";
import { Sparkles, Heart, Loader2, Star, Search } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { namesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";

/** API response shape from /api/v1/islam/names/allah */
interface AllahNameAPI {
  id: number;
  nameArabic: string;
  nameTranslit: string;
  nameEnglish: string;
  meaning: string;
  description: string | null;
  audioUrl: string | null;
}

/** UI shape used in the page */
interface AllahName {
  id: number;
  number: number;
  name: string;
  nameArabic: string;
  transliteration: string;
  meaning: string;
  description?: string;
}

function mapApiNameToUi(api: AllahNameAPI, index: number): AllahName {
  return {
    id: api.id,
    number: index + 1,
    name: api.nameEnglish,
    nameArabic: api.nameArabic,
    transliteration: api.nameTranslit,
    meaning: api.meaning,
    description: api.description ?? undefined,
  };
}

function parseDailyName(data: unknown): AllahName | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const name = (d.name ?? d.nameEnglish) as string | undefined;
  const nameArabic = (d.nameArabic ?? d.name_arabic) as string | undefined;
  const transliteration = (d.transliteration ?? d.nameTranslit ?? d.name_translit) as string | undefined;
  const meaning = d.meaning as string | undefined;
  if (!(name ?? nameArabic)) return null;
  return {
    id: (d.id as number) ?? 0,
    number: (d.number as number) ?? 0,
    name: name ?? (d.nameEnglish as string) ?? "",
    nameArabic: nameArabic ?? "",
    transliteration: transliteration ?? "",
    meaning: meaning ?? "",
  };
}

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [namesRes, dailyRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/v1/islam/names/allah`),
    fetch(`${API_BASE}/api/v1/islam/names/daily`),
  ]);

  let names: AllahName[] = [];
  let dailyName: AllahName | null = null;

  if (namesRes.status === "fulfilled" && namesRes.value.ok) {
    const json = await namesRes.value.json();
    const raw = json.data ?? json;
    const arr = Array.isArray(raw) ? raw : raw?.names ?? [];
    names = (arr as AllahNameAPI[]).map((n, i) => mapApiNameToUi(n, i));
  }

  if (dailyRes.status === "fulfilled" && dailyRes.value.ok) {
    const json = await dailyRes.value.json();
    const raw = json.data ?? json;
    dailyName = parseDailyName(raw);
  }

  // Fallback: pick a name from the list by day of year
  if (!dailyName && names.length > 0) {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    dailyName = names[dayOfYear % names.length];
  }

  return { names, dailyName };
}

export default function NamesPage() {
  const loaderData = useLoaderData<typeof loader>();
  const [names, setNames] = useState<AllahName[]>(loaderData.names);
  const [dailyName, setDailyName] = useState<AllahName | null>(loaderData.dailyName);
  const [loading, setLoading] = useState(loaderData.names.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const { isAuthenticated } = useAuth();

  // Client-side fallback: only fetch if loader returned empty data
  useEffect(() => {
    if (names.length > 0) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [namesRes, dailyRes] = await Promise.allSettled([
          namesAPI.getAllNames(),
          namesAPI.getDailyName(),
        ]);

        let mappedNames: AllahName[] = [];
        if (namesRes.status === "fulfilled") {
          const raw = namesRes.value.data;
          const data = Array.isArray(raw) ? raw : raw?.data ?? raw?.names ?? [];
          const apiNames = data as AllahNameAPI[];
          mappedNames = apiNames.map((n, i) => mapApiNameToUi(n, i));
          setNames(mappedNames);
        }

        let dailySet = false;
        if (dailyRes.status === "fulfilled") {
          const raw = dailyRes.value.data;
          const data = raw?.data ?? raw;
          const parsed = parseDailyName(data);
          if (parsed) {
            setDailyName(parsed);
            dailySet = true;
          }
        }
        // Fallback: show a "name of the day" from the list when daily API is unavailable
        if (!dailySet && mappedNames.length > 0) {
          const dayOfYear = Math.floor(
            (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
          );
          setDailyName(mappedNames[dayOfYear % mappedNames.length]);
        }
      } catch (err) {
        console.error("Error fetching names:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFavorite = async (nameId: number) => {
    try {
      await namesAPI.addFavorite(nameId);
      setFavorites(prev => {
        const next = new Set(prev);
        if (next.has(nameId)) { next.delete(nameId); } else { next.add(nameId); }
        return next;
      });
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const filteredNames = names.filter(
    (name) =>
      name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gradient-surface min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "99 Names of Allah (Al-Asma ul-Husna)",
        "description": "Learn the 99 Beautiful Names of Allah with Arabic calligraphy, transliteration, meanings, and descriptions.",
        "url": "https://siraatt.vercel.app/names",
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": 99,
          "name": "99 Names of Allah",
          "itemListElement": names.slice(0, 99).map((n: AllahName, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": `${n.name} (${n.nameArabic})`
          }))
        }
      }} />
      {/* Hero */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in-up">
              <Sparkles size={28} className="text-gold-light mb-4" />
              <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">
                99 Names of Allah
              </h1>
              <p className="text-white/90 text-sm mb-4">
                Learn and reflect upon the Beautiful Names of Allah (Al-Asma ul-Husna)
              </p>
              <Link
                to="/names/muhammad"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/15"
              >
                <Sparkles size={14} className="text-gold-light" />
                99 Names of the Prophet ﷺ
              </Link>
            </div>

            {/* Daily Name Card */}
            {dailyName && (
              <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/15">
                  <p className="text-white/90 text-xs uppercase tracking-wider mb-3">
                    Today's Name
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-amiri text-3xl text-white mb-1" dir="rtl">
                        {dailyName.nameArabic}
                      </p>
                      <p className="text-xl font-bold text-white">{dailyName.name}</p>
                      <p className="text-sm text-white/80 mt-1">
                        {dailyName.transliteration}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-white/90 text-xs mb-1">Meaning</p>
                      <p className="text-white/90 text-sm">{dailyName.meaning}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Introductory Prose */}
      <div className="container-faith pt-8 md:pt-12">
        <div className="card-elevated p-6 md:p-8 mb-8">
          <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">Understanding Al-Asma ul-Husna: The 99 Beautiful Names of Allah</h2>
          <div className="space-y-3">
            <p className="text-text-secondary text-sm leading-relaxed">
              In Islamic theology, Allah has revealed ninety-nine Beautiful Names (Al-Asma ul-Husna), each describing a unique attribute of the Divine. The Prophet Muhammad (peace be upon him) said: "Allah has ninety-nine Names, one hundred minus one; whoever memorizes and understands them all will enter Paradise" (Sahih al-Bukhari). These names are not merely titles — they are windows into understanding God's relationship with His creation, encompassing mercy, justice, wisdom, and love.
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              Scholars throughout Islamic history have emphasized that learning and reflecting upon these names is one of the most rewarding forms of worship. Each name invites the believer to recognize a facet of Allah's perfection — from Ar-Rahman (The Most Merciful) and Al-Wadud (The Most Loving) to Al-Hakim (The All-Wise) and Al-Adl (The Just). By contemplating these attributes, Muslims deepen their faith, find comfort in hardship, and cultivate a more intimate connection with their Creator. Explore each name below to discover its Arabic calligraphy, transliteration, and meaning.
            </p>
          </div>
        </div>
      </div>

      <div className="container-faith pb-8 md:pb-12">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, transliteration, or meaning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field input-with-left-icon w-full"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-text-muted mt-2">
              Found {filteredNames.length} name{filteredNames.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Names Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 stagger-children">
            {filteredNames.map((name, i) => (
              <div
                key={name.id}
                className="card-elevated p-5 animate-fade-in-up"
                style={{ animationDelay: `${(i % 12) * 0.03}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{name.number}</span>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => toggleFavorite(name.id)}
                      className="w-8 h-8 rounded-lg hover:bg-black/3 flex items-center justify-center transition-colors"
                      aria-label={favorites.has(name.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        size={16}
                        className={favorites.has(name.id) ? "text-red-500 fill-red-500" : "text-text-muted"}
                      />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="font-amiri text-2xl text-text mb-1" dir="rtl">
                      {name.nameArabic}
                    </p>
                    <p className="text-lg font-semibold text-text">{name.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {name.transliteration}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border-light">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {name.meaning}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredNames.length === 0 && (
          <div className="card-elevated p-12 text-center">
            <Star size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">
              No names found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
