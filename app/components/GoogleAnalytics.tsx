import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Google Analytics 4, env-driven: renders nothing unless
 * VITE_GA_MEASUREMENT_ID is set (e.g. "G-XXXXXXXXXX"), so dev/preview
 * environments stay clean.
 *
 * Page views are sent manually on every route change (send_page_view is
 * disabled in the config) because this is an SPA after hydration — the
 * default behavior would only record the first page.
 */
// Production builds only — a dev server must not pollute stats. The ID is
// public (it ships in every page's source), so it lives here as the default;
// VITE_GA_MEASUREMENT_ID overrides it (e.g. a separate staging property).
const GA_ID = import.meta.env.PROD
  ? ((import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ?? "G-15MQ5W4YGR")
  : undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const location = useLocation();

  // SPA page_view on every client-side navigation (and the initial load).
  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  if (!GA_ID) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: false });
          `,
        }}
      />
    </>
  );
}
