import type { LoaderFunctionArgs } from "react-router";
import { SITEMAP_PRODUCTION_URL, urlEntry, sitemapXml, xmlResponse } from "~/utils/sitemap.server";

const RELEASE_DATE = "2026-07-13";

const STATIC_PAGES: Array<{ path: string; lastmod: string; priority: string; changefreq: string }> = [
  { path: "/", lastmod: RELEASE_DATE, priority: "1.0", changefreq: "daily" },
  { path: "/islam", lastmod: RELEASE_DATE, priority: "0.95", changefreq: "daily" },
  { path: "/hindu", lastmod: RELEASE_DATE, priority: "0.95", changefreq: "daily" },
  { path: "/hindu/puja-times", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "daily" },
  { path: "/hindu/scriptures", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "weekly" },
  { path: "/hindu/japa", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/hindu/panchang", lastmod: RELEASE_DATE, priority: "0.85", changefreq: "daily" },
  { path: "/hindu/stotras", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/hindu/temples", lastmod: RELEASE_DATE, priority: "0.7", changefreq: "monthly" },
  { path: "/hindu/feelings", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/hindu/stories", lastmod: RELEASE_DATE, priority: "0.85", changefreq: "weekly" },
  { path: "/islam/prayers", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "daily" },
  { path: "/islam/quran", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "weekly" },
  { path: "/islam/duas", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/islam/dhikr", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/islam/calendar", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "daily" },
  { path: "/islam/qibla", lastmod: RELEASE_DATE, priority: "0.7", changefreq: "monthly" },
  { path: "/islam/feelings", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "weekly" },
  { path: "/islam/names", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "monthly" },
  { path: "/islam/names/muhammad", lastmod: RELEASE_DATE, priority: "0.8", changefreq: "monthly" },
  { path: "/about", lastmod: RELEASE_DATE, priority: "0.5", changefreq: "monthly" },
  { path: "/privacy", lastmod: RELEASE_DATE, priority: "0.3", changefreq: "yearly" },
  { path: "/terms", lastmod: RELEASE_DATE, priority: "0.3", changefreq: "yearly" },
  { path: "/contact", lastmod: RELEASE_DATE, priority: "0.4", changefreq: "monthly" },
  { path: "/islam/hadiths", lastmod: RELEASE_DATE, priority: "0.9", changefreq: "weekly" },
  { path: "/subscribe", lastmod: RELEASE_DATE, priority: "0.5", changefreq: "monthly" },
];

const ISLAM_FEELING_SLUGS = [
  "angry", "anxious", "depressed", "doubtful", "grateful",
  "hurt", "jealous", "lost", "nervous", "overwhelmed",
  "sad", "scared", "tired", "weak",
];

export async function loader(_args: LoaderFunctionArgs) {
  const urls: string[] = [];

  for (const page of STATIC_PAGES) {
    urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}${page.path}`, page.lastmod, page.priority, page.changefreq));
  }

  for (const slug of ISLAM_FEELING_SLUGS) {
    urls.push(urlEntry(`${SITEMAP_PRODUCTION_URL}/islam/feelings/${slug}`, "2026-02-15", "0.6", "monthly"));
  }

  return xmlResponse(sitemapXml(urls));
}
