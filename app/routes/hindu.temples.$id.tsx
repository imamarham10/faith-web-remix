import { useState, useEffect } from "react";
import { Link, useParams, useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  ArrowLeft,
  Heart,
  Loader2,
  AlertTriangle,
  MapPin,
  Navigation,
  Landmark,
  Sparkles,
} from "lucide-react";
import { hinduTemplesAPI } from "~/services/api";
import { useAuth } from "~/contexts/AuthContext";
import { JsonLd } from "~/components/JsonLd";
import { deityLabel, deityBadgeClass } from "~/lib/hinduDeities";
import { HINDU_OG_TAGS } from "~/utils/hinduSeo";

const APP_URL = "https://www.siraat.website";

// ---------- Types (API contract §C3#4) ----------

interface Temple {
  id: string;
  name: string;
  deityKey: string | null;
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  significance: string | null;
  photos: string[];
  source: string;
}

// ---------- Loader (SSR) ----------

export async function loader({ params }: LoaderFunctionArgs) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  if (!params.id) return { temple: null };
  try {
    const res = await fetch(`${API_BASE}/api/v1/hindu/temples/${params.id}`);
    if (!res.ok) return { temple: null };
    const json = await res.json();
    return { temple: json.data || json };
  } catch {
    return { temple: null };
  }
}

// ---------- Meta ----------

export function meta({ data, params }: { data?: { temple: Temple | null }; params: { id?: string } }) {
  const temple = data?.temple;
  const place = temple ? [temple.city, temple.state].filter(Boolean).join(", ") : "";
  const title = temple
    ? `${temple.name}${place ? ` — ${place}` : ""} | Siraat`
    : "Temple | Siraat";
  const description = temple
    ? `${temple.name}${place ? ` in ${place}` : ""} — history, significance and directions. ${temple.significance || ""}`.trim()
    : "Explore India's most sacred Hindu temples with directions and significance.";
  const url = `${APP_URL}/hindu/temples/${temple?.id || params.id || ""}`;
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

export default function TempleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { temple: loaderTemple } = useLoaderData<typeof loader>();

  const [temple, setTemple] = useState<Temple | null>(
    (loaderTemple as Temple) || null,
  );
  const [loading, setLoading] = useState(!loaderTemple);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    hinduTemplesAPI
      .getById(id)
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && data.id) {
          setTemple(data);
        } else {
          setError("Could not load this temple. It may not exist.");
        }
      })
      .catch((err: any) => {
        setError(
          err?.response?.status === 404
            ? "This temple could not be found."
            : "Failed to load this temple. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !temple?.id) return;
    hinduTemplesAPI
      .getFavorites()
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          setIsFavorite(data.some((f: any) => f.temple?.id === temple.id));
        }
      })
      .catch(() => {});
  }, [isAuthenticated, temple?.id]);

  const toggleFavorite = async () => {
    if (!temple) return;
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    setFavoriteBusy(true);
    try {
      if (isFavorite) {
        await hinduTemplesAPI.removeFavorite(temple.id);
        setIsFavorite(false);
      } else {
        await hinduTemplesAPI.addFavorite(temple.id);
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
        <p className="text-sm text-[#6B5642]">Loading temple…</p>
      </div>
    );
  }

  if (error || !temple) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FBE9EA] text-[#A33B47] flex items-center justify-center mb-4">
          <AlertTriangle size={22} />
        </div>
        <h2 className="font-playfair text-2xl font-bold text-[#3A0F18] mb-2">
          Temple not found
        </h2>
        <p className="text-sm text-[#6B5642] mb-6 max-w-md">
          {error || "This temple could not be found."}
        </p>
        <Link to="/hindu/temples" className="btn-hindu-primary">
          Browse all temples
        </Link>
      </div>
    );
  }

  const fullAddress = [temple.address, temple.city, temple.state, temple.country]
    .filter(Boolean)
    .join(", ");
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${temple.lat},${temple.lng}`;

  return (
    <div className="min-h-screen bg-[#FBF6EC] pb-14">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "HinduTemple",
            name: temple.name,
            description: temple.description || undefined,
            url: `${APP_URL}/hindu/temples/${temple.id}`,
            address: {
              "@type": "PostalAddress",
              streetAddress: temple.address || undefined,
              addressLocality: temple.city || undefined,
              addressRegion: temple.state || undefined,
              addressCountry: temple.country || undefined,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: temple.lat,
              longitude: temple.lng,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
              { "@type": "ListItem", position: 2, name: "Hindu", item: `${APP_URL}/hindu` },
              { "@type": "ListItem", position: 3, name: "Temples", item: `${APP_URL}/hindu/temples` },
              {
                "@type": "ListItem",
                position: 4,
                name: temple.name,
                item: `${APP_URL}/hindu/temples/${temple.id}`,
              },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="bg-hero-hindu pattern-kolam text-white">
        <div className="container-faith py-10 md:py-14">
          <Link
            to="/hindu/temples"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            All Temples
          </Link>

          <div className="max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-[0.18em] text-[#E8D5A0]">
                <Landmark size={11} />
                Temple
              </span>
              {temple.deityKey && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${deityBadgeClass(temple.deityKey)}`}
                >
                  {deityLabel(temple.deityKey)}
                </span>
              )}
            </div>

            <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
              {temple.name}
            </h1>

            {fullAddress && (
              <p className="inline-flex items-start gap-2 text-white/80 text-sm sm:text-base">
                <MapPin size={16} className="text-[#E8D5A0] mt-0.5 shrink-0" />
                {fullAddress}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-[#6B1F2A] hover:bg-[#FAF1D9] transition-colors"
              >
                <Navigation size={15} />
                Get directions
              </a>
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
      <div className="container-faith py-8 md:py-10 max-w-3xl space-y-5">
        {temple.description && (
          <article className="rounded-2xl bg-white border border-[#E8DCC4] p-6 md:p-8 shadow-[0_1px_2px_rgba(74,17,25,0.04),0_8px_24px_-12px_rgba(74,17,25,0.12)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9A7B3A] font-semibold mb-3">
              About the temple
            </p>
            <p className="text-[#1A1D23] text-base leading-relaxed">
              {temple.description}
            </p>
          </article>
        )}

        {temple.significance && (
          <article className="rounded-2xl bg-gradient-to-br from-[#FBF6EC] to-[#F4E7C4] border border-[#E8D5A0] p-6 md:p-8">
            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-[#9A7B3A] font-semibold mb-3">
              <Sparkles size={12} />
              Significance
            </p>
            <p className="text-[#3A0F18] text-base leading-relaxed">
              {temple.significance}
            </p>
          </article>
        )}

        {!temple.description && !temple.significance && (
          <div className="rounded-2xl bg-white border border-[#E8DCC4] p-12 text-center">
            <h3 className="font-playfair text-xl font-bold text-[#3A0F18] mb-2">
              Details coming soon
            </h3>
            <p className="text-sm text-[#6B5642]">
              We're still writing about this temple. Use the directions link above to
              plan your visit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
