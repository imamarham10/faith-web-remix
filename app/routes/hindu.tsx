import { Link } from "react-router";
import { Sparkles, ArrowLeft, Bell } from "lucide-react";
import { JsonLd } from "~/components/JsonLd";

export function meta() {
  const appUrl = "https://www.siraat.website";
  return [
    { title: "Hindu — Coming Soon | Siraat" },
    {
      name: "description",
      content:
        "Mantras, Bhagavad Gita, Panchang and festivals — Siraat's Hindu spiritual companion is on the way. Sign up to be notified at launch.",
    },
    { tagName: "link", rel: "canonical", href: `${appUrl}/hindu` },
    { property: "og:title", content: "Hindu — Coming Soon | Siraat" },
    {
      property: "og:description",
      content:
        "Mantras, Bhagavad Gita, Panchang and festivals — Siraat's Hindu companion is on the way.",
    },
    { property: "og:url", content: `${appUrl}/hindu` },
  ];
}

export default function HinduComingSoon() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Hindu — Coming Soon",
          url: "https://www.siraat.website/hindu",
          description:
            "Siraat's Hindu spiritual companion (mantras, Bhagavad Gita, Panchang) is in development.",
        }}
      />
      <section className="min-h-[calc(100vh-4.5rem)] bg-bg flex items-center">
        <div className="container-faith py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary text-xs font-semibold tracking-wide mb-6">
              <Sparkles size={14} />
              In development
            </div>

            <h1 className="text-4xl md:text-5xl font-bold font-playfair text-text mb-4 leading-tight">
              Siraat for Hindu seekers — coming soon
            </h1>

            <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-10">
              We're building a thoughtful Hindu companion: mantras with japa
              counters, the Bhagavad Gita, Panchang & Tithi, festival
              reminders, and stotras. We want to get it right, so it's still in
              the works.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12 text-left">
              {["Mantras & Japa", "Bhagavad Gita", "Panchang", "Festivals"].map(
                (label) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border-light bg-surface px-4 py-3 text-sm text-text-secondary"
                  >
                    {label}
                  </div>
                ),
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth/register" className="btn-primary inline-flex items-center gap-2">
                <Bell size={16} />
                Notify me at launch
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-text hover:bg-black/[0.03] transition-colors"
              >
                <ArrowLeft size={16} />
                Back to home
              </Link>
            </div>

            <p className="text-xs text-text-muted mt-10">
              In the meantime, our Islamic companion is fully live —{" "}
              <Link to="/islam" className="text-primary font-semibold hover:underline">
                explore Siraat for Muslims
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
