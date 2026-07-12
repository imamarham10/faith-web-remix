/**
 * Shared OG/social tags for Islam section pages.
 *
 * React Router v7 uses the LEAF route's meta() and does not merge the
 * root's — so any page that exports meta() must re-declare the share
 * image and chrome color itself. Spread these into every Islam meta():
 *
 *   return [ ...pageSpecificTags, ...ISLAM_OG_TAGS ];
 */
const APP_URL = "https://www.siraat.website";

export const ISLAM_OG_TAGS = [
  { property: "og:image", content: `${APP_URL}/og/og-islam.png` },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  {
    property: "og:image:alt",
    content: "Siraat for Muslims — prayer times, Quran, hadith, dhikr and duas",
  },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: `${APP_URL}/og/og-islam.png` },
  { property: "og:site_name", content: "Siraat" },
  { name: "theme-color", content: "#1B6B4E" },
] as const;
