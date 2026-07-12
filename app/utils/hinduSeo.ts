/**
 * Shared OG/social tags for Hindu section pages.
 *
 * React Router v7 uses the LEAF route's meta() and does not merge the
 * root's — so any page that exports meta() must re-declare the share
 * image and chrome color itself. Spread these into every Hindu meta():
 *
 *   return [ ...pageSpecificTags, ...HINDU_OG_TAGS ];
 */
const APP_URL = "https://www.siraat.website";

export const HINDU_OG_TAGS = [
  { property: "og:image", content: `${APP_URL}/og/og-hindu.png` },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  {
    property: "og:image:alt",
    content: "Siraat for Hindus — Panchang, Bhagavad Gita, japa, stotras and temples",
  },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: `${APP_URL}/og/og-hindu.png` },
  { property: "og:site_name", content: "Siraat" },
  { name: "theme-color", content: "#6B1F2A" },
] as const;
