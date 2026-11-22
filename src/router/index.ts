import { isCapabilityAvailableOnBuild } from '@/utils/surface';
import { type Router } from 'vue-router';
import store from '@/store';
import auth from './auth';
import console from './console';
import home, { homeCompatibilityRoute } from './home';
import business from './business';
import grok from './grok';
import gemini from './gemini';
import claude from './claude';
import deepseek from './deepseek';
import kimi from './kimi';
import mimo from './mimo';
import chatgpt from './chatgpt';
import midjourney from './midjourney';
import distribution from './distribution';
import download from './download';
import order from './order';
import qrart from './qrart';
import luma from './luma';
import pika from './pika';
import kling from './kling';
import veo from './veo';
import sora from './sora';
import maestro from './maestro';
import poivelle from './poivelle';
import digitalhuman from './digitalhuman';
import pixverse from './pixverse';
import flux from './flux';
import hailuo from './hailuo';
import minimax from './minimax';
import suno from './suno';
import producer from './producer';
import acemusic from './acemusic';
import nanobanana from './nanobanana';
import openaiimage from './openaiimage';
import seedream from './seedream';
import qwenimage from './qwenimage';
import seedance from './seedance';
import grokvideo from './grokvideo';
import omni from './omni';
import serp from './serp';
import wan from './wan';
import fish from './fish';
import webextrator from './webextrator';
import codingBridge from './codingBridge';
import settings from './settings';
import share from './share';

import {
  ROUTE_CHATGPT_CONVERSATION_NEW,
  ROUTE_DEEPSEEK_CONVERSATION_NEW,
  ROUTE_GROK_CONVERSATION_NEW,
  ROUTE_GEMINI_CONVERSATION_NEW,
  ROUTE_CLAUDE_CONVERSATION_NEW,
  ROUTE_KIMI_CONVERSATION_NEW,
  ROUTE_MIMO_CONVERSATION_NEW,
  ROUTE_MIDJOURNEY_INDEX,
  ROUTE_FLUX_INDEX,
  ROUTE_NANOBANANA_INDEX,
  ROUTE_OPENAIIMAGE_INDEX,
  ROUTE_SEEDREAM_INDEX,
  ROUTE_QWENIMAGE_INDEX,
  ROUTE_SUNO_INDEX,
  ROUTE_PRODUCER_INDEX,
  ROUTE_ACEMUSIC_INDEX,
  ROUTE_SEEDANCE_INDEX,
  ROUTE_GROKVIDEO_INDEX,
  ROUTE_OMNI_INDEX,
  ROUTE_LUMA_INDEX,
  ROUTE_HAILUO_INDEX,
  ROUTE_MINIMAX_INDEX,
  ROUTE_KLING_INDEX,
  ROUTE_VEO_INDEX,
  ROUTE_SORA_INDEX,
  ROUTE_MAESTRO_INDEX,
  ROUTE_POIVELLE_INDEX,
  ROUTE_DIGITALHUMAN_INDEX,
  ROUTE_PIXVERSE_INDEX,
  ROUTE_WAN_INDEX,
  ROUTE_SERP_INDEX,
  ROUTE_FISH_TTS_INDEX,
  ROUTE_WEBEXTRATOR_INDEX,
  ROUTE_NOT_FOUND
} from './constants';
import { getCookie } from 'typescript-cookie';
import { I18N_DEFAULT_LOCALE } from '@/constants/i18n';
import { getLocale, setI18nLanguage } from '@/i18n';
import { getForcedLocale } from '@/utils/siteLocales';
import { isIframeLoginEnabled } from '@/utils/loginMethod';
import { updateSeo, setWebApplicationSchema, setOrganization, resetSeo } from '@/utils/seo';
import { ensureStoreModule } from '@/store/lazy';
import { evaluateUserIdGuard } from '@/utils/crossSiteUser';
import { handleChunkLoadError } from '@/utils/chunkLoadError';
import { loginRedirect } from '@/utils/login';
import { isNative, isDesktop } from '@/utils/surface';
import { requiresLogin } from './authPolicy';
import { trackSitePageView } from '@/utils/siteAnalytics';
import { CAPABILITY_KEYS } from '@/constants/capabilities';
import type { IChatModelGroup } from '@/models';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import studioRouteSeo from '../../deploy/production/studio-route-seo.json';

const routeSeoByPrefix = new Map(Object.entries(studioRouteSeo));

// Ordered priority list: each entry is [feature key, landing route name].
// `getDefaultRoute()` walks this list top-to-bottom and picks the first
// feature that is enabled in `site.features`. This order — NOT the order
// of keys in the API response — controls which feature greets new visitors.
//
// Why not trust `site.features` insertion order? `Site.features` is stored
// in PostgreSQL `jsonb`, which does NOT preserve key order across writes:
// any partial update can shuffle keys. Relying on that order has bitten us
// (e.g. studio.acedata.cloud landed on /veo because `veo` happened to be
// the first key after a feature toggle re-serialized the jsonb blob).
const FEATURE_ROUTE_PRIORITY: Array<[string, string]> = [
  ['chatgpt', ROUTE_CHATGPT_CONVERSATION_NEW],
  ['claude', ROUTE_CLAUDE_CONVERSATION_NEW],
  ['gemini', ROUTE_GEMINI_CONVERSATION_NEW],
  ['grok', ROUTE_GROK_CONVERSATION_NEW],
  ['deepseek', ROUTE_DEEPSEEK_CONVERSATION_NEW],
  ['kimi', ROUTE_KIMI_CONVERSATION_NEW],
  ['mimo', ROUTE_MIMO_CONVERSATION_NEW],
  ['midjourney', ROUTE_MIDJOURNEY_INDEX],
  ...(isCapabilityAvailableOnBuild('nanobanana')
    ? ([['nanobanana', ROUTE_NANOBANANA_INDEX]] as Array<[string, string]>)
    : []),
  ['flux', ROUTE_FLUX_INDEX],
  ['seedream', ROUTE_SEEDREAM_INDEX],
  ['qwenimage', ROUTE_QWENIMAGE_INDEX],
  ['openaiimage', ROUTE_OPENAIIMAGE_INDEX],
  ['suno', ROUTE_SUNO_INDEX],
  ['producer', ROUTE_PRODUCER_INDEX],
  ['acemusic', ROUTE_ACEMUSIC_INDEX],
  ['fish', ROUTE_FISH_TTS_INDEX],
  ['veo', ROUTE_VEO_INDEX],
  ['sora', ROUTE_SORA_INDEX],
  ['maestro', ROUTE_MAESTRO_INDEX],
  ['poivelle', ROUTE_POIVELLE_INDEX],
  ['digitalhuman', ROUTE_DIGITALHUMAN_INDEX],
  ['kling', ROUTE_KLING_INDEX],
  ['luma', ROUTE_LUMA_INDEX],
  ['hailuo', ROUTE_HAILUO_INDEX],
  ['minimax', ROUTE_MINIMAX_INDEX],
  ['seedance', ROUTE_SEEDANCE_INDEX],
  ['grokvideo', ROUTE_GROKVIDEO_INDEX],
  ['omni', ROUTE_OMNI_INDEX],
  ['pixverse', ROUTE_PIXVERSE_INDEX],
  ['wan', ROUTE_WAN_INDEX],
  ['serp', ROUTE_SERP_INDEX],
  ['webextrator', ROUTE_WEBEXTRATOR_INDEX]
];

export const getDefaultRoute = (): { name: string } => {
  const features = (store.state.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
  for (const [key, name] of FEATURE_ROUTE_PRIORITY) {
    if (features[key]?.enabled) {
      // IMPORTANT: must return { name } — returning a bare string makes
      // vue-router treat it as a *path*, which would navigate to e.g.
      // /chatgpt-conversation-new (the route name) instead of the actual
      // path /chatgpt/conversations.
      return { name };
    }
  }
  // Fallback: if no priority feature is enabled, use chatgpt.
  return { name: ROUTE_CHATGPT_CONVERSATION_NEW };
};

export const routes = [
  home,
  homeCompatibilityRoute,
  business,
  order,
  console,
  auth,
  chatgpt,
  grok,
  gemini,
  claude,
  deepseek,
  kimi,
  mimo,
  qrart,
  luma,
  pika,
  kling,
  veo,
  sora,
  maestro,
  poivelle,
  digitalhuman,
  pixverse,
  flux,
  hailuo,
  minimax,
  suno,
  producer,
  acemusic,
  ...(isCapabilityAvailableOnBuild('nanobanana') ? [nanobanana] : []),
  openaiimage,
  seedream,
  qwenimage,
  seedance,
  grokvideo,
  omni,
  serp,
  wan,
  fish,
  webextrator,
  codingBridge,
  midjourney,
  distribution,
  download,
  settings,
  share,
  {
    // Standalone full-screen 404 — no header/footer chrome.
    path: '/:pathMatch(.*)*',
    name: ROUTE_NOT_FOUND,
    component: () => import('@/pages/error/NotFound.vue'),
    meta: { auth: false }
  }
];

// vite-ssg owns router creation (memory history at build, web history on the
// client). Guards attach to the per-app router inside the ViteSSG setup.
let activeRouter: Router | null = null;
export const setActiveRouter = (r: Router) => {
  activeRouter = r;
};
export const getActiveRouter = (): Router | null => activeRouter;

export function setupRouterGuards(router: Router) {
  router.onError((error) => {
    handleChunkLoadError(error);
  });

  router.beforeEach(async (to, from, next) => {
    // SSG build navigates the router to render each route; no cookies/i18n DOM
    // then, so skip the client-only guard body and just proceed.
    if (import.meta.env.SSR) {
      return next();
    }
    // A site-wide pin outranks the cookie (and therefore `?lang=`, which only
    // ever writes the cookie). Applied here rather than at boot because the
    // guard re-reads the cookie on every navigation.
    const forcedLocale = getForcedLocale(store.state.site);
    const locale = forcedLocale ?? getLocale(getCookie('LOCALE') || I18N_DEFAULT_LOCALE);
    await setI18nLanguage(locale);

    // Cross-site identity guard: handle `?user_id=<id>` query param attached by
    // outbound links from sibling sub-sites (auth / platform). See
    // `src/utils/crossSiteUser.ts` for the full contract.
    const decision = evaluateUserIdGuard(to);
    if (decision.kind === 'strip') {
      return next(decision.redirect);
    }
    if (decision.kind === 'mismatch') {
      // Helper has already triggered a full-page SSO redirect; abort.
      if (isIframeLoginEnabled() && !from.name) {
        const { user_id: _userId, ...query } = to.query;
        return next({ ...getDefaultRoute(), query, replace: true });
      }
      return next(false);
    }

    // Auth-required sections (console / distribution / settings / coding-bridge)
    // need a logged-in user. Guests are sent to login instead of landing on a
    // page whose data calls 401 and spins forever. The login flow preserves the
    // intended destination so they return here after authenticating.
    if (!store.getters.authenticated && requiresLogin(to.path)) {
      if (isNative() || isDesktop() || isIframeLoginEnabled()) {
        store.dispatch('login', { redirect: to.fullPath });
        if (!from.name) {
          return next({ ...getDefaultRoute(), query: to.query, replace: true });
        }
      } else {
        loginRedirect({ redirect: to.fullPath });
      }
      return next(false);
    }

    // Lazily register the per-app Vuex store module owned by this route. The
    // mapping is `meta.appName` → store module name (set in each
    // `src/router/<app>.ts`); routes without a per-app module (auth, console,
    // profile, distribution, download, site) skip this branch entirely.
    // Resolving the dynamic import here means the module's actions/mutations,
    // its operator(s) and its model bindings are only fetched the first time
    // the user navigates into that section of the app.
    for (const matched of to.matched) {
      const appName = matched.meta?.appName;
      if (typeof appName === 'string' && appName) {
        await ensureStoreModule(appName);
      }
    }

    return next();
  });

  router.afterEach((to) => {
    if (import.meta.env.SSR) {
      return;
    }
    trackSitePageView(to.fullPath);
    // Determine the route prefix (e.g., /chatgpt/conversations/123 → chatgpt)
    const prefix = to.path.split('/').filter(Boolean)[0]?.toLowerCase() || '';
    const capabilityName = (to.meta.modelGroup as IChatModelGroup | undefined)?.name || to.meta.appName;
    const capability = CAPABILITY_KEYS.find((key) => key === capabilityName);
    const seoData = routeSeoByPrefix.get(prefix) || (capability && routeSeoByPrefix.get(capability));

    if (seoData) {
      const title = capability
        ? resolveCapabilityPresentation(store.state.site, capability, seoData.title, '').displayName
        : seoData.title;
      updateSeo({
        title,
        description: seoData.description,
        keywords: seoData.keywords
      });
      // Use the current origin so the WebApplication schema URL reflects the
      // hostname the visitor is actually on (studio.acedata.cloud and its white-label subdomains).
      const origin = (typeof window !== 'undefined' && window.location?.origin) || 'https://studio.acedata.cloud';
      setWebApplicationSchema({
        name: title,
        description: seoData.description,
        url: `${origin}/${prefix}`,
        category: seoData.category
      });
    } else {
      resetSeo();
      setOrganization();
    }
  });
}

export * from './constants';
