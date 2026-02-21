import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Heart, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { feelingsAPI } from "~/services/api";
import type { Emotion } from "~/types";

export function FeelingsWidget() {
  const [feelings, setFeelings] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feelingsAPI.getAllEmotions()
      .then(res => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0) {
          // Deterministic selection of 4 feelings based on date
          const today = new Date();
          const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
          
          const selected = [];
          const tempData = [...data];
          
          for (let i = 0; i < 4 && tempData.length > 0; i++) {
            // Using seed + i to pick different ones
            const index = (seed + i) % tempData.length;
            selected.push(tempData.splice(index, 1)[0]);
          }
          
          setFeelings(selected);
        }
      })
      .catch(err => console.error("Failed to fetch feelings for widget:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card-elevated p-6 sm:p-8 relative overflow-hidden group min-h-[250px] flex flex-col justify-center">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
        <Heart size={120} />
      </div>

      <div className="relative z-10 w-full">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Heart size={20} />
            </div>
            <h2 className="text-xl font-bold font-playfair text-text">How is your heart today?</h2>
        </div>
        
        <p className="text-text-secondary mb-6 leading-relaxed">
            Find comfort and guidance from the Quran and Sunnah tailored to your emotions.
        </p>

        {loading ? (
            <div className="flex items-center justify-center py-6">
                <Loader2 size={24} className="animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
                {feelings.map((feeling) => (
                    <Link
                        key={feeling.slug}
                        to={`/feelings/${feeling.slug}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300 group/item"
                    >
                        <span className="text-xl group-hover/item:scale-110 transition-transform">{feeling.icon}</span>
                        <span className="text-sm font-medium text-text group-hover/item:text-primary transition-colors">{feeling.name}</span>
                    </Link>
                ))}
            </div>
        )}

        <Link 
            to="/feelings" 
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors group/link"
        >
            View all emotions
            <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

