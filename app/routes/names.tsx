import { useState, useEffect } from "react";
import { Sparkles, Heart, Loader2, Star, Search } from "lucide-react";
import { namesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";

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

export default function NamesPage() {
  const [names, setNames] = useState<AllahName[]>([]);
  const [dailyName, setDailyName] = useState<AllahName | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
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
          if (data && typeof data === "object") {
            const d = data as Record<string, unknown>;
            const name = (d.name ?? d.nameEnglish) as string | undefined;
            const nameArabic = (d.nameArabic ?? d.name_arabic) as string | undefined;
            const transliteration = (d.transliteration ?? d.nameTranslit ?? d.name_translit) as string | undefined;
            const meaning = (d.meaning ?? d.meaning) as string | undefined;
            if (name ?? nameArabic) {
              setDailyName({
                id: (d.id as number) ?? 0,
                number: (d.number as number) ?? 0,
                name: name ?? (d.nameEnglish as string) ?? "",
                nameArabic: nameArabic ?? "",
                transliteration: transliteration ?? "",
                meaning: meaning ?? "",
              });
              dailySet = true;
            }
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

  const filteredNames = names.filter(
    (name) =>
      name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in-up">
              <Sparkles size={28} className="text-gold-light mb-4" />
              <h1 className="text-3xl sm:text-4xl font-bold font-playfair mb-2">
                99 Names of Allah
              </h1>
              <p className="text-white/60 text-sm">
                Learn and reflect upon the Beautiful Names of Allah (Al-Asma ul-Husna)
              </p>
            </div>

            {/* Daily Name Card */}
            {dailyName && (
              <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/15">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
                    Today's Name
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-amiri text-3xl text-white mb-1" dir="rtl">
                        {dailyName.nameArabic}
                      </p>
                      <p className="text-xl font-bold text-white">{dailyName.name}</p>
                      <p className="text-sm text-white/70 mt-1">
                        {dailyName.transliteration}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-white/60 text-xs mb-1">Meaning</p>
                      <p className="text-white/90 text-sm">{dailyName.meaning}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12">
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
                      className="w-8 h-8 rounded-lg hover:bg-black/3 flex items-center justify-center transition-colors"
                      aria-label="Add to favorites"
                    >
                      <Heart size={16} className="text-text-muted" />
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
