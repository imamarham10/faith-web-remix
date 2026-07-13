import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Headphones,
} from "lucide-react";
import { JsonLd } from "~/components/JsonLd";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

// ---------- Types ----------

interface VerseTranslation {
  languageCode: string;
  authorName?: string;
  text: string;
}

interface ChapterVerse {
  id: string;
  verseNumber: number;
  sanskritText: string;
  transliteration?: string;
  translations?: VerseTranslation[];
}

interface VerseRef {
  chapterNumber: number;
  verseNumber: number;
}

interface LoaderData {
  verse: ChapterVerse | null;
  chapter: { chapterNumber: number; nameEnglish?: string; nameSanskrit?: string } | null;
  textName: string;
  slug: string;
  prev: VerseRef | null;
  next: VerseRef | null;
}

// Canonical verse counts of the standard Gita recension — used for
// cross-chapter prev/next without fetching neighboring chapters.
const GITA_VERSE_COUNTS: Record<number, number> = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
  10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
};

// ---------- Loader (SSR, public data) ----------

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const { slug, chapterNumber, verseNumber } = params;
  const empty: LoaderData = {
    verse: null,
    chapter: null,
    textName: "Bhagavad Gita",
    slug: slug || "bhagavad-gita",
    prev: null,
    next: null,
  };
  const chapterNum = Number(chapterNumber);
  const verseNum = Number(verseNumber);
  if (!slug || !Number.isInteger(chapterNum) || !Number.isInteger(verseNum)) {
    return empty;
  }

  try {
    const [res, textRes] = await Promise.all([
      fetch(
        `${API_BASE}/api/v1/hindu/scriptures/texts/${slug}/chapters/${chapterNum}?lang=en,hi`
      ),
      fetch(`${API_BASE}/api/v1/hindu/scriptures/texts/${slug}`),
    ]);
    if (!res.ok) return empty;
    const json = await res.json();
    const chapter = json.data || json;
    let textName = "Bhagavad Gita";
    try {
      if (textRes.ok) {
        const textJson = await textRes.json();
        textName = (textJson.data || textJson)?.nameEnglish || textName;
      }
    } catch {
      /* keep default */
    }
    const verses: ChapterVerse[] = chapter?.verses || [];
    const verse = verses.find((v) => v.verseNumber === verseNum) || null;
    if (!verse) return { ...empty, chapter };

    // Prev/next: within the chapter when possible, across chapter
    // boundaries using canonical counts (Gita only; other texts stop
    // at the chapter edge).
    const counts = slug === "bhagavad-gita" ? GITA_VERSE_COUNTS : {};
    let prev: VerseRef | null =
      verseNum > 1 ? { chapterNumber: chapterNum, verseNumber: verseNum - 1 } : null;
    if (!prev && counts[chapterNum - 1]) {
      prev = { chapterNumber: chapterNum - 1, verseNumber: counts[chapterNum - 1] };
    }
    const lastInChapter = counts[chapterNum] ?? verses[verses.length - 1]?.verseNumber;
    let next: VerseRef | null =
      verseNum < lastInChapter
        ? { chapterNumber: chapterNum, verseNumber: verseNum + 1 }
        : null;
    if (!next && counts[chapterNum + 1]) {
      next = { chapterNumber: chapterNum + 1, verseNumber: 1 };
    }

    return {
      verse,
      chapter: {
        chapterNumber: chapter.chapterNumber,
        nameEnglish: chapter.nameEnglish,
        nameSanskrit: chapter.nameSanskrit,
      },
      textName,
      slug,
      prev,
      next,
    };
  } catch {
    return empty;
  }
}

// ---------- Meta ----------

const APP_URL = "https://www.siraat.website";

export function meta({
  data,
  params,
}: {
  data?: LoaderData;
  params: { slug?: string; chapterNumber?: string; verseNumber?: string };
}) {
  const c = data?.chapter?.chapterNumber ?? params.chapterNumber;
  const v = data?.verse?.verseNumber ?? params.verseNumber;
  const textName = data?.textName || "Bhagavad Gita";
  const hasHindi = Boolean(
    data?.verse?.translations?.some((t) => t.languageCode === "hi"),
  );
  const langLabel = hasHindi ? "Hindi & English Meaning" : "Sanskrit & English Meaning";
  const langList = hasHindi
    ? "Sanskrit shloka, transliteration, Hindi anuvad and English meaning"
    : "Sanskrit shloka, transliteration and English meaning";
  const title = `${textName} ${c}.${v} — ${langLabel} | Siraat`;
  const english = data?.verse?.translations?.find((t) => t.languageCode === "en")?.text;
  const description = english
    ? `${english.replace(/\s+/g, " ").trim().slice(0, 120)}… Read ${textName} chapter ${c} verse ${v} with ${langList}.`
    : `${textName} chapter ${c} verse ${v} with ${langList}.`;
  const url = `${APP_URL}/hindu/scriptures/${params.slug}/${c}/${v}`;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "article" },
    { tagName: "link", rel: "canonical", href: url },
    ...HINDU_OG_TAGS,
  ];
}

// ---------- Page ----------

export default function GitaVersePage() {
  const { verse, chapter, textName, slug, prev, next } =
    useLoaderData<typeof loader>();

  if (!verse || !chapter) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </div>
        <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
          Verse not found
        </h2>
        <p className="text-sm text-[#6B5642] mb-6">
          This verse does not exist or is not yet available.
        </p>
        <Link to="/hindu/scriptures" className="btn-hindu-primary">
          Browse All Chapters
        </Link>
      </div>
    );
  }

  const hindi = verse.translations?.find((t) => t.languageCode === "hi");
  const english = verse.translations?.find((t) => t.languageCode === "en");
  const ref = `${chapter.chapterNumber}.${verse.verseNumber}`;
  const chapterHref = `/hindu/scriptures/${slug}/${chapter.chapterNumber}`;

  return (
    <div className="min-h-screen bg-[#FBF6EC] pb-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Siraat", item: `${APP_URL}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: textName,
              item: `${APP_URL}/hindu/scriptures/${slug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: `Chapter ${chapter.chapterNumber}${chapter.nameEnglish ? ` — ${chapter.nameEnglish}` : ""}`,
              item: `${APP_URL}${chapterHref}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: `Verse ${ref}`,
              item: `${APP_URL}${chapterHref}/${verse.verseNumber}`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${textName} ${ref} — meaning in Hindi and English`,
          description: english?.text?.slice(0, 200),
          url: `${APP_URL}${chapterHref}/${verse.verseNumber}`,
          inLanguage: ["sa", "hi", "en"],
          isPartOf: {
            "@type": "Book",
            name: textName,
            url: `${APP_URL}/hindu/scriptures`,
          },
          author: { "@type": "Organization", name: "Siraat", url: APP_URL },
          publisher: { "@type": "Organization", name: "Siraat", url: APP_URL },
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#4A1119] to-[#6B1F2A] text-white pt-safe-top">
        <div className="container-faith py-8 md:py-10 max-w-3xl mx-auto">
          <Link
            to={chapterHref}
            className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors mb-5 text-sm font-medium"
          >
            <ArrowLeft size={15} />
            Chapter {chapter.chapterNumber}
            {chapter.nameEnglish ? ` — ${chapter.nameEnglish}` : ""}
          </Link>
          <p className="text-[#F0A45C] text-xs font-bold uppercase tracking-[0.18em] mb-2">
            {textName}
          </p>
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold tracking-tight">
            Verse {ref}
          </h1>
        </div>
      </section>

      <div className="container-faith py-8 max-w-3xl mx-auto">
        <article className="rounded-2xl bg-white border border-[#E8DCC4] p-6 sm:p-10 shadow-[0_1px_2px_rgba(74,17,25,0.04)]">
          {/* Sanskrit */}
          <p
            lang="sa"
            className="text-2xl sm:text-3xl leading-[1.9] text-[#3A0F18] text-center font-medium whitespace-pre-line"
          >
            {verse.sanskritText}
          </p>

          {verse.transliteration && (
            <p className="mt-5 text-center text-sm sm:text-base italic text-[#6B5642] leading-relaxed whitespace-pre-line">
              {verse.transliteration}
            </p>
          )}

          {/* Hindi anuvad */}
          {hindi && (
            <div className="mt-8 pt-6 border-t border-[#E8DCC4]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A7B3A] mb-2">
                हिन्दी अनुवाद
              </p>
              <p lang="hi" className="text-lg sm:text-xl text-[#3A0F18] leading-relaxed">
                {hindi.text}
              </p>
              {hindi.authorName && (
                <p className="mt-2 text-xs text-[#6B5642]">— {hindi.authorName}</p>
              )}
            </div>
          )}

          {/* English */}
          {english && (
            <div className="mt-6 pt-6 border-t border-[#E8DCC4]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A7B3A] mb-2">
                English Meaning
              </p>
              <p className="text-base sm:text-lg text-[#4A3826] leading-relaxed">
                {english.text}
              </p>
              {english.authorName && (
                <p className="mt-2 text-xs text-[#6B5642]">— {english.authorName}</p>
              )}
            </div>
          )}
        </article>

        {/* Prev / Next */}
        <nav className="mt-5 grid grid-cols-2 gap-3" aria-label="Verse navigation">
          {prev ? (
            <Link
              to={`/hindu/scriptures/${slug}/${prev.chapterNumber}/${prev.verseNumber}`}
              className="rounded-2xl bg-white border border-[#E8DCC4] p-4 group hover:border-[#6B1F2A]/40 transition-colors"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9A7B3A] mb-1">
                <ArrowLeft size={12} /> Previous
              </span>
              <span className="text-sm font-semibold text-[#3A0F18] group-hover:text-[#6B1F2A] transition-colors">
                Verse {prev.chapterNumber}.{prev.verseNumber}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to={`/hindu/scriptures/${slug}/${next.chapterNumber}/${next.verseNumber}`}
              className="rounded-2xl bg-white border border-[#E8DCC4] p-4 group text-right hover:border-[#6B1F2A]/40 transition-colors"
            >
              <span className="flex items-center justify-end gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9A7B3A] mb-1">
                Next <ArrowRight size={12} />
              </span>
              <span className="text-sm font-semibold text-[#3A0F18] group-hover:text-[#6B1F2A] transition-colors">
                Verse {next.chapterNumber}.{next.verseNumber}
              </span>
            </Link>
          )}
        </nav>

        {/* Chapter CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`${chapterHref}?verse=${verse.verseNumber}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6B1F2A] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#4A1119] transition-colors"
          >
            <BookOpen size={15} />
            Read full chapter {chapter.chapterNumber}
          </Link>
          {slug === "bhagavad-gita" && (
            <Link
              to={chapterHref}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E8DCC4] text-[#3A0F18] text-sm font-semibold px-5 py-2.5 hover:border-[#6B1F2A]/40 transition-colors"
            >
              <Headphones size={15} className="text-[#9A7B3A]" />
              Listen in Hindi &amp; English
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
