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
  Landmark,
  Flower2,
} from "lucide-react";
import { useFaith } from "~/contexts/FaithContext";
import { useAuth } from "~/contexts/AuthContext";
import { FAITH_CONFIGS, type FaithKey } from "~/utils/faithConfig";
import { JsonLd } from "~/components/JsonLd";

/* ────────────── Faith portals — the hero's primary CTA ──────────────
   Two equal doors. Each carries its own accent so neither tradition reads
   as the "default" — Islam keeps its warm gold, Hinduism gets marigold. */
const PORTALS: {
  key: FaithKey;
  name: string;
  accent: string; // accent text color
  ring: string; // hover ring/border accent
  chips: string[];
  greetingNative: string;
  greetingEnglish: string;
}[] = [
  {
    key: "muslim",
    name: "Islam",
    accent: "text-[#E0B470]",
    ring: "hover:border-[#E0B470]/50",
    chips: ["Prayer times", "Quran", "Hadiths", "Dhikr", "Qibla"],
    greetingNative: "السلام عليكم",
    greetingEnglish: "Assalamu Alaikum",
  },
  {
    key: "hindu",
    name: "Hinduism",
    accent: "text-[#F0A45C]",
    ring: "hover:border-[#F0A45C]/50",
    chips: ["Panchang", "Bhagavad Gita", "Japa", "Stotras", "Temples"],
    greetingNative: "नमस्ते",
    greetingEnglish: "Namaste",
  },
];

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
  { name: "Hinduism", status: "live", href: "/hindu", eta: "Live" },
  { name: "Christianity", status: "later", href: null, eta: "Roadmap" },
  { name: "Buddhism", status: "later", href: null, eta: "Roadmap" },
  { name: "Sikhism", status: "later", href: null, eta: "Roadmap" },
  { name: "Judaism", status: "later", href: null, eta: "Roadmap" },
];

/* ────────────── Decorative SVG that mirrors the brand mark ────────────── */
function BrushArc({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 70" fill="none" aria-hidden className={className}>
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

/* Small live-status dot */
function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex w-2 h-2 ${className}`}>
      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
      <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
    </span>
  );
}

export default function Landing() {
  const { setFaith, config } = useFaith();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Signed-in users skip the neutral landing — straight to their faith home.
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
            "Siraat is a multi-faith spiritual companion. Islam and Hinduism are live today — prayers and sandhya times, Quran and Bhagavad Gita, dhikr and japa, Hijri calendar and Panchang, built for daily practice.",
        }}
      />

      {/* ──────────────────────────  HERO  ────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-neutral text-white pattern-stars">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="relative container-faith pt-24 md:pt-32 pb-24 md:pb-36">
          <div className="max-w-4xl mx-auto text-center">
            <BrushArc className="w-24 h-9 mx-auto mb-7 text-white/55" />

            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-white/85 text-[0.6875rem] font-semibold uppercase tracking-[0.18em]">
              <Sparkles size={13} className="text-[#E0B470]" />
              Multi-faith spiritual companion
            </span>

            <h1 className="font-playfair text-[2.75rem] sm:text-6xl md:text-[4.5rem] font-bold leading-[1.02] tracking-[-0.02em] mt-7 mb-7">
              A daily companion,
              <br className="hidden sm:block" />{" "}
              built for <span className="text-gradient-warm">every faith</span>.
            </h1>

            <p className="text-white/65 text-base md:text-[1.0625rem] leading-relaxed max-w-xl mx-auto mb-12">
              One thoughtful platform — built tradition by tradition, for the
              way you actually practice. Two traditions live today. Pick where
              you begin.
            </p>

            {/* Faith portals — two equal doors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              {PORTALS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePick(p.key)}
                  aria-label={`Begin with ${p.name}`}
                  className={`group relative text-left p-6 rounded-2xl border bg-white/[0.07] border-white/15 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.12] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0B470]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191410] ${p.ring}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/90">
                      <LiveDot />
                      Live
                    </span>
                    <ArrowUpRight
                      size={18}
                      strokeWidth={1.6}
                      className={`shrink-0 text-white/45 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:${p.accent.replace("text-", "text-")}`}
                    />
                  </div>

                  <h3 className="font-playfair text-2xl font-bold text-white mb-1">
                    {p.name}
                  </h3>
                  <p className="text-white/45 text-xs mb-4">
                    <span className={`${p.accent} opacity-90`}>{p.greetingNative}</span>
                    <span className="text-white/35"> — {p.greetingEnglish}</span>
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {p.chips.map((chip) => (
                      <span
                        key={chip}
                        className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/10 text-white/65 text-[0.6875rem] font-medium"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Proof strip */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.75rem] text-white/45 mb-6">
              <span>6,236 Quran verses</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span>36,000+ hadiths</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span>The Bhagavad Gita, verse by verse</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span>18 sacred temples</span>
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
              We pick a tradition, build a daily companion that treats the
              practice with care — then we ship the next one. Islam shipped
              first. Hinduism is live now.
            </p>

            <div className="flex justify-center mt-12">
              <BrushArc className="w-32 h-12 text-[#9A7B3A]/30" />
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────── SHOWCASE: ISLAM ────────────────────── */}
      <section className="relative bg-surface py-24 md:py-32 border-t border-border-light">
        <div className="container-faith">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <LiveDot />
                <span className="text-emerald-700 text-[0.6875rem] uppercase tracking-[0.22em] font-bold">
                  Live
                </span>
              </div>
              <h2 className="font-playfair text-4xl md:text-[3rem] font-bold text-[#0C231A] leading-[1.05] tracking-[-0.02em]">
                Siraat for Muslims.
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
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1B6B4E] text-white text-sm font-semibold hover:bg-[#134D38] transition-colors shrink-0 self-start md:self-auto"
            >
              Explore Siraat for Muslims
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Bento */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
            {/* Prayer countdown — featured card, in the Islam deep green */}
            <div className="md:col-span-5 lg:col-span-4 row-span-2 relative overflow-hidden rounded-2xl bg-[#0C231A] text-white p-7 md:p-8">
              <div className="absolute inset-0 bg-hero-warm opacity-95" />
              <div className="absolute inset-0 pattern-stars opacity-40" />
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
            <div className="md:col-span-7 lg:col-span-8 rounded-2xl bg-[#FAF7F2] border border-border-light p-7 md:p-8 hover:border-[#1B6B4E]/30 transition-colors">
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
            <div className="md:col-span-4 lg:col-span-3 rounded-2xl bg-[#FAF7F2] border border-border-light p-6 hover:border-[#1B6B4E]/30 transition-colors">
              <p className="text-text-muted text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2">
                Today's dhikr
              </p>
              <p className="font-playfair text-2xl font-bold text-text mb-3">
                SubhanAllah
              </p>
              <div className="flex items-end gap-1.5 mb-3">
                <p className="text-3xl font-bold text-[#134D38] tabular-nums">87</p>
                <p className="text-text-muted text-sm pb-1">/ 100</p>
              </div>
              <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B6B4E] rounded-full transition-all"
                  style={{ width: "87%" }}
                />
              </div>
            </div>

            {/* Hijri calendar */}
            <div className="md:col-span-3 lg:col-span-3 rounded-2xl bg-[#FAF7F2] border border-border-light p-6 hover:border-[#1B6B4E]/30 transition-colors">
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
            <div className="md:col-span-5 lg:col-span-2 rounded-2xl bg-[#FAF7F2] border border-border-light p-6 hover:border-[#1B6B4E]/30 transition-colors">
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

      {/* ────────────────────── SHOWCASE: HINDUISM ────────────────────── */}
      <section className="relative bg-[#FBF6EC] py-24 md:py-32 border-t border-border-light">
        <div className="container-faith">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <LiveDot />
                <span className="text-emerald-700 text-[0.6875rem] uppercase tracking-[0.22em] font-bold">
                  Live · New
                </span>
              </div>
              <h2 className="font-playfair text-4xl md:text-[3rem] font-bold text-[#3A0F18] leading-[1.05] tracking-[-0.02em]">
                Siraat for Hindus.
              </h2>
              <p className="text-[#6B5642] text-base md:text-lg leading-relaxed mt-5 max-w-xl">
                The Bhagavad Gita verse by verse — Sanskrit, transliteration
                and translation. Daily Panchang with tithi and nakshatra. Japa
                mala, stotras and aartis including the Hanuman Chalisa, 18
                sacred temples, festivals and stories from the Puranas.
              </p>
            </div>

            <Link
              to="/hindu"
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#6B1F2A] text-white text-sm font-semibold hover:bg-[#4A1119] transition-colors shrink-0 self-start md:self-auto"
            >
              Explore Siraat for Hindus
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Bento — mirrors the Islam layout with the Hindu palette */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
            {/* Panchang — featured card */}
            <div className="md:col-span-5 lg:col-span-4 row-span-2 relative overflow-hidden rounded-2xl text-white p-7 md:p-8 bg-hero-hindu">
              <div className="absolute inset-0 pattern-kolam opacity-70" />
              <div className="relative h-full flex flex-col">
                <div className="flex items-start justify-between mb-7">
                  <div>
                    <p className="text-white/55 text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2">
                      Today's Panchang
                    </p>
                    <p className="font-playfair text-4xl font-bold">Ekadashi</p>
                  </div>
                  <CalendarHeart size={18} className="text-[#E8D5A0]/80" />
                </div>

                <p className="text-white/60 text-sm mb-1">Shukla Paksha · Shravana</p>
                <p className="text-white/45 text-sm">Vikram Samvat 2083</p>

                <div className="mt-auto pt-7 border-t border-white/10 space-y-2.5 text-sm">
                  {[
                    { name: "Nakshatra", value: "Rohini" },
                    { name: "Yoga", value: "Siddha" },
                    { name: "Karana", value: "Bava" },
                    { name: "Sunrise", value: "6:04 AM" },
                  ].map((row) => (
                    <div key={row.name} className="flex justify-between">
                      <span className="text-white/55">{row.name}</span>
                      <span className="text-white/85">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gita verse */}
            <div className="md:col-span-7 lg:col-span-8 rounded-2xl bg-white border border-[#E8DCC4] p-7 md:p-8 hover:border-[#6B1F2A]/25 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[#9A7B3A] text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-1.5">
                    Today's shloka
                  </p>
                  <p className="font-playfair text-base font-semibold text-[#3A0F18]">
                    Bhagavad Gita · 2.47
                  </p>
                </div>
                <BookOpen size={18} strokeWidth={1.5} className="text-[#9A7B3A]" />
              </div>
              <p
                className="text-[1.5rem] md:text-[1.75rem] text-[#3A0F18] leading-relaxed mb-4"
                lang="sa"
                style={{ fontFamily: "var(--font-devanagari)" }}
              >
                कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।
              </p>
              <p className="text-[#6B5642] italic text-[0.9375rem] leading-relaxed">
                "Your right is to the action alone, never to its fruits."
              </p>
              <p className="text-[#9A8A70] text-xs mt-3">
                Swami Swarupananda translation
              </p>
            </div>

            {/* Japa counter */}
            <div className="md:col-span-4 lg:col-span-3 rounded-2xl bg-white border border-[#E8DCC4] p-6 hover:border-[#6B1F2A]/25 transition-colors">
              <p className="text-[#9A7B3A] text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2">
                Today's japa
              </p>
              <p
                className="text-xl font-bold text-[#3A0F18] mb-3"
                lang="sa"
                style={{ fontFamily: "var(--font-devanagari)" }}
              >
                ॐ नमः शिवाय
              </p>
              <div className="flex items-end gap-1.5 mb-3">
                <p className="text-3xl font-bold text-[#6B1F2A] tabular-nums">78</p>
                <p className="text-[#9A8A70] text-sm pb-1">/ 108</p>
              </div>
              <div className="h-1.5 bg-[#FBF6EC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6B1F2A] rounded-full transition-all"
                  style={{ width: "72%" }}
                />
              </div>
            </div>

            {/* Stotra spotlight */}
            <div className="md:col-span-3 lg:col-span-3 rounded-2xl bg-white border border-[#E8DCC4] p-6 hover:border-[#6B1F2A]/25 transition-colors">
              <p className="text-[#9A7B3A] text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2 flex items-center gap-1.5">
                <Flower2 size={11} />
                Stotras
              </p>
              <p className="font-playfair text-xl font-bold text-[#3A0F18] leading-tight mb-1">
                Hanuman Chalisa
              </p>
              <p className="text-[#6B5642] text-[0.8125rem]">43 verses · with meaning</p>
              <p className="text-[#9A8A70] text-xs mt-3">+ aartis & more</p>
            </div>

            {/* Temple spotlight */}
            <div className="md:col-span-5 lg:col-span-2 rounded-2xl bg-white border border-[#E8DCC4] p-6 hover:border-[#6B1F2A]/25 transition-colors">
              <p className="text-[#9A7B3A] text-[0.6875rem] uppercase tracking-[0.18em] font-bold mb-2 flex items-center gap-1.5">
                <Landmark size={11} />
                Temples
              </p>
              <p className="font-playfair text-xl font-bold text-[#3A0F18] leading-none mb-1">
                Kashi
              </p>
              <p className="text-[#6B5642] text-[0.8125rem]">1 of 18 curated</p>
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
                  <div className="w-10 h-10 rounded-xl bg-[#221A13] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
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
              time it takes. Two are live; four are on the road.
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
                      ? "bg-surface border-[#221A13]/15 hover:border-[#221A13]/35 hover:-translate-y-0.5 hover:shadow-sm"
                      : isSoon
                        ? "bg-surface border-[#C8A55A]/30 hover:border-[#C8A55A]/55"
                        : "bg-[#FAF7F2] border-border-light"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className={`font-playfair text-lg font-bold ${
                        isLive || isSoon ? "text-text" : "text-text-secondary"
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
                      <span className="inline-flex items-center gap-1 font-semibold text-[#221A13]">
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

      {/* Closing CTA intentionally omitted — the Footer renders the
          "Begin where you are." band on neutral pages, and stacking two
          identical dark CTAs read as a bug. */}
    </>
  );
}
