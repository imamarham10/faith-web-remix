import { useState, useEffect } from "react";
import { Link, useParams, useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  ArrowLeft,
  Heart,
  Loader2,
  AlertTriangle,
  ScrollText,
  BookOpen,
  Users,
} from "lucide-react";
import { hinduStoriesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";
import { deityLabel, deityBadgeClass } from "~/lib/hinduDeities";

const APP_URL = "https://www.siraat.website";

// ---------- Types (API contract §C5#4) ----------

interface Story {
  id: string;
  storyNumber: number;
  title: string;
  summary: string;
  body: string;
  deityKey: string | null;
  characters: string[];
  collection: { slug: string; name: string; sourceText: string } | null;
}

// ---------- Loader (SSR) ----------

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  if (!params.id) return { story: null };
  try {
    const res = await fetch(`${API_BASE}/api/v1/hindu/stories/${params.id}`);
    if (!res.ok) return { story: null };
    const json = await res.json();
    return { story: json.data || json };
  } catch {
    return { story: null };
  }
}

// ---------- Meta ----------

export function meta({
  data,
  params,
}: {
  data?: { story: Story | null };
  params: { id?: string };
}) {
  const story = data?.story;
  const collection = story?.collection?.name;
  const title = story
    ? `${story.title}${collection ? ` — ${collection}` : ""} | Siraat`
    : "Sacred Story | Siraat";
  const description = story
    ? story.summary
    : "Read timeless Hindu stories retold from the Puranas and the Ramayana.";
  const url = `${APP_URL}/hindu/stories/${story?.id || params.id || ""}`;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: url },
  ];
}

// ---------- Page ----------

export default function StoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { story: loaderStory } = useLoaderData<typeof loader>();

  const [story, setStory] = useState<Story | null>((loaderStory as Story) || null);
  const [loading, setLoading] = useState(!loaderStory);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    hinduStoriesAPI
      .getById(id)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && data.id) {
          setStory(data);
        } else {
          setError("Could not load this story. It may not exist.");
        }
      })
      .catch((err: any) => {
        setError(
          err?.response?.status === 404
            ? "This story could not be found."
            : "Failed to load this story. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !story?.id) return;
    hinduStoriesAPI
      .getFavorites()
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          setIsFavorite(data.some((f: any) => f.story?.id === story.id));
        }
      })
      .catch(() => {});
  }, [isAuthenticated, story?.id]);

  const toggleFavorite = async () => {
    if (!story) return;
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    setFavoriteBusy(true);
    try {
      if (isFavorite) {
        await hinduStoriesAPI.removeFavorite(story.id);
        setIsFavorite(false);
      } else {
        await hinduStoriesAPI.addFavorite(story.id);
        setIsFavorite(true);
      }
    } catch {
      // keep previous state on failure
    } finally {
      setFavoriteBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#6B1F2A]" />
        <p className="text-sm text-[#6B5642]">Loading story…</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </div>
        <h2 className="font-playfair text-2xl font-bold text-[#3A0F18] mb-2">
          Story not found
        </h2>
        <p className="text-sm text-[#6B5642] mb-6 max-w-md">
          {error || "This story could not be found."}
        </p>
        <Link to="/hindu/stories" className="btn-hindu-primary">
          Browse all stories
        </Link>
      </div>
    );
  }

  const paragraphs = (story.body || "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FBF6EC] pb-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: story.title,
            description: story.summary,
            url: `${APP_URL}/hindu/stories/${story.id}`,
            articleSection: story.collection?.name || undefined,
            about: story.characters?.length ? story.characters : undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
              { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
              { "@type": "ListItem", position: 3, name: "Stories", item: `${APP_URL}/hindu/stories` },
              {
                "@type": "ListItem",
                position: 4,
                name: story.title,
                item: `${APP_URL}/hindu/stories/${story.id}`,
              },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-10 md:py-14">
          <Link
            to="/hindu/stories"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            All Stories
          </Link>

          <div className="max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0]">
                <ScrollText size={11} />
                Katha
              </span>
              {story.collection && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-white/90">
                  <BookOpen size={11} />
                  {story.collection.name}
                </span>
              )}
              {story.deityKey && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${deityBadgeClass(story.deityKey)}`}
                >
                  {deityLabel(story.deityKey)}
                </span>
              )}
            </div>

            <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {story.title}
            </h1>

            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl">
              {story.summary}
            </p>

            <div className="mt-6">
              <button
                onClick={toggleFavorite}
                disabled={favoriteBusy}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60 ${
                  isFavorite
                    ? "bg-white text-[#6B1F2A] border-white"
                    : "bg-white/10 text-white border-white/25 hover:bg-white/20"
                }`}
                aria-pressed={isFavorite}
              >
                <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? "Favorited" : "Add to favorites"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="container-faith py-8 md:py-10 max-w-3xl space-y-6">
        <article className="rounded-2xl bg-white border border-[#E8DCC4] p-6 md:p-9 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)]">
          {paragraphs.length > 0 ? (
            <div className="space-y-5">
              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={`text-[#1A1D23] leading-[1.85] ${
                    i === 0
                      ? "text-lg first-letter:text-5xl first-letter:font-playfair first-letter:font-bold first-letter:text-[#6B1F2A] first-letter:mr-2 first-letter:float-left first-letter:leading-[0.9]"
                      : "text-base"
                  }`}
                >
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[#6B5642]">This story’s text is being prepared.</p>
          )}
        </article>

        {story.characters?.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#E8DCC4] p-6">
            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-[#9A7B3A] font-semibold mb-3">
              <Users size={12} />
              Characters
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {story.characters.map((name) => (
                <span
                  key={name}
                  className="px-2.5 py-1 rounded-md bg-[#FBF6EC] border border-[#E8DCC4] text-sm text-[#6B5642]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Link
            to="/hindu/stories"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B1F2A] hover:text-[#3A0F18] transition-colors"
          >
            <ArrowLeft size={15} />
            Back to all stories
          </Link>
        </div>
      </div>
    </div>
  );
}
