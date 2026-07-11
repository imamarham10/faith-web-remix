import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router";
import { ArrowLeft, AlertTriangle, HeartHandshake, Loader2 } from "lucide-react";
import { hinduFeelingsAPI } from "~/services/api";
import { JsonLd } from "~/components/JsonLd";

// ---------- Types ----------

interface HinduEmotion {
  id: string;
  slug: string;
  nameEnglish: string;
  nameHindi: string;
  icon: string;
  remedyCount?: number;
}

// ---------- Loader (SSR, public data) ----------

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${API_BASE}/api/v1/hindu/feelings`);
    if (!res.ok) return { emotions: [] };
    const json = await res.json();
    const data = json.data || json;
    return { emotions: Array.isArray(data) ? data : [] };
  } catch {
    return { emotions: [] };
  }
}

// ---------- Meta ----------

const APP_URL = "https://www.siraat.website";

export function meta() {
  const title = "Gita Verses for Every Emotion | Siraat";
  const description =
    "How is your heart today? Choose how you feel — anxious, angry, grieving, grateful — and receive Bhagavad Gita verses with gentle guidance for that moment.";
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: `${APP_URL}/hindu/feelings` },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: `${APP_URL}/hindu/feelings` },
  ];
}

// ---------- Page ----------

export default function HinduFeelings() {
  const { emotions: loaderEmotions } = useLoaderData<typeof loader>();
  const [emotions, setEmotions] = useState<HinduEmotion[]>(loaderEmotions || []);
  const [loading, setLoading] = useState(!(loaderEmotions?.length > 0));
  const [error, setError] = useState("");

  useEffect(() => {
    if (loaderEmotions?.length > 0) return;
    hinduFeelingsAPI
      .getAllEmotions()
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          setEmotions(data);
        } else {
          setError("Failed to load emotions. Please try again.");
        }
      })
      .catch(() => {
        setError("Failed to load emotions. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [loaderEmotions]);

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
          ],
        }}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-10 md:py-14">
          <Link
            to="/hindu"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Hindu Home
          </Link>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0] mb-5">
              <HeartHandshake size={12} />
              Feelings
            </div>
            <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              How is your heart today?
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Choose how you feel and receive verses from the Bhagavad Gita —
              gentle guidance from Krishna for every state of the heart.
            </p>
          </div>
        </div>
      </section>

      <div className="container-faith py-10 md:py-14">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
            <p className="text-sm text-[#6B5642]">Loading emotions…</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} />
            </div>
            <h2 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[#6B5642] mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-hindu-primary"
            >
              Retry
            </button>
          </div>
        ) : emotions.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 text-center">
            <HeartHandshake size={40} className="text-[#9A7B3A] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#3A0F18] mb-2">
              No emotions available yet
            </h3>
            <p className="text-[#6B5642] text-sm">
              Guidance for your feelings is being prepared. Please check back
              soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {emotions.map((emotion, i) => (
              <Link
                key={emotion.id}
                to={`/hindu/feelings/${emotion.slug}`}
                className="rounded-2xl bg-white border border-[#E8DCC4] hover:border-[#6B1F2A]/30 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)] p-6 flex flex-col items-center justify-center text-center gap-4 group min-h-[180px] transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-16 h-16 rounded-full bg-[#6B1F2A]/5 group-hover:bg-[#6B1F2A]/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  {emotion.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#3A0F18] group-hover:text-[#6B1F2A] transition-colors capitalize">
                    {emotion.nameEnglish}
                  </h3>
                  <p
                    className="text-sm text-[#6B5642] mt-0.5"
                    style={{ fontFamily: "var(--font-devanagari)" }}
                    lang="hi"
                  >
                    {emotion.nameHindi}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
