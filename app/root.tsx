import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { JsonLd } from "./components/JsonLd";
import { Analytics } from "@vercel/analytics/react";

// Favicon with rounded square and moon icon (matching header logo)
const faviconSvg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%231B6B4E"/><stop offset="100%" style="stop-color:%23157347"/></linearGradient></defs><rect x="0" y="0" width="180" height="180" rx="40" fill="url(%23grad)"/><text x="90" y="115" font-size="100" text-anchor="middle" fill="white" font-family="Arial, sans-serif">☽</text></svg>`;

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: faviconSvg, type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: faviconSvg },
];

const SURAH_NAMES: Record<number, string> = {
  1: "Surah Al-Fatihah", 2: "Surah Al-Baqarah", 3: "Surah Ali 'Imran", 4: "Surah An-Nisa", 5: "Surah Al-Ma'idah",
  6: "Surah Al-An'am", 7: "Surah Al-A'raf", 8: "Surah Al-Anfal", 9: "Surah At-Tawbah", 10: "Surah Yunus",
  11: "Surah Hud", 12: "Surah Yusuf", 13: "Surah Ar-Ra'd", 14: "Surah Ibrahim", 15: "Surah Al-Hijr",
  16: "Surah An-Nahl", 17: "Surah Al-Isra", 18: "Surah Al-Kahf", 19: "Surah Maryam", 20: "Surah Taha",
  21: "Surah Al-Anbiya", 22: "Surah Al-Hajj", 23: "Surah Al-Mu'minun", 24: "Surah An-Nur", 25: "Surah Al-Furqan",
  26: "Surah Ash-Shu'ara", 27: "Surah An-Naml", 28: "Surah Al-Qasas", 29: "Surah Al-'Ankabut", 30: "Surah Ar-Rum",
  31: "Surah Luqman", 32: "Surah As-Sajdah", 33: "Surah Al-Ahzab", 34: "Surah Saba", 35: "Surah Fatir",
  36: "Surah Ya-Sin", 37: "Surah As-Saffat", 38: "Surah Sad", 39: "Surah Az-Zumar", 40: "Surah Ghafir",
  41: "Surah Fussilat", 42: "Surah Ash-Shura", 43: "Surah Az-Zukhruf", 44: "Surah Ad-Dukhan", 45: "Surah Al-Jathiyah",
  46: "Surah Al-Ahqaf", 47: "Surah Muhammad", 48: "Surah Al-Fath", 49: "Surah Al-Hujurat", 50: "Surah Qaf",
  51: "Surah Adh-Dhariyat", 52: "Surah At-Tur", 53: "Surah An-Najm", 54: "Surah Al-Qamar", 55: "Surah Ar-Rahman",
  56: "Surah Al-Waqi'ah", 57: "Surah Al-Hadid", 58: "Surah Al-Mujadila", 59: "Surah Al-Hashr", 60: "Surah Al-Mumtahanah",
  61: "Surah As-Saff", 62: "Surah Al-Jumu'ah", 63: "Surah Al-Munafiqun", 64: "Surah At-Taghabun", 65: "Surah At-Talaq",
  66: "Surah At-Tahrim", 67: "Surah Al-Mulk", 68: "Surah Al-Qalam", 69: "Surah Al-Haqqah", 70: "Surah Al-Ma'arij",
  71: "Surah Nuh", 72: "Surah Al-Jinn", 73: "Surah Al-Muzzammil", 74: "Surah Al-Muddaththir", 75: "Surah Al-Qiyamah",
  76: "Surah Al-Insan", 77: "Surah Al-Mursalat", 78: "Surah An-Naba", 79: "Surah An-Nazi'at", 80: "Surah 'Abasa",
  81: "Surah At-Takwir", 82: "Surah Al-Infitar", 83: "Surah Al-Mutaffifin", 84: "Surah Al-Inshiqaq", 85: "Surah Al-Buruj",
  86: "Surah At-Tariq", 87: "Surah Al-A'la", 88: "Surah Al-Ghashiyah", 89: "Surah Al-Fajr", 90: "Surah Al-Balad",
  91: "Surah Ash-Shams", 92: "Surah Al-Layl", 93: "Surah Ad-Duhaa", 94: "Surah Ash-Sharh", 95: "Surah At-Tin",
  96: "Surah Al-'Alaq", 97: "Surah Al-Qadr", 98: "Surah Al-Bayyinah", 99: "Surah Az-Zalzalah", 100: "Surah Al-'Adiyat",
  101: "Surah Al-Qari'ah", 102: "Surah At-Takathur", 103: "Surah Al-'Asr", 104: "Surah Al-Humazah", 105: "Surah Al-Fil",
  106: "Surah Quraysh", 107: "Surah Al-Ma'un", 108: "Surah Al-Kawthar", 109: "Surah Al-Kafirun", 110: "Surah An-Nasr",
  111: "Surah Al-Masad", 112: "Surah Al-Ikhlas", 113: "Surah Al-Falaq", 114: "Surah An-Nas",
};

export const meta: Route.MetaFunction = ({ location, error }) => {
  const pathname = location.pathname;
  const appUrl = "https://www.siraat.website";
  const pageUrl = `${appUrl}${pathname}`;

  // Handle error pages (404, etc.) — distinct title + noindex
  if (error) {
    const is404 = isRouteErrorResponse(error) && error.status === 404;
    return [
      { title: is404 ? "Page Not Found | Siraat" : "Error | Siraat" },
      { name: "description", content: is404 ? "The page you are looking for does not exist." : "An error occurred." },
      { name: "robots", content: "noindex" },
    ];
  }

  let pageTitle = "Siraat - Your Spiritual Companion";
  let pageDescription = "A comprehensive Islamic spiritual companion with prayer times, Quran reader, dhikr counter, and more.";

  // Dynamic route: /quran/:surahId (must be checked BEFORE /quran)
  const surahIdMatch = pathname.match(/^\/quran\/(\d+)$/);
  // Dynamic route: /feelings/:slug (must be checked BEFORE /feelings)
  const feelingsSlugMatch = pathname.match(/^\/feelings\/([^/]+)$/);
  // Dynamic route: /duas/:id (must be checked BEFORE /duas)
  const duasIdMatch = pathname.match(/^\/duas\/([^/]+)$/);

  let noIndex = false;
  let ogType = "website";

  if (pathname.startsWith("/prayers")) {
    pageTitle = "Prayer Times & Tracking | Siraat";
    pageDescription = "Accurate prayer times based on your location with real-time countdown, prayer logging, and streak tracking.";
  } else if (pathname.startsWith("/quran/bookmarks")) {
    pageTitle = "My Quran Bookmarks | Siraat";
    pageDescription = "Your saved Quran verses and bookmarks for easy reference.";
    noIndex = true;
  } else if (surahIdMatch) {
    const surahNum = surahIdMatch[1];
    const surahName = SURAH_NAMES[Number(surahNum)] || `Surah ${surahNum}`;
    pageTitle = `${surahName} - Read with Arabic & Translation | Siraat`;
    pageDescription = `Read ${surahName} with Arabic text, English translation, and transliteration. Surah ${surahNum} of the Holy Quran.`;
    ogType = "article";
  } else if (pathname.startsWith("/quran")) {
    pageTitle = "The Noble Quran | Siraat";
    pageDescription = "Read the Holy Quran with Arabic text, English translation, and transliteration. Browse all 114 Surahs.";
  } else if (pathname.startsWith("/dhikr")) {
    pageTitle = "Dhikr Counter & Tracker | Siraat";
    pageDescription = "Track your daily dhikr with customizable counters, goals, and streaks. Remember Allah with ease.";
  } else if (pathname.startsWith("/calendar")) {
    pageTitle = "Islamic Calendar & Hijri Dates | Siraat";
    pageDescription = "Hijri-Gregorian calendar converter with upcoming Islamic events, holidays, and important dates.";
  } else if (pathname.startsWith("/qibla")) {
    pageTitle = "Qibla Direction Finder | Siraat";
    pageDescription = "Find the accurate Qibla direction from your current location using compass and GPS.";
  } else if (pathname.startsWith("/names/muhammad")) {
    pageTitle = "99 Names of Prophet Muhammad (SAW) | Siraat";
    pageDescription = "Explore the 99 beautiful names of Prophet Muhammad (peace be upon him) with Arabic text, transliteration, and meanings.";
  } else if (pathname.startsWith("/names")) {
    pageTitle = "99 Names of Allah (Al-Asma ul-Husna) | Siraat";
    pageDescription = "Learn the 99 Beautiful Names of Allah with Arabic calligraphy, transliteration, meanings, and descriptions.";
  } else if (feelingsSlugMatch) {
    const slug = feelingsSlugMatch[1];
    const capitalized = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    pageTitle = `Feeling ${capitalized}? Islamic Guidance | Siraat`;
    pageDescription = `Islamic remedies, duas, and Quranic verses for when you feel ${slug.replace(/-/g, " ")}.`;
    ogType = "article";
  } else if (pathname.startsWith("/feelings")) {
    pageTitle = "Islamic Guidance for Your Emotions | Siraat";
    pageDescription = "Find Islamic remedies, duas, and Quranic verses for every emotional state — anxiety, sadness, gratitude, and more.";
  } else if (duasIdMatch) {
    pageTitle = "Dua Details | Siraat";
    pageDescription = "Read this beautiful dua with Arabic text, transliteration, and English translation.";
    ogType = "article";
  } else if (pathname.startsWith("/duas")) {
    pageTitle = "Duas & Supplications | Siraat";
    pageDescription = "Discover duas for every occasion — morning, evening, gratitude, hardship, and more. Arabic text with translation.";
  } else if (pathname === "/about") {
    pageTitle = "About Siraat | Siraat";
    pageDescription = "Learn about Siraat, a free Islamic spiritual companion platform with prayer times, Quran, dhikr, and more.";
  } else if (pathname === "/privacy") {
    pageTitle = "Privacy Policy | Siraat";
    pageDescription = "How Siraat handles your data. We respect your privacy and never sell your information.";
  } else if (pathname === "/terms") {
    pageTitle = "Terms of Service | Siraat";
    pageDescription = "Terms and conditions for using Siraat, the Islamic spiritual companion platform.";
  } else if (pathname === "/contact") {
    pageTitle = "Contact Us | Siraat";
    pageDescription = "Get in touch with the Siraat team. We welcome feedback, bug reports, and community contributions.";
  } else if (pathname.startsWith("/auth")) {
    pageTitle = "Sign In | Siraat";
    pageDescription = "Sign in to your Siraat account to track prayers, save bookmarks, and personalize your experience.";
    noIndex = true;
  } else if (pathname.startsWith("/settings")) {
    pageTitle = "Settings | Siraat";
    pageDescription = "Manage your Siraat account settings and preferences.";
    noIndex = true;
  }

  const metaTags: ReturnType<Route.MetaFunction> = [
    { title: pageTitle },
    { name: "description", content: pageDescription },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#1B6B4E" },
    { name: "application-name", content: "Siraat" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { name: "apple-mobile-web-app-title", content: "Siraat" },
    { tagName: "link", rel: "canonical", href: pageUrl },
    { property: "og:type", content: ogType },
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: pageDescription },
    { property: "og:url", content: pageUrl },
    { property: "og:image", content: `${appUrl}/og-image.png` },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "Siraat App Preview" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: pageTitle },
    { name: "twitter:description", content: pageDescription },
    { name: "twitter:image", content: `${appUrl}/og-image.png` },
    { property: "og:locale", content: "en_US" },
    { property: "og:site_name", content: "Siraat" },
  ];

  if (noIndex) {
    metaTags.push({ name: "robots", content: "noindex, nofollow" });
  }

  return metaTags;
};

function BreadcrumbSchema() {
  const location = useLocation();
  const pathname = location.pathname;

  // Don't add breadcrumbs on homepage
  if (pathname === "/") return null;

  // Only render for known route prefixes (avoids invalid breadcrumbs on 404 pages)
  const segments = pathname.split("/").filter(Boolean);
  const validRoots = ["prayers", "quran", "dhikr", "calendar", "qibla", "names", "feelings", "duas", "about", "privacy", "terms", "contact", "settings", "auth"];
  if (segments.length === 0 || !validRoots.includes(segments[0])) return null;

  const appUrl = "https://www.siraat.website";

  // Build breadcrumb items
  const items: Array<{ name: string; url: string }> = [
    { name: "Home", url: appUrl },
  ];

  // Map of known routes to display names
  const routeNames: Record<string, string> = {
    "/prayers": "Prayer Times",
    "/quran": "Quran",
    "/dhikr": "Dhikr Counter",
    "/calendar": "Islamic Calendar",
    "/qibla": "Qibla Finder",
    "/names": "99 Names of Allah",
    "/names/muhammad": "99 Names of Muhammad",
    "/feelings": "Feelings & Emotions",
    "/duas": "Duas & Supplications",
    "/about": "About",
    "/privacy": "Privacy Policy",
    "/terms": "Terms of Service",
    "/contact": "Contact",
    "/settings": "Settings",
  };

  // Handle multi-segment paths (e.g., /names/muhammad, /quran/1, /feelings/sad)
  if (segments.length === 1) {
    // Single segment: /prayers, /quran, /about, etc.
    const name = routeNames[pathname] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
    items.push({ name, url: `${appUrl}${pathname}` });
  } else if (segments.length === 2) {
    // Two segments: /quran/1, /names/muhammad, /feelings/sad, /duas/123
    const parentPath = `/${segments[0]}`;
    const parentName = routeNames[parentPath] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
    items.push({ name: parentName, url: `${appUrl}${parentPath}` });

    // Check if the full path has a known name
    const fullName = routeNames[pathname];
    if (fullName) {
      items.push({ name: fullName, url: `${appUrl}${pathname}` });
    } else {
      // Dynamic segment — generate a readable name
      const segment = segments[1];
      let childName = segment;
      if (segments[0] === "quran") {
        childName = `Surah ${segment}`;
      } else if (segments[0] === "feelings") {
        childName = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      } else if (segments[0] === "duas") {
        childName = "Dua Details";
      }
      items.push({ name: childName, url: `${appUrl}${pathname}` });
    }
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url,
    })),
  };

  return <JsonLd data={breadcrumbData} />;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Siraat",
          "alternateName": "Siraat - Your Spiritual Companion",
          "url": "https://www.siraat.website",
          "description": "A comprehensive Islamic spiritual companion with prayer times, Quran reader, dhikr counter, and more.",
          "inLanguage": "en",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://www.siraat.website/quran?search={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }} />
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Siraat",
          "url": "https://www.siraat.website",
          "logo": { "@type": "ImageObject", "url": "https://www.siraat.website/og-image.png", "width": 1200, "height": 630 },
          "description": "A comprehensive Islamic spiritual companion platform.",
          "foundingDate": "2026-01-01",
          "founder": { "@type": "Person", "name": "Imam Arham" }
        }} />
        <BreadcrumbSchema />
      </head>
      <body className="font-jakarta bg-bg text-text antialiased">
        <LanguageProvider>
          <NotificationProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </NotificationProvider>
        </LanguageProvider>
        <ScrollRestoration />
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/auth");

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-gradient-primary font-playfair mb-4">{message}</h1>
          <p className="text-text-secondary text-lg mb-8">{details}</p>
          <a href="/" className="btn-primary inline-flex">
            Go Home
          </a>
          {stack && (
            <pre className="mt-8 text-left text-xs p-4 bg-surface rounded-xl overflow-x-auto border border-border-light">
              <code>{stack}</code>
            </pre>
          )}
        </div>
      </div>
  );
}
