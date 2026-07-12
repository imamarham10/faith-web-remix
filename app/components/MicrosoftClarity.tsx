/**
 * Microsoft Clarity (session recordings + heatmaps).
 *
 * Production builds only — dev sessions must not pollute recordings. The
 * project ID is public (it ships in every page's source); VITE_CLARITY_ID
 * overrides it (e.g. a separate staging project). Clarity tracks SPA route
 * changes natively, so no router listener is needed.
 */
const CLARITY_ID = import.meta.env.PROD
  ? ((import.meta.env.VITE_CLARITY_ID as string | undefined) ?? "xleve7zk6b")
  : undefined;

export function MicrosoftClarity() {
  if (!CLARITY_ID) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `,
      }}
    />
  );
}
