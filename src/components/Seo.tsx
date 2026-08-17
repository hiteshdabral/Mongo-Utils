import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  /** Path used for the canonical link (requires VITE_SITE_URL to be set). */
  path?: string;
  /** JSON-LD structured data object. */
  jsonLd?: Record<string, unknown>;
}

/**
 * Lightweight SEO helper: sets document title, meta description, canonical
 * link (when a site URL is configured) and optional JSON-LD structured data.
 */
export default function Seo({ title, description, path, jsonLd }: SeoProps) {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    document.title = title;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;

    const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "");
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (siteUrl && path) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = siteUrl + path;
    }

    const jsonLdId = "page-jsonld";
    let script = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (jsonLdText) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = jsonLdId;
        document.head.appendChild(script);
      }
      script.textContent = jsonLdText;
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, jsonLdText]);

  return null;
}
