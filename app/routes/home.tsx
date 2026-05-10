import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Sunrise,
  BookOpen,
  CalendarHeart,
  HeartHandshake,
  Headphones,
  Compass,
  Clock,
  Bell,
} from "lucide-react";
import { useFaith } from "~/contexts/FaithContext";
import { useAuth } from "~/contexts/AuthContext";
import { FAITH_CONFIGS, FAITH_KEYS, type FaithKey } from "~/utils/faithConfig";
import { JsonLd } from "~/components/JsonLd";

/* ────────────── Generic, faith-agnostic capabilities ────────────── */
const CAPABILITIES = [
  {
    icon: Sunrise,
    title: "Daily practice timing",
    body: "Know exactly when to pray, meditate or chant — accurate to your coordinates.",
  },
  {
    icon: BookOpen,
    title: "Sacred texts, side-by-side",
    body: "Original tongue, faithful translation, audio recitation. Bookmark, search, return.",
  },
  {
    icon: HeartHandshake,
    title: "Reflection that sticks",
    body: "Counters, goals, streaks. The infrastructure to keep showing up.",
  },
  {
    icon: CalendarHeart,
    title: "A sacred calendar",
    body: "Festivals, fasts and holy days surfaced before they slip past.",
  },
  {
    icon: Compass,
    title: "Sacred direction",
    body: "Find your way to prayer — whatever direction your tradition turns.",
  },
  {
    icon: Headphones,
    title: "Listen, anywhere",
    body: "Audio for verses, mantras and prayers — for the commute, the walk, the wait.",
  },
] as const;

/* ────────────── Roadmap ────────────── */
type RoadmapItem = { name: string; status: "live" | "soon" | "later"; href: string | null; eta: string };
const ROADMAP: RoadmapItem[] = [
  { name: "Islam", status: "live", href: "/islam", eta: "Live" },
  { name: "Hinduism", status: "soon", href: "/hindu", eta: "In development" },
  { name: "Christianity", status: "later", href: null, eta: "Roadmap" },
  { name: "Buddhism", status: "later", href: null, eta: "Roadmap" },
  { name: "Sikhism", status: "later", href: null, eta: "Roadmap" },
  { name: "Judaism", status: "later", href: null, eta: "Roadmap" },
];

/* ────────────── Decorative SVG that mirrors the brand mark ────────────── */
function BrushArc({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 70"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="100" cy="14" r="3.5" fill="#E0B470" />
      <path
        d="M12 60 Q100 -6 188 60"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export default function Landing() {
  const { setFaith, config } = useFaith();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Only signed-in users skip the neutral landing — they go straight to
  // their faith home. Anonymous visitors always see this page so the
  // multi-faith pitch and faith picker land properly.
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && config) {
      navigate(config.pathPrefix, { replace: true });
    }
  }, [isAuthenticated, isLoading, config, navigate]);

  const handlePick = async (key: FaithKey) => {
    await setFaith(key);
    navigate(FAITH_CONFIGS[key].pathPrefix);
  };

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Siraat",
          alternateName: "Siraat — A Bridge",
          url: "https://www.siraat.website",
          description:
            "Siraat is a multi-faith spiritual companion. Choose your path and access prayers, scriptures, calendars and daily reminders — designed for daily practice.",
        }}
      />

      {/* ──────────────────────────  HERO  ────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-neutral text-white pattern-stars">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="relative container-faith pt-24 md:pt-32 pb-28 md:pb-40">
          <div className="max-w-3xl mx-auto text-center">
            {/* Decorative arc — mirrors the brand mark */}
            <BrushArc className="w-24 h-9 mx-auto mb-7 text-white/55" />

            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-white/85 text-[0.6875rem] font-semibold uppercase tracking-[0.18em]">
              <Sparkles size={13} className="text-[#E0B470]" />
              Multi-faith spiritual companion
            </span>

            <h1 className="font-playfair text-[2.75rem] sm:text-6xl md:text-[4.5rem] font-bold leading-[1.02] tracking-[-0.02em] mt-7 mb-7">
              A daily companion,
              <br className="hidden sm:block" />{" "}
              built for{" "}
              <span className="text-gradient-warm">every faith</span>.
            </h1>

            <p className="text-white/65 text-base md:text-[1.0625rem] leading-relaxed max-w-xl mx-auto mb-12">
              One thoughtful platform — built tradition by tradition, for the
              way you actually practice. Pick where you begin.
            </p>

            {/* Faith picker — primary CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-5">
              {FAITH_KEYS.map((key) => {
                const c = FAITH_CONFIGS[key];
                return (
                  <button
                    key={key}
                    onClick={() => handlePick(key)}
                    aria-label={`Begin with ${c.displayName}`}
                    className={`group relative text-left p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0B470]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1224] ${
                      c.comingSoon
                        ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                        : "bg-white/[0.08] border-white/15 hover:bg-white/[0.13] hover:border-[#E0B470]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-playfair text-xl font-semibold text-white">
                            {c.displayName}
                          </h3>
                          {c.comingSoon && (
                            <span className="text-[9px] uppercase tracking-[0.16em] font-bold px-1.5 py-0.5 rounded-md bg-[#E0B470]/15 text-[#E0B470] border border-[#E0B470]/25">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-white/65 text-[0.8125rem] leading-relaxed">
                          {c.tagline}
                        </p>
                        {c.greetingNative && (
                          <p className="mt-3 text-white/45 text-xs">
                            {c.greetingNative}
                            <span className="text-white/30"> — {c.greetingEnglish}</span>
                          </p>
                        )}
                      </div>
                      <ArrowUpRight
                        size={18}
                        strokeWidth={1.6}
                        className={`shrink-0 mt-1 transition-all duration-300 ${
                          c.comingSoon
                            ? "text-white/30 group-hover:text-white/50"
                            : "text-white/55 group-hover:text-[#E0B470] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-white/45 text-[0.75rem] leading-relaxed">
              <span className="text-white/35">More on the way: </span>
              {ROADMAP.filter((r) => r.status === "later")
                .map((r) => r.name)
                .join(" · ")}
            </p>

            <p className="text-white/35 text-[0.6875rem] mt-7 tracking-wide">
              Free to start · No tradition required to sign up
            </p>
          </div>
        </div>

        {/* fade to next section */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-[#FAF7F2] pointer-events-none" />
      </section>

      {/* ────────────────────────── BELIEF ────────────────────────── */}
      <section className="relative bg-[#FAF7F2] py-24 md:py-32">
        <div className="container-faith">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[#9A7B3A] text-[0.6875rem] uppercase tracking-[0.22em] font-bold mb-5">
              Why Siraat
            </p>
            <h2 className="font-playfair text-4xl md:text-[3.25rem] font-bold text-text leading-[1.05] tracking-[-0.02em] mb-8">
              Practice has a shape.
            </h2>
            <p className="text-text-secondary text-lg md:text-xl leading-[1.65] max-w-2xl mx-auto">
              Five prayers a day. Three Sandhya. The Shema morning and evening.
              The Lord's Prayer. Each tradition has its own rhythm — and Siraat
              respects it.
            </p>
            <p className="text-text-muted text-base leading-relaxed max-w-xl mx-auto mt-5">
              We pick a tradition, partner with scholars, and build a daily
              companion that treats the practice with care. Then we ship the
              next one.
            </p>

            <div className="flex justify-center mt-12">
              <BrushArc className="w-32 h-12 text-[#9A7B3A]/30" />
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────── LIVE TODAY: ISLAM ────────────────────── */}
      <section className="relative bg-surface py-24 md:py-32 border-t border-border-light">
        <div className="container-faith">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-emerald-700 text-[0.6875rem] uppercase tracking-[0.22em] font-bold">
                  Live since 2026
                </span>
              </div>
              <h2 className="font-playfair text-4xl md:text-[3rem] font-bold text-text leading-[1.05] tracking-[-0.02em]">
                Siraat for Muslims, today.
              </h2>
              <p className="text-text-secondary text-base md:text-lg leading-relaxed mt-5 max-w-xl">
                The full Quran with Saheeh International translation. Ten
                authentic hadith collections, 36,000+ hadiths. Prayer times
                tuned to your coordinates. Dhikr counters, qibla, Hijri
                calendar, the 99 Names — built end to end.
              </p>
            </div>

            <Link
              to="/islam"
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A1238] text-white text-sm font-semibold hover:bg-[#2D1B5E] transition-colors shrink-0 self-start md:self-auto"
            >
              Explore Siraat for Muslims
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Product showcase grid — bento-style layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
            {/* Prayer countdown — featured card */}
            <div className="md:col-span-5 lg:col-span-4 row-span-2 relative overflow-hidden rounded-2xl bg-[#0F1428] text-white p-7 md:p-8 group">
              <div className="absolute inset-0 bg-hero-neutral opacity-90" />
              <div className="absolute inset-0 pattern-stars opacity-60" />
              <div className="relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-7">
                  <div>
                    <p className="text-white/55 text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2">
                      Next prayer
                    </p>
                    <p className="font-playfair text-4xl font-bold">Fajr</p>
                  </div>
                  <Clock size={18} className="text-[#E0B470]/70" />
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <p className="font-playfair text-5xl md:text-[3.5rem] font-bold tracking-tight">
                    8:23
                  </p>
                  <p className="text-white/50 text-sm font-medium">to go</p>
                </div>
                <p className="text-white/45 text-sm">4:40 AM · in your timezone</p>

                <div className="mt-auto pt-7 border-t border-white/10 space-y-2.5 text-sm">
                  {[
                    { name: "Dhuhr", time: "12:17 PM" },
                    { name: "Asr", time: "3:32 PM" },
                    { name: "Maghrib", time: "6:36 PM" },
                    { name: "Isha", time: "7:48 PM" },
                  ].map((p) => (
                    <div key={p.name} className="flex justify-between">
                      <span className="text-white/55">{p.name}</span>
                      <span className="text-white/85 tabular-nums">{p.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quran verse */}
            <div className="md:col-span-7 lg:col-span-8 rounded-2xl bg-[#FAF7F2] border border-border-light p-7 md:p-8 hover:border-[#C8A55A]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-text-muted text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-1.5">
                    Today's verse
                  </p>
                  <p className="font-playfair text-base font-semibold text-text">
                    Al-Fatiha · 1:1
                  </p>
                </div>
                <BookOpen size={18} strokeWidth={1.5} className="text-text-muted" />
              </div>
              <p
                className="font-amiri text-[1.875rem] md:text-[2.25rem] text-right text-text leading-loose mb-4 tracking-wide"
                dir="rtl"
                lang="ar"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className="text-text-secondary italic text-[0.9375rem] leading-relaxed">
                "In the name of Allah, the Entirely Merciful, the Especially
                Merciful."
              </p>
              <p className="text-text-muted text-xs mt-3">
                Saheeh International translation
              </p>
            </div>

            {/* Dhikr counter */}
            <div className="md:col-span-4 lg:col-span-3 rounded-2xl bg-[#FAF7F2] border border-border-light p-6 hover:border-[#C8A55A]/30 transition-colors">
              <p className="text-text-muted text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2">
                Today's dhikr
              </p>
              <p className="font-playfair text-2xl font-bold text-text mb-3">
                SubhanAllah
              </p>
              <div className="flex items-end gap-1.5 mb-3">
                <p className="text-3xl font-bold text-[#1A1238] tabular-nums">87</p>
                <p className="text-text-muted text-sm pb-1">/ 100</p>
              </div>
              <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A1238] rounded-full transition-all"
                  style={{ width: "87%" }}
                />
              </div>
            </div>

            {/* Hijri calendar */}
            <div className="md:col-span-3 lg:col-span-3 rounded-2xl bg-[#FAF7F2] border border-border-light p-6 hover:border-[#C8A55A]/30 transition-colors">
              <p className="text-text-muted text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2">
                Hijri
              </p>
              <p className="font-playfair text-xl font-bold text-text leading-tight mb-1">
                22 Dhu al-Qi'dah
              </p>
              <p className="text-text-secondary text-[0.8125rem]">1447 AH</p>
              <p className="text-text-muted text-xs mt-3">Sunday, 10 May</p>
            </div>

            {/* Qibla */}
            <div className="md:col-span-5 lg:col-span-2 rounded-2xl bg-[#FAF7F2] border border-border-light p-6 hover:border-[#C8A55A]/30 transition-colors">
              <p className="text-text-muted text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2 flex items-center gap-1.5">
                <Compass size={11} />
                Qibla
              </p>
              <p className="font-playfair text-3xl font-bold text-text leading-none mb-1 tabular-nums">
                263°
              </p>
              <p className="text-text-secondary text-[0.8125rem]">From Bengaluru</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── BUILT FOR DAILY PRACTICE ─────────────── */}
      <section className="bg-[#FAF7F2] py-24 md:py-32 border-t border-border-light">
        <div className="container-faith">
          <div className="max-w-2xl mb-14 md:mb-16">
            <p className="text-[#9A7B3A] text-[0.6875rem] uppercase tracking-[0.22em] font-bold mb-4">
              Every tradition gets the same depth
            </p>
            <h2 className="font-playfair text-4xl md:text-[3rem] font-bold text-text leading-[1.05] tracking-[-0.02em]">
              Built for the daily-doer.
            </h2>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed mt-5">
              We mapped what every tradition asks of its practitioners — then
              built it once, well. Each tradition gets its own version when it
              ships.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CAPABILITIES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative p-7 rounded-2xl bg-surface border border-border-light hover:border-[#C8A55A]/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1A1238] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Icon size={18} strokeWidth={1.7} className="text-[#E0B470]" />
                  </div>
                  <h3 className="text-base font-semibold text-text mb-1.5 tracking-tight">
                    {f.title}
                  </h3>
                  <p className="text-text-secondary text-[0.875rem] leading-[1.65]">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────── ROADMAP ────────────────────────── */}
      <section className="bg-surface py-24 md:py-32 border-t border-border-light">
        <div className="container-faith">
          <div className="max-w-2xl mx-auto text-center mb-14 md:mb-16">
            <p className="text-[#9A7B3A] text-[0.6875rem] uppercase tracking-[0.22em] font-bold mb-4">
              Where we are
            </p>
            <h2 className="font-playfair text-4xl md:text-[3rem] font-bold text-text leading-[1.05] tracking-[-0.02em]">
              Built one tradition at a time.
            </h2>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed mt-5">
              We refuse to ship a thin coat of paint. Each tradition takes the
              time it takes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {ROADMAP.map((r) => {
              const isLive = r.status === "live";
              const isSoon = r.status === "soon";
              const Card = (
                <div
                  className={`relative h-full p-5 rounded-2xl border transition-all ${
                    isLive
                      ? "bg-surface border-[#1A1238]/15 hover:border-[#1A1238]/35 hover:-translate-y-0.5 hover:shadow-sm"
                      : isSoon
                        ? "bg-surface border-[#C8A55A]/30 hover:border-[#C8A55A]/55"
                        : "bg-[#FAF7F2] border-border-light"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className={`font-playfair text-lg font-bold ${
                        isLive ? "text-text" : isSoon ? "text-text" : "text-text-secondary"
                      }`}
                    >
                      {r.name}
                    </h3>
                    {isLive && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live
                      </span>
                    )}
                    {isSoon && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7B3A] bg-[#FDF6E7] px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isLive ? "text-text-secondary" : "text-text-muted"
                    }`}
                  >
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#1A1238]">
                        Explore <ArrowRight size={11} />
                      </span>
                    ) : (
                      r.eta
                    )}
                  </p>
                </div>
              );

              return r.href ? (
                <Link key={r.name} to={r.href} className="block">
                  {Card}
                </Link>
              ) : (
                <div key={r.name}>{Card}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────── CLOSING CTA ────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-neutral text-white pattern-stars">
        <div className="relative container-faith py-24 md:py-32">
          <div className="max-w-2xl mx-auto text-center">
            <BrushArc className="w-20 h-7 mx-auto mb-7 text-white/55" />
            <h2 className="font-playfair text-4xl md:text-[3.25rem] font-bold leading-[1.05] tracking-[-0.02em] mb-5">
              Begin where you are.
            </h2>
            <p className="text-white/65 text-base md:text-lg leading-relaxed mb-10 max-w-lg mx-auto">
              Siraat for Muslims is live today. Hinduism is in development.
              Get notified the moment your tradition ships.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/islam" className="btn-warm">
                Start with Islam
                <ArrowRight size={16} />
              </Link>
              <Link to="/auth/register" className="btn-ghost-light">
                <Bell size={15} />
                Notify me at launch
              </Link>
            </div>
            <p className="text-white/35 text-[0.6875rem] mt-9 tracking-wide">
              Free · Open to everyone · No credit card required
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
