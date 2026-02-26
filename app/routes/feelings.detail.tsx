import { useState, useEffect } from "react";
import { Link, useParams, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { ArrowLeft, Loader2, Sparkles, BookOpen, Share2, Copy, Check } from "lucide-react";
import { feelingsAPI } from "~/services/api";
import type { EmotionDetail as EmotionDetailType, Remedy } from "~/types";
import { JsonLd } from "~/components/JsonLd";

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  if (!params.slug) return { emotion: null };
  try {
    const res = await fetch(`${API_BASE}/api/v1/islam/feelings/${params.slug}`);
    if (!res.ok) return { emotion: null };
    const json = await res.json();
    return { emotion: json.data || json };
  } catch {
    return { emotion: null };
  }
}

export default function EmotionDetail() {
  const { slug } = useParams();
  const { emotion: loaderEmotion } = useLoaderData<typeof loader>();
  const [emotion, setEmotion] = useState<EmotionDetailType | null>((loaderEmotion as EmotionDetailType) || null);
  const [loading, setLoading] = useState(loaderEmotion ? false : true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    feelingsAPI
      .getEmotionDetails(slug)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && data.id) {
            setEmotion(data);
        } else {
            console.error("Invalid emotion data:", data);
            setError("Could not load details for this emotion.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch emotion details:", err);
        setError("Failed to load remedies. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-surface min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !emotion) {
    return (
      <div className="bg-gradient-surface min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
            <Sparkles size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Something went wrong</h2>
        <p className="text-text-secondary mb-6">{error || "Emotion not found"}</p>
        <Link to="/feelings" className="btn-primary">
          Browse All Feelings
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-surface min-h-screen pb-12">
      {emotion && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `Islamic Remedies for ${emotion.name}`,
          "description": `Islamic guidance, duas, and Quranic verses for when you are feeling ${emotion.name.toLowerCase()}.`,
          "url": `https://www.siraat.website/feelings/${emotion.slug || slug}`,
          "inLanguage": ["en", "ar"],
          "image": "https://www.siraat.website/og-image.png",
          "datePublished": "2026-02-01",
          "dateModified": new Date().toISOString().split("T")[0],
          "mainEntityOfPage": `https://www.siraat.website/feelings/${emotion.slug || slug}`,
          "author": { "@type": "Organization", "name": "Siraat", "url": "https://www.siraat.website" },
          "publisher": { "@type": "Organization", "name": "Siraat", "url": "https://www.siraat.website", "logo": { "@type": "ImageObject", "url": "https://www.siraat.website/og-image.png" } }
        }} />
      )}
      {/* Header */}
      <div className="bg-hero-gradient text-white pattern-islamic pt-safe-top">
        <div className="container-faith py-8 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <Link
                to="/feelings"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
                <ArrowLeft size={16} />
                All Feelings
            </Link>
          </div>

          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl border border-white/10 shadow-lg">
                    {emotion.icon}
                </div>
                <div>
                    <p className="text-white/90 text-sm font-semibold tracking-wider uppercase mb-1">
                        Remedies For
                    </p>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight capitalize">
                        {emotion.name}
                    </h1>
                </div>
            </div>
            <p className="text-white/90 text-lg leading-relaxed max-w-xl">
              Remember that Allah tests those He loves. Here are some remedies from the Quran and Sunnah to help soothe your heart.
            </p>
          </div>
        </div>
      </div>

      <div className="container-faith -mt-8 relative z-10 space-y-6">
        {emotion.remedies && emotion.remedies.length > 0 ? (
            emotion.remedies.map((remedy, index) => (
                <div 
                    key={remedy.id} 
                    className="card-elevated p-6 sm:p-8 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-semibold">
                            <BookOpen size={14} />
                            <span>{remedy.source}</span>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => copyToClipboard(`${remedy.translation} - ${remedy.source}`, remedy.id)}
                                className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                                title="Copy translation"
                             >
                                {copiedId === remedy.id ? <Check size={18} /> : <Copy size={18} />}
                             </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <p 
                            className="font-amiri text-2xl sm:text-3xl md:text-4xl text-right leading-loose text-text" 
                            dir="rtl"
                        >
                            {remedy.arabicText}
                        </p>
                        
                        <div>
                            <p className="text-sm text-text-muted font-medium uppercase tracking-wider mb-2">Transliteration</p>
                            <p className="text-text-secondary italic text-lg leading-relaxed">
                                {remedy.transliteration}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <p className="text-text text-lg sm:text-xl font-medium leading-relaxed">
                                {remedy.translation}
                            </p>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="card-elevated p-12 text-center">
                <p className="text-text-muted text-lg">No remedies found for this emotion yet.</p>
                <Link to="/feelings" className="btn-secondary mt-4 inline-flex">
                    Explore other feelings
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}
