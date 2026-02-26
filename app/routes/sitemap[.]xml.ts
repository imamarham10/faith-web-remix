import type { LoaderFunctionArgs } from "react-router";

const PRODUCTION_URL = "https://siraatt.vercel.app";

const STATIC_PAGES = [
  "/",
  "/prayers",
  "/quran",
  "/duas",
  "/dhikr",
  "/calendar",
  "/qibla",
  "/feelings",
  "/names",
  "/names/muhammad",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
];

const FEELING_SLUGS = [
  "angry", "anxious", "depressed", "doubtful", "grateful",
  "hurt", "jealous", "lost", "nervous", "overwhelmed",
  "sad", "scared", "tired", "weak",
];

export async function loader({ request }: LoaderFunctionArgs) {
  const today = new Date().toISOString().split("T")[0];
  const urls: string[] = [];

  for (const page of STATIC_PAGES) {
    urls.push(`  <url>\n    <loc>${PRODUCTION_URL}${page === "/" ? "/" : page}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`);
  }

  for (let i = 1; i <= 114; i++) {
    urls.push(`  <url>\n    <loc>${PRODUCTION_URL}/quran/${i}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`);
  }

  for (const slug of FEELING_SLUGS) {
    urls.push(`  <url>\n    <loc>${PRODUCTION_URL}/feelings/${slug}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`);
  }

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
            urls.push(`  <url>\n    <loc>${PRODUCTION_URL}/duas/${dua.id}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`);
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
