import { useState, useEffect } from "react";
import { Link, useLoaderData, useParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { ArrowLeft, AlertTriangle, BookOpen, Loader2, Sparkles } from "lucide-react";
import { hinduFeelingsAPI } from "~/services/api";
import { JsonLd } from "~/components/JsonLd";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

// ---------- Types ----------

interface RemedyVerse {
  id: string;
  verseNumber: number;
  sanskritText: string;
  transliteration?: string;
  chapter?: { chapterNumber: number };
  text?: { slug: string; nameEnglish: string };
  translations?: { languageCode: string; authorName?: string; text: string }[];
}

interface EmotionRemedy {
  id: string;
  note?: string;
  sequence: number;
  verse: RemedyVerse;
}

interface HinduEmotionDetail {
  id: string;
  slug: string;
  nameEnglish: string;
  nameHindi: string;
  icon: string;
  remedies: EmotionRemedy[];
}

// ---------- Loader (SSR, public data) ----------

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  if (!params.slug) return { emotion: null };
  try {
    const res = await fetch(`${API_BASE}/api/v1/hindu/feelings/${params.slug}?lang=en`);
    if (!res.ok) return { emotion: null };
    const json = await res.json();
    const data = json.data || json;
    return { emotion: data && data.id ? data : null };
  } catch {
    return { emotion: null };
  }
}

// ---------- Meta ----------

const APP_URL = "https://www.siraat.website";

export function meta({
  data,
  params,
}: {
  data?: { emotion: HinduEmotionDetail | null };
  params: { slug?: string };
}) {
  const name = data?.emotion?.nameEnglish;
  const title = name
    ? `Feeling ${name} — Bhagavad Gita Guidance | Siraat`
    : "Gita Guidance for Your Feelings | Siraat";
  const description = name
    ? `Bhagavad Gita verses and gentle guidance for when you are feeling ${name.toLowerCase()} — Sanskrit, transliteration, and English translation.`
    : "Bhagavad Gita verses and gentle guidance for every state of the heart.";
  const url = `${APP_URL}/hindu/feelings/${params.slug}`;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    ...HINDU_OG_TAGS,
  ];
}

// ---------- Page ----------

export default function HinduEmotionDetailPage() {
  const { slug } = useParams();
  const { emotion: loaderEmotion } = useLoaderData<typeof loader>();
  const [emotion, setEmotion] = useState<HinduEmotionDetail | null>(
    (loaderEmotion as HinduEmotionDetail) || null,
  );
  const [loading, setLoading] = useState(!loaderEmotion);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    if (loaderEmotion && (loaderEmotion as HinduEmotionDetail).slug === slug) {
      setEmotion(loaderEmotion as HinduEmotionDetail);
      return;
    }
    setLoading(true);
    setError("");
    hinduFeelingsAPI
      .getEmotionDetails(slug)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && data.id) {
          setEmotion(data);
        } else {
          setEmotion(null);
          setError("Could not find guidance for this feeling.");
        }
      })
      .catch((err) => {
        setEmotion(null);
        setError(
          err?.response?.status === 404
            ? "Could not find guidance for this feeling."
            : "Failed to load guidance. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [slug, loaderEmotion]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#6B1F2A]" />
      </div>
    );
  }

  if (error || !emotion) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </div>
        <h2 className="font-playfair text-2xl font-bold text-[#3A0F18] mb-2">
          Something went wrong
        </h2>
        <p className="text-[#6B5642] mb-6">{error || "Feeling not found"}</p>
        <Link to="/hindu/feelings" className="btn-hindu-primary">
          Browse All Feelings
        </Link>
      </div>
    );
  }

  const remedies = [...(emotion.remedies || [])].sort(
    (a, b) => a.sequence - b.sequence,
  );

  return (
    <div className="min-h-screen bg-[#FBF6EC] pb-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
            { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
            {
              "@type": "ListItem",
              position: 3,
              name: "Feelings",
              item: `${APP_URL}/hindu/feelings`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: emotion.nameEnglish,
              item: `${APP_URL}/hindu/feelings/${emotion.slug}`,
            },
          ],
        }}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-10 md:py-14">
          <Link
            to="/hindu/feelings"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium mb-6"
          >
            <ArrowLeft size={16} />
            All Feelings
          </Link>

          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl border border-white/10 shadow-lg">
                {emotion.icon}
              </div>
              <div>
                <p className="text-[#E8D5A0] text-[11px] font-semibold tracking-[0.18em] uppercase mb-1">
                  Gita Guidance For
                </p>
                <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight capitalize">
                  {emotion.nameEnglish}
                </h1>
                <p
                  className="text-white/80 text-lg mt-1"
                  style={{ fontFamily: "var(--font-devanagari)" }}
                  lang="hi"
                >
                  {emotion.nameHindi}
                </p>
              </div>
            </div>
            <p className="text-white/80 text-lg leading-relaxed max-w-xl">
              The Bhagavad Gita speaks to every state of the heart. Sit with
              these verses — read slowly, and let them meet you where you are.
            </p>
          </div>
        </div>
      </section>

      <div className="container-faith py-10 md:py-14 max-w-3xl mx-auto space-y-6">
        {remedies.length > 0 ? (
          remedies.map((remedy, index) => {
            const verse = remedy.verse;
            const chapterNumber = verse?.chapter?.chapterNumber;
            const textSlug = verse?.text?.slug || "bhagavad-gita";
            const textName = verse?.text?.nameEnglish || "Bhagavad Gita";
            const translation = verse?.translations?.[0];
            return (
              <article
                key={remedy.id}
                className="rounded-2xl bg-white border border-[#E8DCC4] shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] p-6 sm:p-8 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Pastoral note */}
                {remedy.note && (
                  <div className="flex items-start gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#6B1F2A]/8 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-[#6B1F2A]" />
                    </span>
                    <p className="text-[0.9375rem] text-[#6B5642] leading-relaxed italic pt-1">
                      {remedy.note}
                    </p>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Sanskrit */}
                  {verse?.sanskritText && (
                    <p
                      className="text-xl sm:text-2xl text-[#3A0F18] leading-relaxed whitespace-pre-line"
                      style={{ fontFamily: "var(--font-devanagari)" }}
                      lang="sa"
                    >
                      {verse.sanskritText}
                    </p>
                  )}

                  {/* Transliteration */}
                  {verse?.transliteration && (
                    <p className="text-sm text-[#6B5642] italic leading-relaxed whitespace-pre-line">
                      {verse.transliteration}
                    </p>
                  )}

                  {/* Translation */}
                  {translation?.text && (
                    <div className="pt-4 border-t border-[#F1E7D2]">
                      <p className="text-[#1A1D23] text-base sm:text-lg leading-relaxed">
                        {translation.text}
                      </p>
                      {translation.authorName && (
                        <p className="text-xs text-[#9A7B3A] mt-2">
                          — {translation.authorName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Source */}
                  {chapterNumber != null && (
                    <Link
                      to={`/hindu/scriptures/${textSlug}/${chapterNumber}?verse=${verse.verseNumber}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B1F2A] hover:underline"
                    >
                      <BookOpen size={14} />
                      {textName} {chapterNumber}.{verse.verseNumber}
                    </Link>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 text-center">
            <BookOpen size={40} className="text-[#9A7B3A] mx-auto mb-4" />
            <p className="text-[#6B5642] text-lg mb-4">
              No guidance found for this feeling yet.
            </p>
            <Link to="/hindu/feelings" className="btn-hindu-primary inline-flex">
              Explore other feelings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
