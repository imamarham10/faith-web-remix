import { useState, useEffect } from "react";
import type { Route } from "./+types/duas.$id";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { duasAPI } from "~/services/api";
import type { Dua } from "~/types";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "Dua - Siraat" },
    {
      name: "description",
      content: "Read and reflect on this beautiful supplication from the Sunnah.",
    },
  ];
}

export default function DuaDetailPage() {
  const { id } = useParams();
  const [dua, setDua] = useState<Dua | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError("");

    duasAPI
      .getById(id)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && data.id) {
          setDua(data);
        } else {
          console.error("Invalid dua data:", data);
          setError("Could not load this dua. It may not exist.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch dua:", err);
        setError("Failed to load this dua. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    if (!dua) return;
    const text = `${dua.textArabic}\n\n${dua.textEnglish}${
      dua.reference ? `\n\n— ${dua.reference}` : ""
    }`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-surface min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !dua) {
    return (
      <div className="bg-gradient-surface min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">
          Something went wrong
        </h2>
        <p className="text-text-secondary mb-6">{error || "Dua not found"}</p>
        <Link to="/duas" className="btn-primary">
          Browse All Duas
        </Link>
      </div>
    );
  }

  const categoryName = dua.category?.name;

  return (
    <div className="bg-gradient-surface min-h-screen pb-12">
      {/* Hero */}
      <div className="bg-hero-gradient text-white pattern-islamic pt-safe-top">
        <div className="container-faith py-8 md:py-12">
          <Link
            to="/duas"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            All Duas
          </Link>

          <div className="max-w-3xl">
            {categoryName && (
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold mb-4">
                <BookOpen size={12} />
                {categoryName}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-3">
              {dua.titleEnglish}
            </h1>

            <p
              className="font-amiri text-2xl sm:text-3xl text-white/70 leading-loose"
              dir="rtl"
            >
              {dua.titleArabic}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-faith -mt-8 relative z-10 max-w-3xl mx-auto">
        <div className="card-elevated p-6 sm:p-10 animate-fade-in-up">
          {/* Copy Button */}
          <div className="flex items-center justify-end mb-6">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors border border-border-light"
              title="Copy Arabic text and translation"
            >
              {copied ? (
                <>
                  <Check size={15} className="text-green-500" />
                  <span className="text-green-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="space-y-8">
            {/* Arabic Text */}
            <div>
              <p
                className="font-amiri text-3xl sm:text-4xl md:text-5xl text-text text-right leading-[2] sm:leading-[2.2]"
                dir="rtl"
              >
                {dua.textArabic}
              </p>
            </div>

            {/* Transliteration */}
            {dua.textTranslit && (
              <div className="pt-4 border-t border-border-light">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Transliteration
                </p>
                <p className="text-text-secondary italic text-lg leading-relaxed">
                  {dua.textTranslit}
                </p>
              </div>
            )}

            {/* English Translation */}
            <div className="pt-4 border-t border-border-light">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Translation
              </p>
              <p className="text-text text-lg sm:text-xl font-medium leading-relaxed">
                {dua.textEnglish}
              </p>
            </div>

            {/* Reference */}
            {dua.reference && (
              <div className="pt-4 border-t border-border-light">
                <p className="text-text-muted text-sm">
                  <span className="font-semibold">Source:</span> {dua.reference}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/duas"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Duas
          </Link>
        </div>
      </div>
    </div>
  );
}
