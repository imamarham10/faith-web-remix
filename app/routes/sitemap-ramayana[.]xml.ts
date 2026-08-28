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

const RAMAYANA_SLUGS = [
  "ramayana-bala-kanda", "ramayana-ayodhya-kanda", "ramayana-aranya-kanda",
  "ramayana-kishkindha-kanda", "ramayana-sundara-kanda", "ramayana-yuddha-kanda",
  "ramayana-uttara-kanda",
];

export async function loader(_args: LoaderFunctionArgs) {
  const xml = await withMemoryCache("ramayana", async () => {
    const apiBase = getApiBase();
    const urls: string[] = [];

    const kandas = await Promise.all(
      RAMAYANA_SLUGS.map((slug) => fetchJson(apiBase, `/api/v1/hindu/scriptures/texts/${slug}`)),
    );

    for (const kanda of kandas) {
      if (!kanda?.slug || !Array.isArray(kanda.chapters)) continue;
      urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/scriptures/${kanda.slug}`, "2026-07-13", "0.8", "monthly"));
      for (const ch of kanda.chapters) {
        urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/scriptures/${kanda.slug}/${ch.chapterNumber}`, "2026-07-13", "0.7", "monthly"));
        for (let v = 1; v <= (ch.verseCount || 0); v++) {
          urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/scriptures/${kanda.slug}/${ch.chapterNumber}/${v}`, "2026-07-13", "0.6", "monthly"));
        }
      }
    }

    return sitemapXml(urls);
  });

  return xmlResponse(xml);
}
