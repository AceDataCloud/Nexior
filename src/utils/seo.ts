import store from '@/store';
import { getSiteLocaleOptions } from '@/utils/siteLocales';
import { isMainOfficial } from '@/utils/is';
import { replaceBrandName } from '@/utils/site';
import { PRODUCT_LOCALES } from '@acedatacloud/core/constants';

// Resolve the current site origin at runtime so that the same bundle can be
// served independently from multiple official hostnames (e.g. hub.acedata.cloud,
// studio.acedata.cloud, hub-test.acedata.cloud) without canonicalizing them all
// to a single URL.
function getCurrentOrigin(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://hub.acedata.cloud';
}

// Hardcoded fallbacks used when the per-origin Site row hasn't loaded yet
// (e.g. very early boot, or the /sites/ API call failed). Once `getSite`
// finishes, every helper here prefers the live values from store.state.site
// so subsites can fully white-label their <title>, og:*, JSON-LD, etc.
const FALLBACK_SITE_NAME = 'Ace Data Cloud - AI Hub';
const FALLBACK_BRAND_NAME = 'Ace Data Cloud';
function getShareImage(): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'studio.acedata.cloud';
  return `https://platform.acedata.cloud/api/v1/og/${host}.png`;
}
const FALLBACK_DESCRIPTION =
  'AI-powered creative hub — generate images with Midjourney & Flux, create music with Suno, produce videos with Luma & Sora, chat with GPT, Claude, Gemini & DeepSeek.';

// Read live brand fields from the current Site row. Each one falls back to
// the AceDataCloud defaults so first-party origins keep working unchanged.
function brand() {
  const site = (store.state as { site?: Record<string, unknown> } | undefined)?.site as
    | { title?: string; description?: string }
    | undefined;
  const title = (site?.title || '').trim();
  const description = (site?.description || '').trim();
  return {
    siteName: title || FALLBACK_SITE_NAME,
    brandName: title || FALLBACK_BRAND_NAME,
    description: description || FALLBACK_DESCRIPTION,
    image: getShareImage()
  };
}

interface SeoOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  url?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

function setMeta(attr: string, value: string) {
  let el = document.querySelector(`meta[${attr}]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    const [attrName, attrValue] = attr.split('=');
    el.setAttribute(attrName, attrValue.replace(/"/g, ''));
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLd(id: string, data: Record<string, unknown>) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

// ---- hreflang ----

function setHreflang(url: string) {
  removeHreflang();
  const baseUrl = new URL(url);
  for (const { value: locale } of getSiteLocaleOptions(store.state.site?.supported_locales)) {
    const hreflang = PRODUCT_LOCALES.find((option) => option.value === locale)?.hreflang;
    if (!hreflang) continue;
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    baseUrl.searchParams.set('lang', locale);
    link.href = baseUrl.toString();
    link.dataset.hreflang = 'true';
    document.head.appendChild(link);
  }
  // x-default
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = url;
  defaultLink.dataset.hreflang = 'true';
  document.head.appendChild(defaultLink);
}

function removeHreflang() {
  document.querySelectorAll('link[data-hreflang="true"]').forEach((el) => el.remove());
}

// ---- Structured data helpers ----

export function setWebApplicationSchema(options: { name: string; description: string; url: string; category: string }) {
  const { brandName } = brand();
  const site = store.state.site;
  setJsonLd('seo-webapp-ld', {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: replaceBrandName(options.name, site),
    description: replaceBrandName(options.description, site),
    url: options.url,
    applicationCategory: options.category,
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    provider: {
      '@type': 'Organization',
      name: brandName,
      url: getCurrentOrigin()
    }
  });
}

export function setOrganization() {
  const { brandName, image, description } = brand();
  setJsonLd('seo-org-ld', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandName,
    url: getCurrentOrigin(),
    logo: image,
    description,
    ...(isMainOfficial()
      ? { sameAs: ['https://github.com/AceDataCloud', 'https://x.com/AceDataCloud', 'https://hub.acedata.cloud'] }
      : {})
  });
}

// ---- Main SEO updater ----

export function updateSeo(options: SeoOptions) {
  const { siteName, brandName, description: brandDescription, image: brandImage } = brand();
  const authoredTitle = options.title ? replaceBrandName(options.title, store.state.site) : '';
  const title = authoredTitle ? `${authoredTitle} - ${siteName}` : siteName;
  const description = options.description ? replaceBrandName(options.description, store.state.site) : brandDescription;
  const url = options.url || `${getCurrentOrigin()}${window.location.pathname}`;
  const image = options.image || brandImage;
  const ogType = options.type || 'website';

  // Title
  document.title = title;

  // Standard meta
  setMeta('name="description"', description);
  if (options.keywords?.length) {
    setMeta('name="keywords"', options.keywords.join(', '));
  }

  // Canonical
  setCanonical(url);

  // Open Graph
  setMeta('property="og:title"', title);
  setMeta('property="og:description"', description);
  setMeta('property="og:url"', url);
  setMeta('property="og:image"', image);
  setMeta('property="og:type"', ogType);
  setMeta('property="og:site_name"', brandName);

  // Twitter Cards
  setMeta('name="twitter:card"', 'summary_large_image');
  setMeta('name="twitter:title"', title);
  setMeta('name="twitter:description"', description);
  setMeta('name="twitter:image"', image);

  // JSON-LD
  if (options.jsonLd) {
    setJsonLd('seo-page-ld', options.jsonLd);
  }

  // hreflang
  setHreflang(url);
}

export function resetSeo() {
  const origin = getCurrentOrigin();
  const { siteName, description: brandDescription, image: brandImage } = brand();
  document.title = siteName;
  setMeta('name="description"', brandDescription);
  setCanonical(origin);
  setMeta('property="og:title"', siteName);
  setMeta('property="og:description"', brandDescription);
  setMeta('property="og:url"', origin);
  setMeta('property="og:image"', brandImage);
  setMeta('property="og:type"', 'website');
  setMeta('name="twitter:title"', siteName);
  setMeta('name="twitter:description"', brandDescription);
  setMeta('name="twitter:image"', brandImage);
  removeJsonLd('seo-page-ld');
  removeJsonLd('seo-webapp-ld');
  removeJsonLd('seo-org-ld');
  removeHreflang();
}
