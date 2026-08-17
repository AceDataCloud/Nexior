import type { ISite, ISiteAnalytics } from '@/models';
import { isWeb } from '@/utils/surface';

const MAIN_STUDIO_HOST = 'studio.acedata.cloud';
const SCRIPT_PREFIX = 'site-analytics-';
let active: ISiteAnalytics | undefined;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  _hmt?: Array<unknown[]>;
  clarity?: (...args: unknown[]) => void;
  umami?: { track?: (event?: unknown) => void };
};

function normalizeHost(value?: string): string {
  if (!value) return '';
  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`);
    return url.hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return '';
  }
}

export function shouldLoadSiteAnalytics(site?: ISite, hostname = window.location.hostname): boolean {
  if (!isWeb()) return false;
  const current = normalizeHost(hostname);
  if (!current || current === MAIN_STUDIO_HOST || current === 'localhost' || current === '127.0.0.1') return false;
  const trusted = new Set(
    [normalizeHost(site?.origin), ...(site?.active_page_hosts || []).map(normalizeHost)].filter(Boolean)
  );
  return (
    trusted.has(current) && !!site?.analytics && Object.values(site.analytics).some((provider) => provider?.enabled)
  );
}

function addScript(id: string, src: string, attributes: Record<string, string> = {}): void {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  script.dataset.siteAnalytics = 'true';
  Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
  document.head.appendChild(script);
}

function initializeGa4(measurementId: string): void {
  const target = window as AnalyticsWindow;
  target.dataLayer ||= [];
  target.gtag ||= (...args: unknown[]) => target.dataLayer?.push(args);
  target.gtag('js', new Date());
  target.gtag('config', measurementId, { send_page_view: true });
  addScript(`${SCRIPT_PREFIX}ga4`, `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
}

function initializeBaidu(siteId: string): void {
  const target = window as AnalyticsWindow;
  target._hmt ||= [];
  addScript(`${SCRIPT_PREFIX}baidu`, `https://hm.baidu.com/hm.js?${siteId}`);
}

function initializeClarity(projectId: string): void {
  const target = window as AnalyticsWindow;
  if (!target.clarity) {
    target.clarity = (...args: unknown[]) => {
      const clarity = target.clarity as unknown as { q?: unknown[][] };
      clarity.q ||= [];
      clarity.q.push(args);
    };
  }
  addScript(`${SCRIPT_PREFIX}clarity`, `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`);
}

function initializeUmami(websiteId: string, serverUrl: string): void {
  addScript(`${SCRIPT_PREFIX}umami`, `${serverUrl.replace(/\/$/, '')}/script.js`, {
    'data-website-id': websiteId,
    'data-auto-track': 'true'
  });
}

export function initializeSiteAnalytics(site?: ISite, hostname = window.location.hostname): void {
  if (!shouldLoadSiteAnalytics(site, hostname)) return;
  active = site?.analytics;
  try {
    if (active?.ga4?.enabled) initializeGa4(active.ga4.measurement_id);
    if (active?.baidu?.enabled) initializeBaidu(active.baidu.site_id);
    if (active?.clarity?.enabled) initializeClarity(active.clarity.project_id);
    if (active?.umami?.enabled) initializeUmami(active.umami.website_id, active.umami.server_url);
  } catch (error) {
    console.warn('site analytics initialization failed', error);
  }
}

export function trackSitePageView(path: string): void {
  if (!active) return;
  const target = window as AnalyticsWindow;
  try {
    if (active.ga4?.enabled) {
      target.gtag?.('event', 'page_view', {
        send_to: active.ga4.measurement_id,
        page_path: path,
        page_location: window.location.href,
        page_title: document.title
      });
    }
    if (active.baidu?.enabled) target._hmt?.push(['_trackPageview', path]);
    if (active.clarity?.enabled) target.clarity?.('set', 'page_path', path);
    if (active.umami?.enabled) target.umami?.track?.({ url: path, title: document.title });
  } catch {
    // Third-party telemetry must never affect navigation.
  }
}
