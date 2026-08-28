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
  const xml = await withMemoryCache("hadiths", async () => {
    const apiBase = getApiBase();
    const urls: string[] = [];

    const hadithIds = await fetchJson(apiBase, "/api/v1/islam/hadiths/sitemap-ids");
    if (Array.isArray(hadithIds)) {
      for (const id of hadithIds) {
        if (typeof id === "string" && id) {
          urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/islam/hadiths/${id}`, "2026-03-07", "0.6", "monthly"));
        }
      }
    }

    return sitemapXml(urls);
  });

  return xmlResponse(xml);
}
