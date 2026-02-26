import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router";
import { ArrowLeft, Heart, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { feelingsAPI } from "~/services/api";
import type { Emotion } from "~/types";
import { JsonLd } from "~/components/JsonLd";

export async function loader() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${API_BASE}/api/v1/islam/feelings`);
    if (!res.ok) return { emotions: [] };
    const json = await res.json();
    return { emotions: json.data || json };
  } catch {
    return { emotions: [] };
  }
}

export default function Feelings() {
  const { emotions: loaderEmotions } = useLoaderData<typeof loader>();
  const [emotions, setEmotions] = useState<Emotion[]>((loaderEmotions as Emotion[]) || []);
  const [loading, setLoading] = useState(loaderEmotions?.length > 0 ? false : true);
  const [error, setError] = useState("");

  useEffect(() => {
    feelingsAPI
      .getAllEmotions()
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          setEmotions(data);
        } else {
            console.error("Unexpected API response structure:", data)
            setError("Failed to load emotions. Please try again.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch emotions:", err);
        setError("Failed to load emotions coverage. Please make sure the backend is running.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gradient-surface min-h-screen pb-12">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Islamic Guidance for Your Emotions",
        "description": "Find Islamic remedies, duas, and Quranic verses for every emotional state.",
        "url": "https://www.siraat.website/feelings",
        "mainEntity": {
          "@type": "ItemList",
          "name": "Islamic Emotional Guidance",
          "numberOfItems": emotions.length,
          "itemListElement": emotions.map((e: any, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": `Feeling ${e.name || e.slug}`,
            "url": `https://www.siraat.website/feelings/${e.slug}`
          }))
        }
      }} />
      {/* Header */}
      <div className="bg-hero-gradient text-white pattern-islamic pt-safe-top">
        <div className="container-faith py-8 md:py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-4">
              How are you feeling?
            </h1>
            <p className="text-white/90 text-lg leading-relaxed">
              Select an emotion to discover Duas, Quranic verses, and guidance curated for your
              heart's state.
            </p>
          </div>
        </div>
      </div>

      {/* Introductory Prose */}
      <div className="container-faith mt-6 mb-0 relative z-10">
        <div className="card-elevated p-6 md:p-8 mb-8">
          <h2 className="font-playfair text-xl md:text-2xl font-bold text-text mb-4">Islamic Guidance for Emotional Well-Being</h2>
          <div className="space-y-3">
            <p className="text-text-secondary text-sm leading-relaxed">
              Islam offers a deeply compassionate framework for understanding and managing human emotions. The Quran and the Sunnah of the Prophet Muhammad (peace be upon him) acknowledge the full spectrum of human feelings — from joy and gratitude to grief, anxiety, and anger — without stigma or dismissal. The Quran itself says: "Verily, with hardship comes ease" (94:6), reminding believers that emotional struggle is both natural and temporary, and that divine comfort is always near.
            </p>
            <p className="text-text-secondary text-sm leading-relaxed">
              The Prophet (peace be upon him) frequently addressed the emotional states of his companions, offering specific duas, Quranic verses, and practical advice for moments of sadness, fear, loneliness, and stress. Islamic scholars have long taught that caring for one's emotional health is part of caring for the soul (nafs) — a spiritual obligation. This tool draws from that rich tradition, pairing each emotion with curated Quranic remedies, prophetic supplications, and gentle guidance to help you find peace, perspective, and strength through faith. Select how you are feeling below to receive personalized Islamic counsel.
            </p>
          </div>
        </div>
      </div>

      <div className="container-faith -mt-8 relative z-10">
        {loading ? (
          <div className="card-elevated p-12 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <p className="text-text-muted">Loading emotions...</p>
          </div>
        ) : error ? (
            <div className="card-elevated p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle size={32} className="text-red-500 mb-4" />
                <p className="text-text font-semibold mb-2">Something went wrong</p>
                <p className="text-text-muted max-w-md mx-auto mb-6">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="btn-primary"
                >
                    Try Again
                </button>
            </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in-up">
            {emotions.map((emotion, i) => (
              <Link
                key={emotion.id}
                to={`/feelings/${emotion.slug}`}
                className="card-elevated p-6 flex flex-col items-center justify-center text-center gap-4 group min-h-[180px] hover:border-primary/30 transition-all border border-transparent"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:bg-primary/10">
                  {emotion.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors capitalize">
                    {emotion.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View remedies
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
