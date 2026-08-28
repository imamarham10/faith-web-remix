import type { LoaderFunctionArgs } from "react-router";
import { SITEMAP_PRODUCTION_URL } from "~/utils/sitemap.server";

// Sitemap index — points at one sub-sitemap per content vertical. See
// app/utils/sitemap.server.ts for why this replaced a single mega-sitemap.
const SUB_SITEMAPS: Array<{ path: string; lastmod: string }> = [
  { path: "/sitemap-static.xml", lastmod: "2026-08-28" },
  { path: "/sitemap-quran.xml", lastmod: "2026-08-28" },
  { path: "/sitemap-hadiths.xml", lastmod: "2026-08-28" },
  { path: "/sitemap-islam-misc.xml", lastmod: "2026-08-28" },
  { path: "/sitemap-gita.xml", lastmod: "2026-08-28" },
  { path: "/sitemap-ramayana.xml", lastmod: "2026-08-28" },
  { path: "/sitemap-hindu-misc.xml", lastmod: "2026-08-28" },
];

export async function loader(_args: LoaderFunctionArgs) {
  const entries = SUB_SITEMAPS.map(
    (s) => `  <sitemap>\n    <loc>${SITEMAP_PRODUCTION_URL}${s.path}</loc>\n    <lastmod>${s.lastmod}</lastmod>\n  </sitemap>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
