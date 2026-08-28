import type { LoaderFunctionArgs } from "react-router";
import {
  SITEMAP_PRODUCTION_URL,
  urlEntry,
  sitemapXml,
  xmlResponse,
  fetchJson,
  getApiBase,
  withMemoryCache,
} from "~/utils/sitemap.server";

export async function loader(_args: LoaderFunctionArgs) {
  const xml = await withMemoryCache("quran", async () => {
    const apiBase = getApiBase();
    const urls: string[] = [];

    // Chapter pages — fixed count, no API needed.
    for (let i = 1; i <= 114; i++) {
      urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/islam/quran/${i}`, "2026-02-15", "0.7", "monthly"));
    }

    // Verse pages — counts come from the DB so they always match what the
    // verse routes can actually serve.
    const surahs = await fetchJson(apiBase, "/api/v1/islam/quran/surahs");
    if (Array.isArray(surahs)) {
      for (const s of surahs) {
        const count = s?.verseCount || s?.versesCount || 0;
        for (let v = 1; v <= count; v++) {
          urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/islam/quran/${s.id}/${v}`, "2026-07-13", "0.65", "monthly"));
        }
      }
    }

    return sitemapXml(urls);
  });

  return xmlResponse(xml);
}
