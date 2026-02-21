import { useState, useEffect } from "react";
import type { Route } from "./+types/feelings";
import { Link } from "react-router";
import { ArrowLeft, Heart, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { feelingsAPI } from "~/services/api";
import type { Emotion } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Understand Your Feelings - Siraat" },
    {
      name: "description",
      content: "Find Islamic guidance and remedies for your emotional state.",
    },
  ];
}

export default function Feelings() {
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);
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
      {/* Header */}
      <div className="bg-hero-gradient text-white pattern-islamic pt-safe-top">
        <div className="container-faith py-8 md:py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-4">
              How are you feeling?
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Select an emotion to discover Duas, Quranic verses, and guidance curated for your
              heart's state.
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
