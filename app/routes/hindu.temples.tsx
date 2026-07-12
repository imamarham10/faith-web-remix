import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router";
import {
  Landmark,
  Search,
  X,
  Loader2,
  AlertTriangle,
  MapPin,
  LocateFixed,
  Info,
} from "lucide-react";
import { hinduTemplesAPI } from "~/services/api";
import { JsonLd } from "~/components/JsonLd";
import { DEITY_KEYS, deityLabel, deityBadgeClass } from "~/lib/hinduDeities";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

const APP_URL = "https://www.siraat.website";
const NEARBY_RADIUS_KM = 300;

// ---------- Types (API contract §C3) ----------

interface Temple {
  id: string;
  name: string;
  deityKey: string | null;
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  significance: string | null;
  photos: string[];
  source: string;
  distanceKm?: number;
}

// ---------- Loader (SSR) ----------

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [templesRes, statesRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/v1/hindu/temples`),
    fetch(`${API_BASE}/api/v1/hindu/temples/states`),
  ]);

  let temples: unknown[] = [];
  let states: unknown[] = [];

  if (templesRes.status === "fulfilled" && templesRes.value.ok) {
    const json = await templesRes.value.json();
    temples = json.data || json;
  }
  if (statesRes.status === "fulfilled" && statesRes.value.ok) {
    const json = await statesRes.value.json();
    states = json.data || json;
  }

  return { temples, states };
}

// ---------- Meta ----------

export function meta() {
  return [
    { title: "Sacred Temples of India | Siraat" },
    {
      name: "description",
      content:
        "A curated directory of India's most significant Hindu temples — Jyotirlingas, Char Dham, Shakti Pithas and more, with directions, history and significance.",
    },
    { tagName: "link", rel: "canonical", href: `${APP_URL}/hindu/temples` },
    { property: "og:title", content: "Sacred Temples of India | Siraat" },
    {
      property: "og:description",
      content:
        "Kashi Vishwanath, Tirumala, Kedarnath and more — explore India's most sacred temples with directions and significance.",
    },
    { property: "og:url", content: `${APP_URL}/hindu/temples` },
    ...HINDU_OG_TAGS,
  ];
}

// ---------- Page ----------

export default function HinduTemplesPage() {
  const { temples: loaderTemples, states: loaderStates } =
    useLoaderData<typeof loader>();

  const [temples, setTemples] = useState<Temple[]>(
    (loaderTemples as unknown as Temple[]) || [],
  );
  const [states, setStates] = useState<string[]>(
    (loaderStates as unknown as string[]) || [],
  );
  const [loading, setLoading] = useState(
    !(Array.isArray(loaderTemples) && loaderTemples.length > 0),
  );
  const [error, setError] = useState("");

  const [deityFilter, setDeityFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [nameQuery, setNameQuery] = useState("");

  // "Near me" mode
  const [nearby, setNearby] = useState<Temple[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [geoNote, setGeoNote] = useState("");

  const fetchData = () => {
    setLoading(true);
    setError("");
    Promise.all([hinduTemplesAPI.getAll(), hinduTemplesAPI.getStates()])
      .then(([templesRes, statesRes]) => {
        const templesData = templesRes.data?.data || templesRes.data;
        const statesData = statesRes.data?.data || statesRes.data;
        if (Array.isArray(templesData)) {
          setTemples(templesData);
        } else {
          setError("Failed to load temples. Please try again.");
        }
        if (Array.isArray(statesData)) setStates(statesData);
      })
      .catch(() => {
        setError("Failed to load temples. Please make sure the backend is running.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNearMe = () => {
    setGeoNote("");
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoNote("Location isn't available in this browser — showing all temples instead.");
      return;
    }
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        hinduTemplesAPI
          .getNearby(pos.coords.latitude, pos.coords.longitude, NEARBY_RADIUS_KM)
          .then((res) => {
            const data = res.data?.data || res.data;
            setNearby(Array.isArray(data) ? data : []);
          })
          .catch(() => {
            setGeoNote("Couldn't find nearby temples right now — showing all temples instead.");
            setNearby(null);
          })
          .finally(() => setNearbyLoading(false));
      },
      () => {
        // Graceful denial: stay on the full list (panchang-style fallback).
        setGeoNote(
          "We couldn't access your location, so here's the full list of temples instead.",
        );
        setNearby(null);
        setNearbyLoading(false);
      },
      { timeout: 8000 },
    );
  };

  const clearNearby = () => {
    setNearby(null);
    setGeoNote("");
  };

  const isNearbyMode = nearby !== null;

  const source = isNearbyMode ? nearby : temples;
  const visible = source.filter((t) => {
    if (deityFilter !== "all" && t.deityKey !== deityFilter) return false;
    if (stateFilter !== "all" && t.state !== stateFilter) return false;
    if (
      nameQuery.trim() &&
      !t.name.toLowerCase().includes(nameQuery.trim().toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FBF6EC] pb-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Sacred Temples of India",
            description:
              "A curated directory of India's most significant Hindu temples.",
            url: `${APP_URL}/hindu/temples`,
            mainEntity: {
              "@type": "ItemList",
              name: "Hindu Temples",
              numberOfItems: temples.length,
              itemListElement: temples.slice(0, 50).map((t, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: t.name,
                url: `${APP_URL}/hindu/temples/${t.id}`,
              })),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
              { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
              { "@type": "ListItem", position: 3, name: "Temples", item: `${APP_URL}/hindu/temples` },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <Landmark size={12} />
              Temples
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight mb-4">
              Sacred Temples of India
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl">
              Jyotirlingas, Char Dham, Shakti Pithas and beloved shrines — a curated
              guide to the country's most significant temples, with directions for
              your yatra.
            </p>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
            <p className="text-sm text-[#6B5642]">Loading temples…</p>
          </div>
        ) : error ? (
          <ErrorCard message={error} onRetry={fetchData} />
        ) : (
          <>
            {/* Filter bar */}
            <div className="rounded-2xl bg-white border border-[#E8DCC4] p-4 mb-4 shadow-[0_1px_2px_rgba(74,17,25,0.04)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A7B3A]"
                  />
                  <input
                    type="text"
                    placeholder="Search temples by name…"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    className="w-full rounded-xl border border-[#E8DCC4] bg-[#FBF6EC]/60 pl-11 pr-10 py-2.5 text-sm text-[#3A0F18] placeholder:text-[#9A8A70] focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]/30"
                  />
                  {nameQuery && (
                    <button
                      onClick={() => setNameQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8A70] hover:text-[#3A0F18] transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <select
                  value={deityFilter}
                  onChange={(e) => setDeityFilter(e.target.value)}
                  className="rounded-xl border border-[#E8DCC4] bg-[#FBF6EC]/60 px-3 py-2.5 text-sm text-[#3A0F18] focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]/30"
                  aria-label="Filter by deity"
                >
                  <option value="all">All deities</option>
                  {DEITY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {deityLabel(key)}
                    </option>
                  ))}
                </select>

                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="rounded-xl border border-[#E8DCC4] bg-[#FBF6EC]/60 px-3 py-2.5 text-sm text-[#3A0F18] focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]/30"
                  aria-label="Filter by state"
                >
                  <option value="all">All states</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {isNearbyMode ? (
                  <button
                    onClick={clearNearby}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#6B1F2A] text-white hover:bg-[#4A1119] transition-colors"
                  >
                    <X size={15} />
                    Clear near me
                  </button>
                ) : (
                  <button
                    onClick={handleNearMe}
                    disabled={nearbyLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#6B1F2A]/25 text-[#6B1F2A] hover:bg-[#6B1F2A]/5 transition-colors disabled:opacity-60"
                  >
                    {nearbyLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <LocateFixed size={15} />
                    )}
                    Near me
                  </button>
                )}
              </div>
            </div>

            {/* Geolocation fallback note */}
            {geoNote && (
              <div className="flex items-start gap-3 rounded-2xl bg-[#FAF1D9] border border-[#E8D5A0] px-5 py-4 mb-4 text-sm text-[#7A5B19]">
                <Info size={16} className="mt-0.5 shrink-0" />
                <p>{geoNote}</p>
              </div>
            )}

            {isNearbyMode && (
              <p className="text-sm text-[#6B5642] mb-4">
                Showing temples within {NEARBY_RADIUS_KM} km of you, nearest first.
              </p>
            )}

            {/* Grid */}
            {visible.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 flex flex-col items-center justify-center text-center min-h-[280px]">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF1D9] text-[#9A7B3A] flex items-center justify-center mb-4">
                  <Landmark size={22} />
                </div>
                <h3 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
                  {isNearbyMode
                    ? "No temples nearby"
                    : "No temples match these filters"}
                </h3>
                <p className="text-sm text-[#6B5642] max-w-sm">
                  {isNearbyMode
                    ? `We didn't find a curated temple within ${NEARBY_RADIUS_KM} km. Browse the full directory instead.`
                    : "Try a different deity, state, or search term."}
                </p>
                <button
                  onClick={() => {
                    clearNearby();
                    setDeityFilter("all");
                    setStateFilter("all");
                    setNameQuery("");
                  }}
                  className="btn-hindu-primary mt-5"
                >
                  View all temples
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {visible.map((t) => (
                  <TempleCard key={t.id} temple={t} />
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

function TempleCard({ temple }: { temple: Temple }) {
  return (
    <Link
      to={`/hindu/temples/${temple.id}`}
      className="group rounded-2xl bg-white border border-[#E8DCC4] p-6 flex flex-col gap-3 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] hover:border-[#6B1F2A]/25 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {temple.deityKey && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${deityBadgeClass(temple.deityKey)}`}
          >
            {deityLabel(temple.deityKey)}
          </span>
        )}
        {typeof temple.distanceKm === "number" && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6B1F2A]/8 text-[#6B1F2A] text-[11px] font-semibold">
            <LocateFixed size={11} />
            {temple.distanceKm.toFixed(0)} km away
          </span>
        )}
      </div>

      <h3 className="font-playfair text-lg font-bold text-[#3A0F18] leading-snug group-hover:text-[#6B1F2A] transition-colors">
        {temple.name}
      </h3>

      <p className="inline-flex items-center gap-1.5 text-xs text-[#6B5642]">
        <MapPin size={12} className="text-[#9A7B3A]" />
        {[temple.city, temple.state].filter(Boolean).join(", ")}
      </p>

      {temple.description && (
        <p className="text-sm text-[#6B5642] leading-relaxed line-clamp-2">
          {temple.description}
        </p>
      )}
    </Link>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={22} />
      </div>
      <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
        Temples unavailable
      </h2>
      <p className="text-sm text-[#6B5642] mb-6">{message}</p>
      <button onClick={onRetry} className="btn-hindu-primary">
        Retry
      </button>
    </div>
  );
}
