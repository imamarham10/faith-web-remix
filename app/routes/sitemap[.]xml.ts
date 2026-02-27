import type { LoaderFunctionArgs } from "react-router";

const PRODUCTION_URL = "https://www.siraat.website";

// Static pages with realistic last-modified dates and priority
const STATIC_PAGES: Array<{ path: string; lastmod: string; priority: string; changefreq: string }> = [
  { path: "/", lastmod: "2026-02-26", priority: "1.0", changefreq: "daily" },
  { path: "/prayers", lastmod: "2026-02-20", priority: "0.9", changefreq: "daily" },
  { path: "/quran", lastmod: "2026-02-15", priority: "0.9", changefreq: "weekly" },
  { path: "/duas", lastmod: "2026-02-15", priority: "0.8", changefreq: "weekly" },
  { path: "/dhikr", lastmod: "2026-02-20", priority: "0.8", changefreq: "weekly" },
  { path: "/calendar", lastmod: "2026-02-20", priority: "0.8", changefreq: "daily" },
  { path: "/qibla", lastmod: "2026-02-10", priority: "0.7", changefreq: "monthly" },
  { path: "/feelings", lastmod: "2026-02-15", priority: "0.8", changefreq: "weekly" },
  { path: "/names", lastmod: "2026-02-15", priority: "0.8", changefreq: "monthly" },
  { path: "/names/muhammad", lastmod: "2026-02-15", priority: "0.8", changefreq: "monthly" },
  { path: "/about", lastmod: "2026-02-01", priority: "0.5", changefreq: "monthly" },
  { path: "/privacy", lastmod: "2026-02-01", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", lastmod: "2026-02-01", priority: "0.3", changefreq: "yearly" },
  { path: "/contact", lastmod: "2026-02-01", priority: "0.4", changefreq: "monthly" },
];

const FEELING_SLUGS = [
  "angry", "anxious", "depressed", "doubtful", "grateful",
  "hurt", "jealous", "lost", "nervous", "overwhelmed",
  "sad", "scared", "tired", "weak",
];

function urlEntry(loc: string, lastmod: string, priority: string, changefreq: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const urls: string[] = [];

  for (const page of STATIC_PAGES) {
    urls.push(urlEntry(`${PRODUCTION_URL}${page.path === "/" ? "/" : page.path}`, page.lastmod, page.priority, page.changefreq));
  }

  // Quran surahs — content is static, low changefreq
  for (let i = 1; i <= 114; i++) {
    urls.push(urlEntry(`${PRODUCTION_URL}/quran/${i}`, "2026-02-15", "0.7", "monthly"));
  }

  // Feelings detail pages
  for (const slug of FEELING_SLUGS) {
    urls.push(urlEntry(`${PRODUCTION_URL}/feelings/${slug}`, "2026-02-15", "0.6", "monthly"));
  }

  // Dua detail pages from API
  try {
    const apiBase = process.env.API_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${apiBase}/api/v1/islam/duas`);
    if (response.ok) {
      const json = await response.json();
      const categories = Array.isArray(json) ? json : json.data || [];
      for (const cat of categories) {
        const duas = cat.duas || [];
        for (const dua of duas) {
          if (dua.id) {
            urls.push(urlEntry(`${PRODUCTION_URL}/duas/${dua.id}`, "2026-02-15", "0.6", "monthly"));
          }
        }
      }
    }
  } catch {
    // Skip dua pages if API unreachable
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
