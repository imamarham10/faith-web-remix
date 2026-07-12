import { useState, useEffect, memo } from "react";
import { Link, useLoaderData } from "react-router";
import {
  Clock,
  BookOpen,
  Calendar,
  ChevronRight,
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  Loader2,
  Flame,
  Landmark,
  Flower2,
  ScrollText,
  Sunrise,
  Heart,
} from "lucide-react";
import {
  hinduPanchangAPI,
  hinduPujaTimesAPI,
  hinduJapaAPI,
  hinduScripturesAPI,
} from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";

const APP_URL = "https://www.siraat.website";
const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.209, label: "New Delhi" };

/* ---------- Time-aware greeting (mirrors the Islam home) ---------- */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Namaste";
  if (hour < 12) return "Suprabhat";
  if (hour < 17) return "Namaste";
  if (hour < 20) return "Shubh Sandhya";
  return "Shubh Ratri";
}

function getGreetingDevanagari(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "नमस्ते";
  if (hour < 12) return "शुभ प्रभात";
  if (hour < 17) return "नमस्ते";
  if (hour < 20) return "शुभ संध्या";
  return "शुभ रात्रि";
}

/* ---------- Shared wall-clock helpers (same as panchang/puja pages) ---------- */

const formatWallTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

const devanagari = { fontFamily: "var(--font-devanagari)" } as const;

/* ---------- Types (match the wired pages' parsing) ---------- */

type SandhyaName = "pratah" | "madhyahna" | "sayam";

interface SandhyaInfo {
  name: SandhyaName;
  nameSanskrit: string;
  nameEnglish: string;
  band: { start: string; end: string };
  isCurrent: boolean;
}

interface PujaTimesData {
  sandhyas: SandhyaInfo[];
  next?: { sandhya: SandhyaName; startsInSeconds: number };
}

interface PanchangToday {
  tithi?: { name: string; nameSanskrit?: string; paksha: "shukla" | "krishna" };
  nakshatra?: { name: string; nameSanskrit?: string; deity?: string };
  vaara?: { name: string };
  sunrise?: string;
  festivals?: { slug: string; nameEnglish: string; nameSanskrit?: string }[];
}

interface FeaturedVerse {
  id: string;
  verseNumber: number;
  sanskritText: string;
  transliteration?: string;
  chapter?: { chapterNumber: number; nameEnglish?: string };
  text?: { slug: string; nameEnglish?: string };
  translations?: { text: string; authorName?: string }[];
}

const sandhyaLabel = (name: SandhyaName): string =>
  ({ pratah: "Pratah", madhyahna: "Madhyahna", sayam: "Sayam" })[name];

/* ---------- SSR loader: today's spiritual data (Delhi default) ---------- */

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const { lat, lng } = DEFAULT_LOCATION;

  const [panchangRes, featuredRes, emotionsRes, storiesRes, festivalsRes] =
    await Promise.allSettled([
      fetch(`${API_BASE}/api/v1/hindu/panchang/today?lat=${lat}&lng=${lng}&timezone=Asia/Kolkata`),
      fetch(`${API_BASE}/api/v1/hindu/scriptures/featured?slug=bhagavad-gita`),
      fetch(`${API_BASE}/api/v1/hindu/feelings`),
      fetch(`${API_BASE}/api/v1/hindu/stories`),
      fetch(`${API_BASE}/api/v1/hindu/panchang/festivals/upcoming?lat=${lat}&lng=${lng}&days=90&timezone=Asia/Kolkata`),
    ]);

  const parse = async (r: PromiseSettledResult<Response>) => {
    if (r.status !== "fulfilled" || !r.value.ok) return null;
    try {
      const json = await r.value.json();
      return json.data || json;
    } catch {
      return null;
    }
  };

  const [panchang, featured, emotions, stories, festivals] = await Promise.all([
    parse(panchangRes),
    parse(featuredRes),
    parse(emotionsRes),
    parse(storiesRes),
    parse(festivalsRes),
  ]);

  return {
    panchang: panchang as PanchangToday | null,
    featured: (Array.isArray(featured) ? featured : []) as FeaturedVerse[],
    emotions: Array.isArray(emotions) ? emotions : [],
    stories: Array.isArray(stories) ? stories : [],
    festivals: Array.isArray(festivals) ? festivals : [],
  };
}

/* ---------- Meta ---------- */

export function meta() {
  return [
    { title: "Hindu Spiritual Companion — Panchang, Gita, Japa | Siraat" },
    {
      name: "description",
      content:
        "Your daily Hindu companion: today's Panchang and sandhya times, a shloka from the Bhagavad Gita, japa practice, stotras, temples, festivals and sacred stories.",
    },
    { tagName: "link", rel: "canonical", href: `${APP_URL}/hindu` },
    { property: "og:title", content: "Hindu Spiritual Companion | Siraat" },
    {
      property: "og:description",
      content:
        "Daily Panchang, the Bhagavad Gita, japa, stotras, temples and festivals — everything for daily practice.",
    },
    { property: "og:url", content: `${APP_URL}/hindu` },
  ];
}

/* ---------- Day-of-year rotation (deterministic daily pick) ---------- */

function dayOfYear(): number {
  const now = new Date();
  return Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
}

/* ============================ PAGE ============================ */

export default function HinduHome() {
  const { panchang: loaderPanchang, featured, emotions, stories, festivals } =
    useLoaderData<typeof loader>();
  const { isAuthenticated } = useAuth();

  const [panchang, setPanchang] = useState<PanchangToday | null>(loaderPanchang);
  const [pujaTimes, setPujaTimes] = useState<PujaTimesData | null>(null);
  const [nextTarget, setNextTarget] = useState<number | null>(null); // epoch ms
  const [locationName, setLocationName] = useState("Locating…");

  // Logged-in sadhana dashboard
  const [sandhyaStreak, setSandhyaStreak] = useState(0);
  const [japaTotal, setJapaTotal] = useState(0);
  const [topCounter, setTopCounter] = useState<{
    name: string;
    mantraSanskrit?: string;
    count: number;
    targetCount?: number;
  } | null>(null);
  const [latestBookmark, setLatestBookmark] = useState<{
    chapterNumber: number;
    verseNumber: number;
  } | null>(null);

  // Daily rotations — deterministic by date, from SSR data
  const shlokaOfDay =
    featured.length > 0 ? featured[dayOfYear() % featured.length] : null;
  const kathaOfDay =
    stories.length > 0 ? (stories as any[])[dayOfYear() % stories.length] : null;

  /* Live location → refine panchang + fetch sandhya times */
  useEffect(() => {
    const fetchFor = (lat: number, lng: number, label: string) => {
      setLocationName(label);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      hinduPanchangAPI
        .getToday(lat, lng, tz)
        .then((res) => {
          const data = res.data?.data || res.data;
          if (data?.tithi) setPanchang(data);
        })
        .catch(() => {});
      hinduPujaTimesAPI
        .getToday(lat, lng, tz)
        .then((res) => {
          const data = res.data?.data || res.data;
          if (data?.sandhyas) {
            setPujaTimes(data);
            if (data.next?.startsInSeconds != null) {
              setNextTarget(Date.now() + data.next.startsInSeconds * 1000);
            }
          }
        })
        .catch(() => {});
    };

    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        fetchFor(
          pos.coords.latitude,
          pos.coords.longitude,
          `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
        ),
      () => fetchFor(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_LOCATION.label),
    );
  }, []);

  /* Logged-in dashboard data */
  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.allSettled([
      hinduPujaTimesAPI.getStats(),
      hinduJapaAPI.getStats(),
      hinduJapaAPI.getCounters(),
      hinduScripturesAPI.getBookmarks(),
    ]).then(([pujaStats, japaStats, counters, bookmarks]) => {
      if (pujaStats.status === "fulfilled") {
        const d = pujaStats.value.data?.data ?? pujaStats.value.data;
        setSandhyaStreak(d?.currentStreak ?? 0);
      }
      if (japaStats.status === "fulfilled") {
        const d = japaStats.value.data?.data ?? japaStats.value.data;
        setJapaTotal(d?.totalCount ?? d?.totalJapa ?? 0);
      }
      if (counters.status === "fulfilled") {
        const d = counters.value.data?.data ?? counters.value.data;
        if (Array.isArray(d) && d.length > 0) setTopCounter(d[0]);
      }
      if (bookmarks.status === "fulfilled") {
        const d = bookmarks.value.data?.data ?? bookmarks.value.data;
        if (Array.isArray(d) && d.length > 0) {
          const v = d[0]?.verse;
          if (v?.chapter?.chapterNumber) {
            setLatestBookmark({
              chapterNumber: v.chapter.chapterNumber,
              verseNumber: v.verseNumber,
            });
          }
        }
      }
    });
  }, [isAuthenticated]);

  const tithiLine = panchang?.tithi
    ? `${panchang.tithi.name} · ${panchang.tithi.paksha === "shukla" ? "Shukla Paksha" : "Krishna Paksha"}`
    : "";
  const todayFestivals = panchang?.festivals || [];
  const nextSandhya = pujaTimes?.next
    ? pujaTimes.sandhyas.find((s) => s.name === pujaTimes.next!.sandhya)
    : null;

  return (
    <div className="bg-[#FBF6EC] min-h-screen">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Siraat — Hindu Spiritual Companion",
            description:
              "Daily Panchang, sandhya times, the Bhagavad Gita, japa, stotras, temples and festivals.",
            url: `${APP_URL}/hindu`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
              { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
            ],
          },
        ]}
      />

      {/* ─────────────── HERO — today's practice, live ─────────────── */}
      <section className="bg-hero-hindu text-white pattern-kolam">
        <div className="container-faith py-10 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left — greeting + today */}
            <div className="animate-fade-in-up">
              <p className="text-white/80 text-lg mb-1" style={devanagari}>
                {getGreetingDevanagari()}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-3 leading-tight">
                {getGreeting()}
                <span className="block text-base sm:text-lg font-medium text-white/80 mt-2">
                  Siraat — Your Hindu Spiritual Companion
                </span>
              </h1>

              {/* Today's tithi + date */}
              <div className="space-y-1 mb-6">
                {tithiLine && (
                  <p className="text-white/90 text-sm sm:text-base flex items-center gap-2">
                    <Calendar size={16} className="text-[#E8D5A0]" />
                    {tithiLine}
                    {panchang?.tithi?.nameSanskrit && (
                      <span className="text-white/60" style={devanagari}>
                        {panchang.tithi.nameSanskrit}
                      </span>
                    )}
                  </p>
                )}
                <p className="text-white/90 text-xs sm:text-sm flex items-center gap-2">
                  <Calendar size={14} />
                  {new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }).format(new Date())}
                </p>
              </div>

              {/* Today's festivals */}
              {todayFestivals.length > 0 && (
                <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-white/90 text-[11px] uppercase tracking-wider mb-1.5">
                    Today's Festivals
                  </p>
                  {todayFestivals.map((f) => (
                    <p key={f.slug} className="text-white/90 text-sm">
                      {f.nameEnglish}
                      {f.nameSanskrit && (
                        <span className="text-white/60 ml-2" style={devanagari}>
                          {f.nameSanskrit}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-lg mb-8">
                Your daily companion for sadhana. Follow the Panchang, keep your
                sandhya, read the Gita, and count your japa — all in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/hindu/panchang"
                  className="inline-flex items-center gap-2 bg-white text-[#4A1119] font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all text-sm shadow-lg"
                >
                  <Calendar size={16} />
                  Today's Panchang
                </Link>
                <Link
                  to="/hindu/scriptures"
                  className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-all text-sm border border-white/20"
                >
                  <BookOpen size={16} />
                  Read the Gita
                </Link>
              </div>
            </div>

            {/* Right — Next Sandhya card (live) */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/15">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white/90 text-xs uppercase tracking-wider font-semibold">
                      Next Sandhya
                    </p>
                    <p className="text-white text-2xl sm:text-3xl font-bold mt-1">
                      {nextSandhya ? sandhyaLabel(nextSandhya.name) : "—"}
                      {nextSandhya?.nameSanskrit && (
                        <span
                          className="block text-base font-medium text-white/70 mt-0.5"
                          style={devanagari}
                        >
                          {nextSandhya.nameSanskrit}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Sunrise size={24} className="text-[#E8D5A0]" />
                  </div>
                </div>

                <SandhyaCountdown target={nextTarget} />

                {/* All sandhya bands */}
                {pujaTimes ? (
                  <div className="space-y-2">
                    {pujaTimes.sandhyas.map((s) => {
                      const isNext = pujaTimes.next?.sandhya === s.name;
                      return (
                        <div
                          key={s.name}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
                            isNext || s.isCurrent
                              ? "bg-white/15 text-white font-semibold"
                              : "text-white/90"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {sandhyaLabel(s.name)}
                            {s.isCurrent && (
                              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                Now
                              </span>
                            )}
                          </span>
                          <span className="tabular-nums">
                            {formatWallTime(s.band.start)} – {formatWallTime(s.band.end)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-white/60" />
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-white/90 text-xs">
                    <MapPin size={12} />
                    {locationName}
                  </div>
                  <Link
                    to="/hindu/puja-times"
                    className="text-xs text-white/90 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Shloka of the day + Nakshatra (overlap cards) ─────────── */}
      <section className="container-faith -mt-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Shloka of the day */}
          <Link
            to={
              shlokaOfDay?.chapter
                ? `/hindu/scriptures/bhagavad-gita/${shlokaOfDay.chapter.chapterNumber}`
                : "/hindu/scriptures"
            }
            className="card-elevated p-5 flex items-center gap-4 group animate-fade-in-up"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#6B1F2A]/10 group-hover:bg-[#6B1F2A] flex items-center justify-center shrink-0 transition-colors">
              <Sparkles size={20} className="text-[#6B1F2A] group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                Shloka of the Day
              </p>
              {shlokaOfDay ? (
                <>
                  <p
                    className="text-lg text-text leading-snug mb-0.5 truncate"
                    style={devanagari}
                    lang="sa"
                  >
                    {shlokaOfDay.sanskritText.split("।")[0]}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    Bhagavad Gita {shlokaOfDay.chapter?.chapterNumber}.
                    {shlokaOfDay.verseNumber}
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-muted">Open the Gita reader</p>
              )}
            </div>
            <ChevronRight
              size={15}
              className="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Link>

          {/* Today's Nakshatra */}
          <Link
            to="/hindu/panchang"
            className="card-elevated p-5 flex items-center gap-4 group animate-fade-in-up"
            style={{ animationDelay: "0.06s" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500 flex items-center justify-center shrink-0 transition-colors">
              <Star size={20} className="text-amber-600 group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                Today's Nakshatra
              </p>
              {panchang?.nakshatra ? (
                <>
                  <p className="text-sm font-semibold text-text">
                    {panchang.nakshatra.name}
                    {panchang.nakshatra.nameSanskrit && (
                      <span className="ml-2 text-text-muted font-normal" style={devanagari}>
                        {panchang.nakshatra.nameSanskrit}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {panchang.nakshatra.deity
                      ? `Deity: ${panchang.nakshatra.deity}`
                      : "See the full Panchang"}
                    {panchang.sunrise ? ` · Sunrise ${formatWallTime(panchang.sunrise)}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-muted">See the full Panchang</p>
              )}
            </div>
            <ChevronRight
              size={15}
              className="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {[
            { title: "Panchang", icon: Calendar, link: "/hindu/panchang", iconBg: "bg-[#6B1F2A]" },
            { title: "Gita", icon: BookOpen, link: "/hindu/scriptures", iconBg: "bg-amber-600" },
            { title: "Japa", icon: Flower2, link: "/hindu/japa", iconBg: "bg-emerald-700" },
            { title: "Stotras", icon: ScrollText, link: "/hindu/stotras", iconBg: "bg-[#8B3344]" },
            { title: "Temples", icon: Landmark, link: "/hindu/temples", iconBg: "bg-sky-700" },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.title}
                to={f.link}
                className="card-elevated p-4 sm:p-5 text-center group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${f.iconBg} flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-text">{f.title}</h3>
              </Link>
            );
          })}
        </div>

        {/* Logged-in sadhana dashboard */}
        {isAuthenticated && (
          <div className="mt-6 md:mt-8">
            <div className="mb-4">
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-text">
                Your Sadhana
              </h2>
              <p className="text-text-muted text-sm mt-1">Today's practice overview</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sandhya streak */}
              <Link
                to="/hindu/puja-times"
                className="card-elevated p-5 group hover:border-[#6B1F2A]/20 transition-all"
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1">
                      Sandhya Streak
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-text tabular-nums">
                        {sandhyaStreak}
                      </span>
                      <span className="text-sm text-text-muted">days</span>
                    </div>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      sandhyaStreak > 0 ? "bg-amber-500/10" : "bg-border-light"
                    }`}
                  >
                    <Flame
                      size={20}
                      className={sandhyaStreak > 0 ? "text-amber-500" : "text-text-muted"}
                    />
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Log today's sandhya to keep it going
                </p>
              </Link>

              {/* Japa counter */}
              <Link
                to="/hindu/japa"
                className="card-elevated p-5 group hover:border-[#6B1F2A]/20 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#6B1F2A]/10 flex items-center justify-center">
                    <Flower2 size={18} className="text-[#6B1F2A]" />
                  </div>
                  <span className="text-2xl font-bold text-text tabular-nums">
                    {japaTotal.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text mb-1">Total Japa</p>
                {topCounter ? (
                  <>
                    <p className="text-xs text-text-muted mb-2 truncate">
                      Active: {topCounter.mantraSanskrit || topCounter.name}
                    </p>
                    <div className="w-full bg-border-light h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6B1F2A] rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((topCounter.count || 0) / (topCounter.targetCount || 108)) * 100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1.5">
                      {topCounter.count || 0} / {topCounter.targetCount || 108}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-text-muted">Start a mala</p>
                )}
              </Link>

              {/* Resume Gita */}
              <Link
                to={
                  latestBookmark
                    ? `/hindu/scriptures/bhagavad-gita/${latestBookmark.chapterNumber}`
                    : "/hindu/scriptures"
                }
                className="card-elevated p-5 group hover:border-[#6B1F2A]/20 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <BookOpen size={18} className="text-amber-600" />
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-sm font-semibold text-text mb-1">
                  {latestBookmark ? "Resume the Gita" : "Read the Gita"}
                </p>
                <p className="text-xs text-text-muted">
                  {latestBookmark
                    ? `Last bookmark: Chapter ${latestBookmark.chapterNumber}, Verse ${latestBookmark.verseNumber}`
                    : "18 chapters, verse by verse"}
                </p>
                <div className="mt-3">
                  <span className="text-xs font-medium text-amber-700 bg-amber-500/10 px-2 py-1 rounded-lg">
                    {latestBookmark ? "Continue reading →" : "Start reading →"}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ─────────── How is your heart today? ─────────── */}
      {emotions.length > 0 && (
        <section className="container-faith py-12 md:py-16">
          <div className="mb-5">
            <h2 className="font-playfair text-xl sm:text-2xl font-bold text-text">
              How is your heart today?
            </h2>
            <p className="text-text-muted text-sm mt-1">
              Gita verses chosen for whatever you're carrying
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {emotions.map((e: any) => (
              <Link
                key={e.slug}
                to={`/hindu/feelings/${e.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#E8DCC4] text-sm font-medium text-[#3A0F18] hover:border-[#6B1F2A]/40 hover:-translate-y-0.5 transition-all shadow-[0_1px_2px_rgba(74,17,25,0.04)]"
              >
                <span aria-hidden>{e.icon}</span>
                {e.nameEnglish}
                {e.nameHindi && (
                  <span className="text-text-muted text-xs" style={devanagari}>
                    {e.nameHindi}
                  </span>
                )}
              </Link>
            ))}
            <Link
              to="/hindu/feelings"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#6B1F2A] text-white text-sm font-semibold hover:bg-[#4A1119] transition-colors"
            >
              <Heart size={14} />
              All feelings
            </Link>
          </div>
        </section>
      )}

      {/* ─────────── Katha of the day ─────────── */}
      {kathaOfDay && (
        <section className="container-faith pb-4 md:pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-text">
                Katha of the Day
              </h2>
              <p className="text-text-muted text-sm mt-1">
                Timeless stories from the Puranas and the Ramayana
              </p>
            </div>
            <Link
              to="/hindu/stories"
              className="text-sm text-[#6B1F2A] font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Browse All <ChevronRight size={14} />
            </Link>
          </div>
          <Link
            to={`/hindu/stories/${kathaOfDay.id}`}
            className="card-elevated p-6 sm:p-8 block group hover:border-[#6B1F2A]/20 border border-transparent transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              {kathaOfDay.collection?.name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6B1F2A]/8 text-[#6B1F2A] text-[11px] font-semibold">
                  <ScrollText size={11} />
                  {kathaOfDay.collection.name}
                </span>
              )}
            </div>
            <h3 className="font-playfair text-xl sm:text-2xl font-bold text-text group-hover:text-[#6B1F2A] transition-colors">
              {kathaOfDay.title}
            </h3>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed mt-2 line-clamp-2">
              {kathaOfDay.summary}
            </p>
            <div className="mt-4 pt-4 border-t border-border-light">
              <span className="text-xs text-[#6B1F2A] font-medium group-hover:underline">
                Read the full story →
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* ─────────── Daily wisdom + Upcoming festivals ─────────── */}
      <section className="container-faith py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Daily shloka, in full */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-text">
                Daily Wisdom
              </h2>
              <p className="text-text-muted text-sm mt-1">A verse to carry through the day</p>
            </div>
            {shlokaOfDay ? (
              <div className="card-elevated p-6 sm:p-8">
                <Sparkles size={20} className="text-[#9A7B3A] mb-4" />
                <blockquote
                  className="text-xl sm:text-2xl text-text leading-relaxed mb-3"
                  style={devanagari}
                  lang="sa"
                >
                  {shlokaOfDay.sanskritText}
                </blockquote>
                {shlokaOfDay.transliteration && (
                  <p className="text-text-muted italic text-sm mb-3">
                    {shlokaOfDay.transliteration}
                  </p>
                )}
                {shlokaOfDay.translations?.[0]?.text && (
                  <p className="text-text-secondary text-base leading-relaxed mb-2">
                    "{shlokaOfDay.translations[0].text}"
                  </p>
                )}
                <p className="text-text-muted text-sm">
                  Bhagavad Gita {shlokaOfDay.chapter?.chapterNumber}.{shlokaOfDay.verseNumber}
                  {shlokaOfDay.translations?.[0]?.authorName
                    ? ` · ${shlokaOfDay.translations[0].authorName}`
                    : ""}
                </p>
                <div className="mt-6">
                  <Link
                    to={`/hindu/scriptures/bhagavad-gita/${shlokaOfDay.chapter?.chapterNumber || 1}`}
                    className="btn-hindu-primary text-sm"
                  >
                    Read in context
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card-elevated p-6 sm:p-8 flex items-center justify-center min-h-40">
                <Link to="/hindu/scriptures" className="btn-hindu-primary text-sm">
                  Open the Gita
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming festivals */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-playfair text-xl sm:text-2xl font-bold text-text">
                  Coming Up
                </h2>
                <p className="text-text-muted text-sm mt-1">Festivals & vrats</p>
              </div>
              <Link
                to="/hindu/panchang"
                className="text-sm text-[#6B1F2A] font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                All <ChevronRight size={14} />
              </Link>
            </div>
            {festivals.length > 0 ? (
              <div className="space-y-3">
                {(festivals as any[]).slice(0, 5).map((item: any, i: number) => {
                  const fest = item.festival || item;
                  const dateStr = item.date;
                  const daysUntil = (() => {
                    if (!dateStr) return undefined;
                    const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
                    if (!y) return undefined;
                    const target = new Date(y, m - 1, d);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return Math.round((target.getTime() - today.getTime()) / 86400000);
                  })();
                  return (
                    <div key={fest.slug || i} className="card p-4 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#FBF6EC] border border-[#E8DCC4] flex items-center justify-center shrink-0">
                        <Star size={16} className="text-[#9A7B3A]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-text">
                            {fest.nameEnglish}
                          </h4>
                          {fest.nameSanskrit && (
                            <span className="text-sm text-text-muted" style={devanagari}>
                              {fest.nameSanskrit}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          {dateStr && (
                            <p className="text-[11px] text-text-muted">
                              {new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric",
                              }).format(new Date(dateStr))}
                            </p>
                          )}
                          {daysUntil !== undefined && (
                            <p className="text-[11px] text-[#6B1F2A] font-medium">
                              {daysUntil <= 0
                                ? "Today"
                                : `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card p-5 text-sm text-text-muted">
                Festival dates appear here as they approach.{" "}
                <Link to="/hindu/panchang" className="text-[#6B1F2A] font-medium">
                  Open the Panchang →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────── Explore all features ─────────── */}
      <section className="container-faith pb-12 md:pb-16">
        <div className="mb-5">
          <h2 className="font-playfair text-xl sm:text-2xl font-bold text-text">
            Explore Features
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Everything for your spiritual journey
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[
            { icon: Calendar, title: "Panchang", link: "/hindu/panchang", desc: "Tithi, nakshatra, yoga, karana and auspicious times for your location.", badge: "Essential" },
            { icon: Clock, title: "Sandhya Times", link: "/hindu/puja-times", desc: "Dawn, midday and dusk worship windows, with a log to keep your practice steady.", badge: "Essential" },
            { icon: BookOpen, title: "Bhagavad Gita", link: "/hindu/scriptures", desc: "All 18 chapters — Sanskrit, transliteration and translation, with bookmarks.", badge: "Essential" },
            { icon: Flower2, title: "Japa Mala", link: "/hindu/japa", desc: "Count mantra repetitions with goals, streaks and a mantra library.", badge: "Popular" },
            { icon: ScrollText, title: "Stotras & Aartis", link: "/hindu/stotras", desc: "The Hanuman Chalisa and more — full Sanskrit with meaning, by deity." },
            { icon: Landmark, title: "Sacred Temples", link: "/hindu/temples", desc: "Jyotirlingas, Char Dham and Shakti Pithas — with directions for your yatra." },
            { icon: Heart, title: "Feelings", link: "/hindu/feelings", desc: "Gita verses matched to what your heart is carrying today." },
            { icon: Star, title: "Sacred Stories", link: "/hindu/stories", desc: "Kathas from the Puranas and the Ramayana, told simply and reverently.", badge: "New" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.title} to={f.link} className="card-elevated p-6 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#6B1F2A]/10 flex items-center justify-center text-[#6B1F2A] group-hover:bg-[#6B1F2A] group-hover:text-white transition-colors">
                    <Icon size={22} />
                  </div>
                  {f.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#6B1F2A]/8 text-[#6B1F2A]">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-text mb-1.5 group-hover:text-[#6B1F2A] transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#6B1F2A] opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─────────── Why Siraat (SEO prose) ─────────── */}
      <section className="container-faith pb-14 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-text mb-6">
            Your Complete Hindu Companion
          </h2>
          <div className="space-y-4">
            <p className="text-text-secondary leading-relaxed">
              Siraat is a free, privacy-respecting companion for daily Hindu practice.
              Whether you keep the morning sandhya at home, read a chapter of the
              Bhagavad Gita on your commute, or count japa before bed, Siraat brings
              every essential together so you can focus on your sadhana.
            </p>
            <p className="text-text-secondary leading-relaxed">
              The daily Panchang is computed for your exact location — tithi,
              nakshatra, yoga, karana, sunrise and sunset, along with Rahu Kaal and
              the day's auspicious windows. The Gita reader presents each verse in
              Devanagari with transliteration and a faithful English translation,
              and the festival calendar keeps Ekadashi, Navratri and every major
              utsav in view before they arrive.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Beyond the essentials, Siraat offers a japa mala with goals and
              streaks, stotras and aartis with meaning — from the Hanuman Chalisa to
              the Shiva Tandava Stotram — a curated guide to India's most sacred
              temples, and stories from the Puranas told simply for every
              generation. Every feature is built with care, so your practice — not
              the app — stays at the centre.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Live countdown to the next sandhya ---------- */

const SandhyaCountdown = memo(function SandhyaCountdown({
  target,
}: {
  target: number | null;
}) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown("00:00:00");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`,
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!countdown) return null;

  return (
    <div className="mb-6">
      <p className="text-white/90 text-xs mb-2 uppercase tracking-wider">Countdown</p>
      <div className="flex gap-2">
        {countdown.split(":").map((unit, i) => (
          <div key={i} className="bg-white/10 rounded-xl px-4 py-3 text-center flex-1">
            <span className="text-white text-2xl sm:text-3xl font-bold tabular-nums">
              {unit}
            </span>
            <p className="text-white/90 text-[11px] uppercase mt-0.5">
              {["hrs", "min", "sec"][i]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});
