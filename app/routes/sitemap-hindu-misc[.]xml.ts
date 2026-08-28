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
  const xml = await withMemoryCache("hindu-misc", async () => {
    const apiBase = getApiBase();
    const urls: string[] = [];

    const [stotras, hinduFeelings, temples, stories] = await Promise.all([
      fetchJson(apiBase, "/api/v1/hindu/stotras"),
      fetchJson(apiBase, "/api/v1/hindu/feelings"),
      fetchJson(apiBase, "/api/v1/hindu/temples"),
      fetchJson(apiBase, "/api/v1/hindu/stories"),
    ]);

    if (Array.isArray(stotras)) {
      for (const s of stotras) {
        if (s?.slug) {
          urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/stotras/${s.slug}`, "2026-07-11", "0.75", "monthly"));
        }
      }
    }

    if (Array.isArray(hinduFeelings)) {
      for (const f of hinduFeelings) {
        if (f?.slug) {
          urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/feelings/${f.slug}`, "2026-07-11", "0.7", "monthly"));
        }
      }
    }

    if (Array.isArray(temples)) {
      for (const t of temples) {
        if (t?.id) {
          urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/temples/${t.id}`, "2026-07-11", "0.65", "monthly"));
        }
      }
    }

    if (Array.isArray(stories)) {
      for (const st of stories) {
        if (st?.id) {
          urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/stories/${st.id}`, "2026-07-11", "0.7", "monthly"));
        }
      }
    }

    return sitemapXml(urls);
  });

  return xmlResponse(xml);
}
