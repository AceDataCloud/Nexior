import { createRouter, createWebHistory } from 'vue-router';
import auth from './auth';
import console from './console';
import grok from './grok';
import gemini from './gemini';
import claude from './claude';
import deepseek from './deepseek';
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
import nanobanana from './nanobanana';
import seedream from './seedream';
import seedance from './seedance';
import site from './site';
import profile from './profile';

import { ROUTE_CHATGPT_CONVERSATION_NEW } from './constants';
import { getCookie } from 'typescript-cookie';
import { I18N_DEFAULT_LOCALE } from '@/constants/i18n';
import { getLocale, setI18nLanguage } from '@/i18n';
import { updateSeo, setWebApplicationSchema, setOrganization, resetSeo } from '@/utils/seo';

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
  suno: {
    title: 'Suno',
    description: 'Create AI music with Suno — generate songs, lyrics, and music from text descriptions.',
    keywords: ['Suno', 'AI Music', 'Music Generation', 'AI Song', 'Text to Music'],
    category: 'AI Music Generation'
  },
  distribution: {
    title: 'Affiliate',
    description: 'Join the Ace Data Cloud affiliate program — earn commissions by referring AI services.',
    keywords: ['Affiliate', 'Referral', 'Earn', 'Commission'],
    category: 'Business'
  }
};

const routes = [
  {
    path: '/',
    redirect: { name: ROUTE_CHATGPT_CONVERSATION_NEW }
  },
  console,
  auth,
  chatgpt,
  grok,
  gemini,
  claude,
  deepseek,
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
  nanobanana,
  seedream,
  seedance,
  midjourney,
  distribution,
  download,
  site,
  profile
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (_to, _from, next) => {
  const locale = getLocale(getCookie('LOCALE') || I18N_DEFAULT_LOCALE);
  await setI18nLanguage(locale);
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
    setWebApplicationSchema({
      name: seoData.title,
      description: seoData.description,
      url: `https://hub.acedata.cloud/${prefix}`,
      category: seoData.category
    });
  } else {
    resetSeo();
    setOrganization();
  }
});

export default router;

export * from './constants';
