import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import auth from './auth';
import console from './console';
import grok from './grok';
import gemini from './gemini';
import claude from './claude';
import deepseek from './deepseek';
import kimi from './kimi';
import chatgpt from './chatgpt';
import midjourney from './midjourney';
import distribution from './distribution';
import download from './download';
import qrart from './qrart';
import luma from './luma';
import pika from './pika';
import kling from './kling';
import veo from './veo';
import sora from './sora';
import pixverse from './pixverse';
import flux from './flux';
import hailuo from './hailuo';
import headshots from './headshots';
import suno from './suno';
import producer from './producer';
import nanobanana from './nanobanana';
import openaiimage from './openaiimage';
import seedream from './seedream';
import seedance from './seedance';
import serp from './serp';
import wan from './wan';
import site from './site';
import profile from './profile';

import {
  ROUTE_CHATGPT_CONVERSATION_NEW,
  ROUTE_DEEPSEEK_CONVERSATION_NEW,
  ROUTE_GROK_CONVERSATION_NEW,
  ROUTE_GEMINI_CONVERSATION_NEW,
  ROUTE_CLAUDE_CONVERSATION_NEW,
  ROUTE_KIMI_CONVERSATION_NEW,
  ROUTE_MIDJOURNEY_INDEX,
  ROUTE_FLUX_INDEX,
  ROUTE_NANOBANANA_INDEX,
  ROUTE_OPENAIIMAGE_INDEX,
  ROUTE_SEEDREAM_INDEX,
  ROUTE_SUNO_INDEX,
  ROUTE_PRODUCER_INDEX,
  ROUTE_SEEDANCE_INDEX,
  ROUTE_LUMA_INDEX,
  ROUTE_HAILUO_INDEX,
  ROUTE_KLING_INDEX,
  ROUTE_VEO_INDEX,
  ROUTE_SORA_INDEX,
  ROUTE_PIXVERSE_INDEX,
  ROUTE_WAN_INDEX,
  ROUTE_SERP_INDEX,
  ROUTE_NOT_FOUND
} from './constants';
import { getCookie } from 'typescript-cookie';
import { I18N_DEFAULT_LOCALE } from '@/constants/i18n';
import { getLocale, setI18nLanguage } from '@/i18n';
import { updateSeo, setWebApplicationSchema, setOrganization, resetSeo } from '@/utils/seo';
import { ensureStoreModule } from '@/store/lazy';
import { evaluateUserIdGuard } from '@/utils/crossSiteUser';

// SEO metadata per route path prefix
const ROUTE_SEO: Record<string, { title: string; description: string; keywords: string[]; category: string }> = {
  chatgpt: {
    title: 'ChatGPT',
    description: 'Chat with ChatGPT AI — powered by OpenAI GPT models. Free AI conversations with the latest GPT.',
    keywords: ['ChatGPT', 'GPT', 'AI Chat', 'OpenAI'],
    category: 'AI Chat'
  },
  claude: {
    title: 'Claude',
    description: 'Chat with Claude AI — powered by Anthropic. Intelligent AI conversations with Claude.',
    keywords: ['Claude', 'Anthropic', 'AI Chat', 'Claude AI'],
    category: 'AI Chat'
  },
  gemini: {
    title: 'Gemini',
    description: 'Chat with Gemini AI — powered by Google. Advanced AI conversations with Gemini.',
    keywords: ['Gemini', 'Google AI', 'AI Chat', 'Gemini AI'],
    category: 'AI Chat'
  },
  grok: {
    title: 'Grok',
    description: 'Chat with Grok AI — powered by xAI. Real-time AI conversations with Grok.',
    keywords: ['Grok', 'xAI', 'AI Chat', 'Grok AI'],
    category: 'AI Chat'
  },
  deepseek: {
    title: 'DeepSeek',
    description: 'Chat with DeepSeek AI — advanced reasoning and coding AI assistant.',
    keywords: ['DeepSeek', 'AI Chat', 'AI Coding', 'DeepSeek AI'],
    category: 'AI Chat'
  },
  kimi: {
    title: 'Kimi',
    description: 'Chat with Kimi AI — advanced AI conversations powered by Moonshot AI.',
    keywords: ['Kimi', 'Moonshot AI', 'AI Chat', 'Kimi AI'],
    category: 'AI Chat'
  },
  midjourney: {
    title: 'Midjourney',
    description:
      'Generate stunning AI images with Midjourney — create art, illustrations, and designs with text prompts.',
    keywords: ['Midjourney', 'AI Image', 'AI Art', 'Image Generation', 'Text to Image'],
    category: 'AI Image Generation'
  },
  flux: {
    title: 'Flux',
    description: 'Generate AI images with Flux — fast, high-quality image generation from text descriptions.',
    keywords: ['Flux', 'AI Image', 'Image Generation', 'Text to Image'],
    category: 'AI Image Generation'
  },
  qrart: {
    title: 'QR Art',
    description: 'Generate artistic QR codes with AI — beautiful, scannable QR code art.',
    keywords: ['QR Art', 'AI QR Code', 'QR Code Generator', 'Artistic QR'],
    category: 'AI Image Generation'
  },
  headshots: {
    title: 'AI Headshots',
    description: 'Generate professional AI headshots — perfect for LinkedIn, resumes, and business profiles.',
    keywords: ['AI Headshots', 'Professional Photos', 'AI Portrait', 'LinkedIn Photo'],
    category: 'AI Image Generation'
  },
  nanobanana: {
    title: 'NanoBanana',
    description: 'Generate and edit AI images with NanoBanana — powered by Gemini for creative image generation.',
    keywords: ['NanoBanana', 'AI Image', 'Gemini', 'Image Editing'],
    category: 'AI Image Generation'
  },
  'openai-image': {
    title: 'OpenAI Image',
    description: 'Generate and edit AI images with OpenAI image models including gpt-image-1.5 and gpt-image-2.',
    keywords: ['OpenAI Image', 'gpt-image-2', 'Image Editing', 'AI Image'],
    category: 'AI Image Generation'
  },
  seedream: {
    title: 'Seedream',
    description: 'Generate AI images with Seedream — high-quality image generation by ByteDance.',
    keywords: ['Seedream', 'AI Image', 'ByteDance', 'Image Generation'],
    category: 'AI Image Generation'
  },
  luma: {
    title: 'Luma',
    description: 'Generate AI videos with Luma Dream Machine — create stunning videos from text and images.',
    keywords: ['Luma', 'AI Video', 'Dream Machine', 'Video Generation', 'Text to Video'],
    category: 'AI Video Generation'
  },
  sora: {
    title: 'Sora',
    description: 'Generate AI videos with OpenAI Sora — create realistic videos from text descriptions.',
    keywords: ['Sora', 'OpenAI', 'AI Video', 'Video Generation', 'Text to Video'],
    category: 'AI Video Generation'
  },
  veo: {
    title: 'Veo',
    description: 'Generate AI videos with Google Veo — high-quality video generation from text prompts.',
    keywords: ['Veo', 'Google', 'AI Video', 'Video Generation'],
    category: 'AI Video Generation'
  },
  pika: {
    title: 'Pika',
    description: 'Generate AI videos with Pika — creative video generation and editing with AI.',
    keywords: ['Pika', 'AI Video', 'Video Generation', 'Video Editing'],
    category: 'AI Video Generation'
  },
  kling: {
    title: 'Kling',
    description: 'Generate AI videos with Kling — high-quality video generation by Kuaishou.',
    keywords: ['Kling', 'AI Video', 'Kuaishou', 'Video Generation'],
    category: 'AI Video Generation'
  },
  pixverse: {
    title: 'Pixverse',
    description: 'Generate AI videos with Pixverse — creative video generation from text and images.',
    keywords: ['Pixverse', 'AI Video', 'Video Generation'],
    category: 'AI Video Generation'
  },
  hailuo: {
    title: 'Hailuo',
    description: 'Generate AI videos with Hailuo (MiniMax) — expressive video generation from text.',
    keywords: ['Hailuo', 'MiniMax', 'AI Video', 'Video Generation'],
    category: 'AI Video Generation'
  },
  seedance: {
    title: 'Seedance',
    description: 'Generate AI dance videos with Seedance — AI-powered dance video generation by ByteDance.',
    keywords: ['Seedance', 'AI Video', 'Dance Video', 'ByteDance'],
    category: 'AI Video Generation'
  },
  wan: {
    title: 'Wan',
    description: 'Generate AI videos with Wan — high-quality video generation by Tongyi Wanxiang.',
    keywords: ['Wan', 'Tongyi', 'AI Video', 'Video Generation'],
    category: 'AI Video Generation'
  },
  suno: {
    title: 'Suno',
    description: 'Create AI music with Suno — generate songs, lyrics, and music from text descriptions.',
    keywords: ['Suno', 'AI Music', 'Music Generation', 'AI Song', 'Text to Music'],
    category: 'AI Music Generation'
  },
  producer: {
    title: 'Producer',
    description: 'Create AI music with Producer — generate songs, lyrics, and music with FUZZ models.',
    keywords: ['Producer', 'AI Music', 'Music Generation', 'FUZZ', 'AI Song'],
    category: 'AI Music Generation'
  },
  distribution: {
    title: 'Affiliate',
    description: 'Join the Ace Data Cloud affiliate program — earn commissions by referring AI services.',
    keywords: ['Affiliate', 'Referral', 'Earn', 'Commission'],
    category: 'Business'
  },
  serp: {
    title: 'Search',
    description:
      'Search the web with Google — powered by SERP API. Get organic results, knowledge graphs, images, and more.',
    keywords: ['Search', 'Google Search', 'SERP', 'Web Search'],
    category: 'Web Search'
  }
};

// Map every routeable feature key to the route name it should land on.
// Note: this map only declares "this feature has a landing page". The order
// of the user's default route is taken from the site's `features` config
// (insertion order returned by the API), NOT from this map — so operators
// can control which feature greets new visitors by ordering site.features.
const FEATURE_ROUTE_NAME: Record<string, string> = {
  chatgpt: ROUTE_CHATGPT_CONVERSATION_NEW,
  deepseek: ROUTE_DEEPSEEK_CONVERSATION_NEW,
  grok: ROUTE_GROK_CONVERSATION_NEW,
  gemini: ROUTE_GEMINI_CONVERSATION_NEW,
  claude: ROUTE_CLAUDE_CONVERSATION_NEW,
  kimi: ROUTE_KIMI_CONVERSATION_NEW,
  midjourney: ROUTE_MIDJOURNEY_INDEX,
  flux: ROUTE_FLUX_INDEX,
  nanobanana: ROUTE_NANOBANANA_INDEX,
  openaiimage: ROUTE_OPENAIIMAGE_INDEX,
  seedream: ROUTE_SEEDREAM_INDEX,
  suno: ROUTE_SUNO_INDEX,
  producer: ROUTE_PRODUCER_INDEX,
  seedance: ROUTE_SEEDANCE_INDEX,
  luma: ROUTE_LUMA_INDEX,
  hailuo: ROUTE_HAILUO_INDEX,
  kling: ROUTE_KLING_INDEX,
  veo: ROUTE_VEO_INDEX,
  sora: ROUTE_SORA_INDEX,
  pixverse: ROUTE_PIXVERSE_INDEX,
  wan: ROUTE_WAN_INDEX,
  serp: ROUTE_SERP_INDEX
};

const getDefaultRoute = (): { name: string } => {
  const features = (store.state.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
  // Walk site.features in the order the API returned them and pick the
  // first enabled feature that maps to a known landing route.
  for (const key of Object.keys(features)) {
    if (!features[key]?.enabled) continue;
    const name = FEATURE_ROUTE_NAME[key];
    // IMPORTANT: must return { name } — returning a bare string makes
    // vue-router treat it as a *path*, which would navigate to e.g.
    // /chatgpt-conversation-new (the route name) instead of the actual
    // path /chatgpt/conversations.
    if (name) return { name };
  }
  // Fallback: if no enabled feature has a landing route, use chatgpt.
  return { name: ROUTE_CHATGPT_CONVERSATION_NEW };
};

const routes = [
  {
    path: '/',
    redirect: () => getDefaultRoute()
  },
  {
    path: '/chat/oauth/callback',
    name: 'oauth-callback',
    component: () => import('@/pages/chat/OAuthCallback.vue'),
    meta: { auth: false }
  },
  console,
  auth,
  chatgpt,
  grok,
  gemini,
  claude,
  deepseek,
  kimi,
  qrart,
  luma,
  pika,
  kling,
  veo,
  sora,
  pixverse,
  flux,
  hailuo,
  headshots,
  suno,
  producer,
  nanobanana,
  openaiimage,
  seedream,
  seedance,
  serp,
  wan,
  midjourney,
  distribution,
  download,
  site,
  profile,
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NOT_FOUND,
    component: () => import('@/layouts/Index.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/error/NotFound.vue'),
        meta: { auth: false }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => {
  const locale = getLocale(getCookie('LOCALE') || I18N_DEFAULT_LOCALE);
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
  // Determine the route prefix (e.g., /chatgpt/conversations/123 → chatgpt)
  const prefix = to.path.split('/').filter(Boolean)[0] || '';
  const seoData = ROUTE_SEO[prefix];

  if (seoData) {
    updateSeo({
      title: seoData.title,
      description: seoData.description,
      keywords: seoData.keywords
    });
    // Use the current origin so the WebApplication schema URL reflects the
    // hostname the visitor is actually on (studio.acedata.cloud, hub.acedata.cloud, etc.).
    const origin = (typeof window !== 'undefined' && window.location?.origin) || 'https://studio.acedata.cloud';
    setWebApplicationSchema({
      name: seoData.title,
      description: seoData.description,
      url: `${origin}/${prefix}`,
      category: seoData.category
    });
  } else {
    resetSeo();
    setOrganization();
  }
});

export default router;

export * from './constants';
