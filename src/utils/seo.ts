import { I18N_SUPPORTED_LOCALES } from '@/constants/i18n';

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

const SITE_NAME = 'Ace Data Cloud - AI Hub';
const DEFAULT_IMAGE = 'https://cdn.acedata.cloud/logo.png';
const DEFAULT_DESCRIPTION =
  'AI-powered creative hub — generate images with Midjourney & Flux, create music with Suno, produce videos with Luma & Sora, chat with GPT, Claude, Gemini & DeepSeek.';

// Locale code → hreflang value mapping (BCP 47)
const HREFLANG_MAP: Record<string, string> = {
  en: 'en',
  de: 'de',
  pt: 'pt',
  es: 'es',
  fr: 'fr',
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  it: 'it',
  ko: 'ko',
  ja: 'ja',
  ru: 'ru',
  pl: 'pl',
  fi: 'fi',
  sv: 'sv',
  el: 'el',
  uk: 'uk',
  ar: 'ar',
  sr: 'sr'
};

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
  for (const { value: locale } of I18N_SUPPORTED_LOCALES) {
    const hreflang = HREFLANG_MAP[locale];
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
  setJsonLd('seo-webapp-ld', {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: options.name,
    description: options.description,
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
      name: 'Ace Data Cloud',
      url: 'https://platform.acedata.cloud'
    }
  });
}

export function setOrganization() {
  setJsonLd('seo-org-ld', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ace Data Cloud',
    url: 'https://platform.acedata.cloud',
    logo: DEFAULT_IMAGE,
    description:
      'Unified AI API platform providing REST APIs for 100+ AI services including LLM chat, image generation, video generation, music creation, and web search.',
    sameAs: ['https://github.com/AceDataCloud', 'https://x.com/AceDataCloud', 'https://hub.acedata.cloud']
  });
}

// ---- Main SEO updater ----

export function updateSeo(options: SeoOptions) {
  const title = options.title ? `${options.title} - ${SITE_NAME}` : SITE_NAME;
  const description = options.description || DEFAULT_DESCRIPTION;
  const url = options.url || `${getCurrentOrigin()}${window.location.pathname}`;
  const image = options.image || DEFAULT_IMAGE;
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
  setMeta('property="og:site_name"', 'Ace Data Cloud');

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
  document.title = SITE_NAME;
  setMeta('name="description"', DEFAULT_DESCRIPTION);
  setCanonical(origin);
  setMeta('property="og:title"', SITE_NAME);
  setMeta('property="og:description"', DEFAULT_DESCRIPTION);
  setMeta('property="og:url"', origin);
  setMeta('property="og:image"', DEFAULT_IMAGE);
  setMeta('property="og:type"', 'website');
  setMeta('name="twitter:title"', SITE_NAME);
  setMeta('name="twitter:description"', DEFAULT_DESCRIPTION);
  setMeta('name="twitter:image"', DEFAULT_IMAGE);
  removeJsonLd('seo-page-ld');
  removeJsonLd('seo-webapp-ld');
  removeJsonLd('seo-org-ld');
  removeHreflang();
}
