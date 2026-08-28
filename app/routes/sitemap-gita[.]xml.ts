import type { LoaderFunctionArgs } from "react-router";
import { SITEMAP_PRODUCTION_URL, urlEntry, sitemapXml, xmlResponse } from "~/utils/sitemap.server";

// Canonical recension verse counts per chapter — fixed, no API needed.
const GITA_VERSE_COUNTS = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78];

export async function loader(_args: LoaderFunctionArgs) {
  const urls: string[] = [];

  for (let ch = 1; ch <= 18; ch++) {
    urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/scriptures/bhagavad-gita/${ch}`, "2026-07-12", "0.85", "monthly"));
  }

  GITA_VERSE_COUNTS.forEach((count, i) => {
    for (let v = 1; v <= count; v++) {
      urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/hindu/scriptures/bhagavad-gita/${i + 1}/${v}`, "2026-07-12", "0.7", "monthly"));
    }
  });

  return xmlResponse(sitemapXml(urls));
}
