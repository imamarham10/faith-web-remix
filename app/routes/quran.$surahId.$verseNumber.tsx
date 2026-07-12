import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Headphones,
} from "lucide-react";
import { JsonLd } from "~/components/JsonLd";
import { ISLAM_OG_TAGS } from "~/utils/islamSeo";

// ---------- Types ----------

interface VerseData {
  id: string;
  surahId: number;
  verseNumber: number;
  textArabic: string;
  textUthmani?: string | null;
  transliteration?: { text: string } | null;
  translations?: { authorName: string; text: string }[];
  surah: {
    id: number;
    nameArabic: string;
    nameEnglish: string;
    nameTransliteration: string;
    revelationPlace: string;
    verseCount: number;
  };
  context?: {
    prev: { surahId: number; verseNumber: number } | null;
    next: { surahId: number; verseNumber: number } | null;
  };
}

// ---------- Loader (SSR, public data) ----------

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const surahId = Number(params.surahId);
  const verseNum = Number(params.verseNumber);
  if (!Number.isInteger(surahId) || !Number.isInteger(verseNum)) {
    return { verse: null };
  }
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/islam/quran/verse/${surahId}:${verseNum}`
    );
    if (!res.ok) return { verse: null };
    const json = await res.json();
    const verse = json.data || json;
    return { verse: verse?.id ? (verse as VerseData) : null };
  } catch {
    return { verse: null };
  }
}

// ---------- Meta ----------

const APP_URL = "https://www.siraat.website";

export function meta({
  data,
  params,
}: {
  data?: { verse: VerseData | null };
  params: { surahId?: string; verseNumber?: string };
}) {
  const v = data?.verse;
  const ref = `${v?.surahId ?? params.surahId}:${v?.verseNumber ?? params.verseNumber}`;
  const surahName = v?.surah?.nameTransliteration || "the Quran";
  const title = `Quran ${ref} — Surah ${surahName} Ayah ${v?.verseNumber ?? params.verseNumber} in Arabic & English | Siraat`;
  const english = v?.translations?.[0]?.text;
  const description = english
    ? `${english.replace(/\s+/g, " ").trim().slice(0, 120)}… Read Quran ${ref} (Surah ${surahName}) with Arabic text, transliteration and English translation.`
    : `Read Quran ${ref} (Surah ${surahName}) with Arabic text, transliteration and English translation.`;
  const url = `${APP_URL}/islam/quran/${params.surahId}/${params.verseNumber}`;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "article" },
    { tagName: "link", rel: "canonical", href: url },
    ...ISLAM_OG_TAGS,
  ];
}

// ---------- Page ----------

export default function QuranVersePage() {
  const { verse } = useLoaderData<typeof loader>();

  if (!verse) {
    return (
      <div className="bg-gradient-surface min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Verse not found</h2>
        <p className="text-text-secondary mb-6">
          This ayah does not exist or is not yet available.
        </p>
        <Link to="/islam/quran" className="btn-primary">
          Browse the Quran
        </Link>
      </div>
    );
  }

  const ref = `${verse.surahId}:${verse.verseNumber}`;
  const surahHref = `/islam/quran/${verse.surahId}`;
  const translation = verse.translations?.[0];
  const prev = verse.context?.prev;
  const next = verse.context?.next;

  return (
    <div className="bg-gradient-surface min-h-screen pb-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Siraat", item: `${APP_URL}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: "Quran",
              item: `${APP_URL}/islam/quran`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: `Surah ${verse.surah.nameTransliteration}`,
              item: `${APP_URL}${surahHref}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: `Ayah ${ref}`,
              item: `${APP_URL}${surahHref}/${verse.verseNumber}`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Quran ${ref} — Surah ${verse.surah.nameTransliteration} Ayah ${verse.verseNumber}`,
          description: translation?.text?.slice(0, 200),
          url: `${APP_URL}${surahHref}/${verse.verseNumber}`,
          inLanguage: ["ar", "en"],
          isPartOf: {
            "@type": "Book",
            name: "The Quran",
            url: `${APP_URL}/islam/quran`,
          },
          author: { "@type": "Organization", name: "Siraat", url: APP_URL },
          publisher: { "@type": "Organization", name: "Siraat", url: APP_URL },
        }}
      />

      {/* Hero */}
      <div className="bg-hero-gradient text-white pattern-islamic pt-safe-top">
        <div className="container-faith py-8 md:py-10 max-w-3xl mx-auto">
          <Link
            to={surahHref}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-5 text-sm font-medium"
          >
            <ArrowLeft size={15} />
            Surah {verse.surah.nameTransliteration} — {verse.surah.nameEnglish}
          </Link>
          <p className="text-white/70 text-xs font-bold uppercase tracking-[0.18em] mb-2">
            {verse.surah.revelationPlace} · {verse.surah.verseCount} verses
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold font-playfair tracking-tight">
            Quran {ref}
          </h1>
        </div>
      </div>

      <div className="container-faith -mt-6 relative z-10 max-w-3xl mx-auto">
        <article className="card-elevated p-6 sm:p-10">
          {/* Arabic */}
          <p
            lang="ar"
            dir="rtl"
            className="font-amiri text-3xl sm:text-4xl md:text-5xl text-text text-center leading-[2] sm:leading-[2.1]"
          >
            {verse.textArabic}
          </p>

          {/* Transliteration */}
          {verse.transliteration?.text && (
            <p className="mt-6 text-center text-sm sm:text-base italic text-text-secondary leading-relaxed">
              {verse.transliteration.text}
            </p>
          )}

          {/* Translation */}
          {translation && (
            <div className="mt-8 pt-6 border-t border-border-light">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                English Translation
              </p>
              <p className="text-text text-lg sm:text-xl font-medium leading-relaxed">
                {translation.text}
              </p>
              <p className="mt-2 text-xs text-text-muted">
                — {translation.authorName}
              </p>
            </div>
          )}
        </article>

        {/* Prev / Next */}
        <nav className="mt-5 grid grid-cols-2 gap-3" aria-label="Ayah navigation">
          {prev ? (
            <Link
              to={`/islam/quran/${prev.surahId}/${prev.verseNumber}`}
              className="card-elevated p-4 group hover:shadow-md transition-shadow"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                <ArrowLeft size={12} /> Previous
              </span>
              <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                Quran {prev.surahId}:{prev.verseNumber}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to={`/islam/quran/${next.surahId}/${next.verseNumber}`}
              className="card-elevated p-4 group text-right hover:shadow-md transition-shadow"
            >
              <span className="flex items-center justify-end gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Next <ArrowRight size={12} />
              </span>
              <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                Quran {next.surahId}:{next.verseNumber}
              </span>
            </Link>
          )}
        </nav>

        {/* Surah CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`${surahHref}?verse=${verse.verseNumber}`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <BookOpen size={15} />
            Read full Surah {verse.surah.nameTransliteration}
          </Link>
          <Link
            to={surahHref}
            className="inline-flex items-center gap-2 rounded-lg border border-border-light bg-white text-text text-sm font-semibold px-5 py-2.5 hover:border-primary/40 transition-colors"
          >
            <Headphones size={15} className="text-primary" />
            Listen to recitation
          </Link>
        </div>
      </div>
    </div>
  );
}
