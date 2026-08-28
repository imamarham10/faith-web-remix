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
  const xml = await withMemoryCache("islam-misc", async () => {
    const apiBase = getApiBase();
    const urls: string[] = [];

    const duas = await fetchJson(apiBase, "/api/v1/islam/duas");
    if (Array.isArray(duas)) {
      for (const dua of duas) {
        if (dua?.id) {
          urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/islam/duas/${dua.id}`, "2026-02-15", "0.6", "monthly"));
        }
      }
    }

    return sitemapXml(urls);
  });

  return xmlResponse(xml);
}
