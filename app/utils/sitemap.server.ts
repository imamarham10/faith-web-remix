// Shared helpers for the sitemap index + per-vertical sub-sitemaps.
//
// Split from a single 35K-URL/7MB sitemap (2026-07-13 → 2026-08-28) after
// Google Search Console showed "Couldn't fetch" with 0 discovered pages for
// six straight weeks. Root cause: one request fanned out to 13 live backend
// calls and serialized ~35K entries synchronously — any backend slowness
// (cold start, DB latency) risked exceeding the serverless function's
// timeout, and Googlebot never got a successful response to build on.
//
// Splitting by content vertical means one backend hiccup breaks one
// sub-sitemap instead of the whole site's discoverability, and each
// vertical's indexing rate can be monitored independently in GSC.

export const SITEMAP_PRODUCTION_URL = "https://www.siraat.website";

const FETCH_TIMEOUT_MS = 8_000;
const MEMORY_CACHE_TTL_MS = 15 * 60 * 1000;

export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:3000";
}

/** Fetch JSON, bounded by a timeout so one slow backend call can't stall the whole sitemap request. */
export async function fetchJson(apiBase: string, path: string): Promise<any | null> {
  try {
    const res = await fetch(`${apiBase}${path}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

export function urlEntry(loc: string, lastmod: string, priority: string, changefreq: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export function sitemapXml(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}

/**
 * Serves the sitemap with headers Vercel's edge network will actually cache
 * on: a real client max-age, a long CDN s-maxage, and stale-while-revalidate
 * so a bad regeneration serves the last-known-good copy instead of an error.
 */
export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

const memoryCache = new Map<string, { xml: string; expires: number }>();

/**
 * Per-instance cache so repeated hits against a warm serverless instance
 * (crawler retries, CDN revalidation) don't re-fan-out to the backend every
 * time. Not a substitute for CDN caching (instances are ephemeral) — a
 * cheap second line of defense.
 */
export async function withMemoryCache(key: string, generate: () => Promise<string>): Promise<string> {
  const cached = memoryCache.get(key);
  const now = Date.now();
  if (cached && cached.expires > now) return cached.xml;
  const xml = await generate();
  memoryCache.set(key, { xml, expires: now + MEMORY_CACHE_TTL_MS });
  return xml;
}
