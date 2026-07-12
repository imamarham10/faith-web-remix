import type { LoaderFunctionArgs } from "react-router";

const PRODUCTION_URL = "https://www.siraat.website";
const RELEASE_DATE = "2026-07-13";

// Static pages with realistic last-modified dates and priority
const STATIC_PAGES: Array<{ path: string; lastmod: string; priority: string; changefreq: string }> = [
  { path: "/", lastmod: RELEASE_DATE, priority: "1.0", changefreq: "daily" },
  { path: "/islam", lastmod: RELEASE_DATE, priority: "0.95", changefreq: "daily" },
  { path: "/hindu", lastmod: RELEASE_DATE, priority: "0.95", changefreq: "daily" },
  { path: "/hindu/puja-times", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "daily" },
  { path: "/hindu/scriptures", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "weekly" },
  { path: "/hindu/japa", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/hindu/panchang", lastmod: RELEASE_DATE, priority: "0.85", changefreq: "daily" },
  { path: "/hindu/stotras", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/hindu/temples", lastmod: RELEASE_DATE, priority: "0.7", changefreq: "monthly" },
  { path: "/hindu/feelings", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/hindu/stories", lastmod: RELEASE_DATE, priority: "0.85", changefreq: "weekly" },
  { path: "/islam/prayers", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "daily" },
  { path: "/islam/quran", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "weekly" },
  { path: "/islam/duas", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/islam/dhikr", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/islam/calendar", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "daily" },
  { path: "/islam/qibla", lastmod: RELEASE_DATE, priority: "0.7", changefreq: "monthly" },
  { path: "/islam/feelings", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/islam/names", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "monthly" },
  { path: "/islam/names/muhammad", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "monthly" },
  { path: "/about", lastmod: RELEASE_DATE, priority: "0.5", changefreq: "monthly" },
  { path: "/privacy", lastmod: RELEASE_DATE, priority: "0.3", changefreq: "yearly" },
  { path: "/terms", lastmod: RELEASE_DATE, priority: "0.3", changefreq: "yearly" },
  { path: "/contact", lastmod: RELEASE_DATE, priority: "0.4", changefreq: "monthly" },
  { path: "/islam/hadiths", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "weekly" },
  { path: "/subscribe", lastmod: RELEASE_DATE, priority: "0.5", changefreq: "monthly" },
];

const ISLAM_FEELING_SLUGS = [
  "angry", "anxious", "depressed", "doubtful", "grateful",
  "hurt", "jealous", "lost", "nervous", "overwhelmed",
  "sad", "scared", "tired", "weak",
];

function urlEntry(loc: string, lastmod: string, priority: string, changefreq: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

/**
 * Fetch JSON from the API, returning null on any failure. The API base MUST
 * come from VITE_API_BASE_URL (the env var that actually exists on Vercel) —
 * the old process.env.API_BASE_URL was never set in production, which
 * silently reduced this sitemap to its static skeleton.
 */
async function fetchJson(apiBase: string, path: string): Promise<any | null> {
  try {
    const res = await fetch(`${apiBase}${path}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:3000";

  const urls: string[] = [];

  for (const page of STATIC_PAGES) {
    urls.push(urlEntry(`${PRODUCTION_URL}${page.path === "/" ? "/" : page.path}`, page.lastmod, page.priority, page.changefreq));
  }

  // ---------- Islam ----------

  // Quran surahs — content is static, low changefreq
  for (let i = 1; i <= 114; i++) {
    urls.push(urlEntry(`${PRODUCTION_URL}/islam/quran/${i}`, "2026-02-15", "0.7", "monthly"));
  }

  // Islam feelings detail pages
  for (const slug of ISLAM_FEELING_SLUGS) {
    urls.push(urlEntry(`${PRODUCTION_URL}/islam/feelings/${slug}`, "2026-02-15", "0.6", "monthly"));
  }

  // All dynamic inventories in parallel
  const [duas, hadithIds, stotras, hinduFeelings, temples, stories] = await Promise.all([
    fetchJson(apiBase, "/api/v1/islam/duas"),
    fetchJson(apiBase, "/api/v1/islam/hadiths/sitemap-ids"),
    fetchJson(apiBase, "/api/v1/hindu/stotras"),
    fetchJson(apiBase, "/api/v1/hindu/feelings"),
    fetchJson(apiBase, "/api/v1/hindu/temples"),
    fetchJson(apiBase, "/api/v1/hindu/stories"),
  ]);

  // Dua detail pages (API returns a flat array of duas)
  if (Array.isArray(duas)) {
    for (const dua of duas) {
      if (dua?.id) {
        urls.push(urlEntry(`${PRODUCTION_URL}/islam/duas/${dua.id}`, "2026-02-15", "0.6", "monthly"));
      }
    }
  }

  // Hadith detail pages — full non-premium corpus via the id-list endpoint
  if (Array.isArray(hadithIds)) {
    for (const id of hadithIds) {
      if (typeof id === "string" && id) {
        urls.push(urlEntry(`${PRODUCTION_URL}/islam/hadiths/${id}`, "2026-03-07", "0.6", "monthly"));
      }
    }
  }

  // ---------- Hindu ----------

  // Bhagavad Gita chapters (full text live since 2026-07-12)
  for (let ch = 1; ch <= 18; ch++) {
    urls.push(urlEntry(`${PRODUCTION_URL}/hindu/scriptures/bhagavad-gita/${ch}`, "2026-07-12", "0.85", "monthly"));
  }

  // Bhagavad Gita verse pages (701 — canonical recension counts; each has
  // Sanskrit, transliteration, Siraat Hindi anuvad and English meaning)
  const GITA_VERSE_COUNTS = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78];
  GITA_VERSE_COUNTS.forEach((count, i) => {
    for (let v = 1; v <= count; v++) {
      urls.push(urlEntry(`${PRODUCTION_URL}/hindu/scriptures/bhagavad-gita/${i + 1}/${v}`, "2026-07-12", "0.7", "monthly"));
    }
  });

  if (Array.isArray(stotras)) {
    for (const s of stotras) {
      if (s?.slug) {
        urls.push(urlEntry(`${PRODUCTION_URL}/hindu/stotras/${s.slug}`, "2026-07-11", "0.75", "monthly"));
      }
    }
  }

  if (Array.isArray(hinduFeelings)) {
    for (const f of hinduFeelings) {
      if (f?.slug) {
        urls.push(urlEntry(`${PRODUCTION_URL}/hindu/feelings/${f.slug}`, "2026-07-11", "0.7", "monthly"));
      }
    }
  }

  if (Array.isArray(temples)) {
    for (const t of temples) {
      if (t?.id) {
        urls.push(urlEntry(`${PRODUCTION_URL}/hindu/temples/${t.id}`, "2026-07-11", "0.65", "monthly"));
      }
    }
  }

  if (Array.isArray(stories)) {
    for (const st of stories) {
      if (st?.id) {
        urls.push(urlEntry(`${PRODUCTION_URL}/hindu/stories/${st.id}`, "2026-07-11", "0.7", "monthly"));
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
