import { redirect, type LoaderFunctionArgs } from "react-router";

/**
 * 301-redirects any old top-level Islamic path (e.g. /prayers, /quran/123) to
 * its new home under /islam/*. Used for SEO continuity after the multi-faith
 * restructure. The same module backs multiple route entries via unique IDs in
 * routes.ts.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const newPath = `/islam${url.pathname}${url.search}`;
  throw redirect(newPath, 301);
}

export default function RedirectToIslam() {
  return null;
}
