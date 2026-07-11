import { Link } from "react-router";
import {
  Sparkles,
  Sun,
  Flame,
  CircleDot,
  BookOpen,
  Music,
  Landmark,
  HeartHandshake,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import { JsonLd } from "~/components/JsonLd";

const APP_URL = "https://www.siraat.website";

export function meta() {
  return [
    { title: "Hindu Spiritual Companion | Siraat" },
    {
      name: "description",
      content:
        "Panchang, puja times, japa counters, the Bhagavad Gita, stotras and aartis, sacred temples, Gita guidance for your feelings, and stories from the Puranas — Siraat's Hindu spiritual companion.",
    },
    { tagName: "link", rel: "canonical", href: `${APP_URL}/hindu` },
    { property: "og:title", content: "Hindu Spiritual Companion | Siraat" },
    {
      property: "og:description",
      content:
        "Panchang, Bhagavad Gita, stotras, temples, japa and sacred stories — a complete Hindu spiritual companion.",
    },
    { property: "og:url", content: `${APP_URL}/hindu` },
  ];
}

interface Feature {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    to: "/hindu/panchang",
    title: "Panchang",
    description: "Today's Tithi, Nakshatra, Yoga, Karana and auspicious times for your location.",
    icon: <Sun size={20} />,
  },
  {
    to: "/hindu/puja-times",
    title: "Puja Times",
    description: "Sandhya timings for the day, with a simple log to keep your practice steady.",
    icon: <Flame size={20} />,
  },
  {
    to: "/hindu/japa",
    title: "Japa Counter",
    description: "Count your mantra repetitions with goals, streaks and a mantra library.",
    icon: <CircleDot size={20} />,
  },
  {
    to: "/hindu/scriptures",
    title: "Scriptures",
    description: "Read the Bhagavad Gita — Sanskrit, transliteration and English, verse by verse.",
    icon: <BookOpen size={20} />,
  },
  {
    to: "/hindu/stotras",
    title: "Stotras & Aartis",
    description: "A hymn library by deity — full Sanskrit text with transliteration and meaning.",
    icon: <Music size={20} />,
  },
  {
    to: "/hindu/temples",
    title: "Temples",
    description: "India's most significant temples — Jyotirlingas, Char Dham, Shakti Pithas and more.",
    icon: <Landmark size={20} />,
  },
  {
    to: "/hindu/feelings",
    title: "Feelings",
    description: "How is your heart today? Gita verses chosen for whatever you're carrying.",
    icon: <HeartHandshake size={20} />,
  },
  {
    to: "/hindu/stories",
    title: "Sacred Stories",
    description: "Timeless stories from the Puranas and the Ramayana, told simply and reverently.",
    icon: <ScrollText size={20} />,
  },
];

export default function HinduHub() {
  return (
    <div className="min-h-screen bg-[#FBF6EC]">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Hindu Spiritual Companion",
            url: `${APP_URL}/hindu`,
            description:
              "Panchang, Bhagavad Gita, stotras, temples, japa and sacred stories — a complete Hindu spiritual companion.",
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

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <Sparkles size={12} />
              Sanatana Dharma
            </div>
            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-4">
              Your Hindu spiritual companion
            </h1>
            <p
              className="text-2xl text-[#E8D5A0] mb-4"
              style={{ fontFamily: "var(--font-devanagari)" }}
              lang="sa"
            >
              धर्मो रक्षति रक्षितः
            </p>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl">
              Daily Panchang, the Bhagavad Gita, stotras and aartis, sacred temples,
              japa practice, and stories from the Puranas — everything for a steady,
              devoted life, in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <div className="container-faith py-10 md:py-14">
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B3A] font-semibold mb-1.5">
            Explore
          </p>
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-[#3A0F18] leading-tight">
            Everything for your practice
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {FEATURES.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group relative rounded-2xl bg-white border border-[#E8DCC4] p-6 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] hover:border-[#6B1F2A]/25 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-[#FAF1D9] text-[#9A7B3A] flex items-center justify-center mb-4 group-hover:bg-[#6B1F2A] group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <h3 className="font-playfair text-lg font-bold text-[#3A0F18] mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-[#6B5642] leading-relaxed mb-4">{f.description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B1F2A]">
                Open
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
