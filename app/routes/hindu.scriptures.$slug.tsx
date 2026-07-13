import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { AlertTriangle, ArrowLeft, ChevronRight } from "lucide-react";
import { JsonLd } from "~/components/JsonLd";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

// ---------- Types ----------

interface ChapterSummary {
  id: string;
  chapterNumber: number;
  nameSanskrit?: string;
  nameEnglish?: string;
  verseCount: number;
}

interface TextDetail {
  slug: string;
  nameEnglish: string;
  nameSanskrit: string;
  type: string;
  totalVerses: number;
  chapters: ChapterSummary[];
}

// ---------- Loader (SSR, public data) ----------

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  if (!params.slug) return { text: null };
  try {
    const res = await fetch(`${API_BASE}/api/v1/hindu/scriptures/texts/${params.slug}`);
    if (!res.ok) return { text: null };
    const json = await res.json();
    const text = json.data || json;
    return { text: text?.slug ? (text as TextDetail) : null };
  } catch {
    return { text: null };
  }
}

// ---------- Meta ----------

const APP_URL = "https://www.siraat.website";

export function meta({ data, params }: { data?: { text: TextDetail | null }; params: { slug?: string } }) {
  const t = data?.text;
  const name = t?.nameEnglish || "Hindu Scripture";
  const chapterWord = t?.type === "ramayana" ? "sargas" : "chapters";
  const title = `${name} — Read All ${t?.chapters?.length ?? ""} ${chapterWord.charAt(0).toUpperCase() + chapterWord.slice(1)} Online | Siraat`;
  const description = `Read ${name} online: ${t?.chapters?.length ?? "all"} ${chapterWord}, ${t?.totalVerses ?? ""} verses with Devanagari Sanskrit, transliteration and English translation.`;
  const url = `${APP_URL}/hindu/scriptures/${params.slug}`;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { tagName: "link", rel: "canonical", href: url },
    ...HINDU_OG_TAGS,
  ];
}

// ---------- Page ----------

export default function ScriptureTextPage() {
  const { text } = useLoaderData<typeof loader>();

  if (!text) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </div>
        <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
          Scripture not found
        </h2>
        <Link to="/hindu/scriptures" className="btn-hindu-primary">
          Browse All Scriptures
        </Link>
      </div>
    );
  }

  const chapterWord = text.type === "ramayana" ? "Sarga" : "Chapter";

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
              name: "Hindu Scriptures",
              item: `${APP_URL}/hindu/scriptures`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: text.nameEnglish,
              item: `${APP_URL}/hindu/scriptures/${text.slug}`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: text.nameEnglish,
          alternateName: text.nameSanskrit,
          url: `${APP_URL}/hindu/scriptures/${text.slug}`,
          inLanguage: ["sa", "en"],
          publisher: { "@type": "Organization", name: "Siraat", url: APP_URL },
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#4A1119] to-[#6B1F2A] text-white pt-safe-top">
        <div className="container-faith py-10 md:py-12 max-w-4xl mx-auto">
          <Link
            to="/hindu/scriptures"
            className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors mb-5 text-sm font-medium"
          >
            <ArrowLeft size={15} />
            All Scriptures
          </Link>
          <p
            className="text-[#F0A45C] text-2xl sm:text-3xl mb-2"
            style={{ fontFamily: "var(--font-devanagari)" }}
            lang="sa"
          >
            {text.nameSanskrit}
          </p>
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {text.nameEnglish}
          </h1>
          <p className="text-white/75 text-sm">
            {text.chapters.length} {chapterWord.toLowerCase()}s · {text.totalVerses} verses ·
            Sanskrit with English translation
          </p>
        </div>
      </section>

      {/* Chapters */}
      <div className="container-faith py-8 md:py-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {text.chapters.map((ch) => (
            <Link
              key={ch.chapterNumber}
              to={`/hindu/scriptures/${text.slug}/${ch.chapterNumber}`}
              className="group flex items-center gap-4 rounded-2xl bg-white border border-[#E8DCC4] hover:border-[#6B1F2A]/30 p-4 sm:p-5 transition-colors shadow-[0_1px_2px_rgba(74,17,25,0.04)]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#6B1F2A]/8 flex items-center justify-center shrink-0 group-hover:bg-[#6B1F2A]/15 transition-colors">
                <span className="text-sm font-bold text-[#6B1F2A]">{ch.chapterNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[0.9375rem] font-semibold text-[#3A0F18] group-hover:text-[#6B1F2A] transition-colors truncate">
                  {ch.nameEnglish || `${chapterWord} ${ch.chapterNumber}`}
                </h3>
                <span className="text-xs text-[#6B5642]">{ch.verseCount} verses</span>
              </div>
              <ChevronRight
                size={16}
                className="text-[#9A7B3A] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
