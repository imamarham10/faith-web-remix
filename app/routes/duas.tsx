import { useState, useEffect } from "react";
import type { Route } from "./+types/duas";
import { Link } from "react-router";
import { ArrowLeft, Loader2, AlertCircle, BookOpen, HandHeart } from "lucide-react";
import { duasAPI } from "~/services/api";
import type { Dua, DuaCategory } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Duas & Supplications - Siraat" },
    {
      name: "description",
      content:
        "Discover duas for every occasion — morning, evening, gratitude, hardship, and more.",
    },
  ];
}

export default function DuasPage() {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [categories, setCategories] = useState<DuaCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = () => {
    setLoading(true);
    setError("");

    Promise.all([duasAPI.getCategories(), duasAPI.getAll()])
      .then(([categoriesRes, duasRes]) => {
        const categoriesData = categoriesRes.data?.data || categoriesRes.data;
        const duasData = duasRes.data?.data || duasRes.data;

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error("Unexpected categories response:", categoriesData);
        }

        if (Array.isArray(duasData)) {
          setDuas(duasData);
        } else {
          console.error("Unexpected duas response:", duasData);
          setError("Failed to load duas. Please try again.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch duas data:", err);
        setError(
          "Failed to load duas. Please make sure the backend is running."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDuas =
    selectedCategoryId === "all"
      ? duas
      : duas.filter((dua) => dua.categoryId === selectedCategoryId);

  return (
    <div className="bg-gradient-surface min-h-screen pb-12">
      {/* Hero */}
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
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-4">
              <HandHeart size={14} />
              Supplications
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair tracking-tight mb-4">
              Duas &amp; Supplications
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Find the perfect dua for every moment — from waking up to seeking
              forgiveness, protection, and gratitude.
            </p>
          </div>
        </div>
      </div>

      <div className="container-faith -mt-8 relative z-10">
        {loading ? (
          <div className="card-elevated p-12 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <p className="text-text-muted">Loading duas...</p>
          </div>
        ) : error ? (
          <div className="card-elevated p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
            <AlertCircle size={32} className="text-red-500 mb-4" />
            <p className="text-text font-semibold mb-2">Something went wrong</p>
            <p className="text-text-muted max-w-md mx-auto mb-6">{error}</p>
            <button onClick={fetchData} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            {/* Category Filter Tabs */}
            {categories.length > 0 && (
              <div className="card-elevated p-4 mb-6 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  <button
                    onClick={() => setSelectedCategoryId("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategoryId === "all"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-muted hover:text-text hover:bg-black/5"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedCategoryId === category.id
                          ? "bg-primary text-white shadow-sm"
                          : "text-text-muted hover:text-text hover:bg-black/5"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Duas Grid */}
            {filteredDuas.length === 0 ? (
              <div className="card-elevated p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                  <BookOpen size={28} className="text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">
                  No duas available yet
                </h3>
                <p className="text-text-muted max-w-sm">
                  We're working on adding duas for this category. Check back
                  soon.
                </p>
                {selectedCategoryId !== "all" && (
                  <button
                    onClick={() => setSelectedCategoryId("all")}
                    className="btn-secondary mt-4"
                  >
                    View all duas
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredDuas.map((dua, i) => {
                  const categoryName =
                    dua.category?.name ||
                    categories.find((c) => c.id === dua.categoryId)?.name;

                  return (
                    <div
                      key={dua.id}
                      className="card-elevated p-6 flex flex-col gap-4 hover:border-primary/20 border border-transparent transition-all animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      {/* Category Badge */}
                      {categoryName && (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/8 text-primary text-xs font-semibold">
                            <BookOpen size={11} />
                            {categoryName}
                          </span>
                        </div>
                      )}

                      {/* Arabic Title */}
                      <p
                        className="font-amiri text-xl sm:text-2xl text-text leading-loose text-right"
                        dir="rtl"
                      >
                        {dua.titleArabic}
                      </p>

                      {/* English Title */}
                      <h3 className="text-base font-semibold text-text leading-snug">
                        {dua.titleEnglish}
                      </h3>

                      {/* Read Dua Link */}
                      <div className="mt-auto pt-2">
                        <Link
                          to={`/duas/${dua.id}`}
                          className="btn-primary w-full text-center text-sm"
                        >
                          Read Dua
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
