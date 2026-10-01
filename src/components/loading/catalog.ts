import { ref, type App, type InjectionKey, type Ref } from 'vue';

export const loadingTools = [
  { id: 'dot-matrix', name: 'dot/matrix', source: 'https://dot-matrix-animations.vercel.app/', format: 'SVG' },
  {
    id: 'dot-animator',
    name: 'Dot Matrix Animator',
    source: 'https://dot-matrix-animation.vercel.app/',
    format: 'HTML / CSS'
  },
  { id: 'ldrs', name: 'LDRS', source: 'https://uiball.com/ldrs/', format: 'HTML / CSS' },
  { id: 'css-loaders', name: 'CSS Loaders', source: 'https://css-loaders.com/dots/', format: 'CSS' },
  { id: 'loading-io', name: 'loading.io', source: 'https://loading.io/css/', format: 'CSS · CC0' },
  { id: 'piskel', name: 'Piskel', source: 'https://www.piskelapp.com/', format: 'PNG spritesheet' },
  { id: 'svgator', name: 'SVGator', source: 'https://www.svgator.com/', format: 'SVG · CSS export' }
] as const;

export type LoadingTool = (typeof loadingTools)[number]['id'];
export interface LoadingOptions {
  tool: LoadingTool;
  size?: number;
  speed?: number;
  color?: string;
  paused?: boolean;
}
export const loadingPreviewKey: InjectionKey<Ref<LoadingOptions>> = Symbol('loading-preview');
export function isLoadingTool(value: unknown): value is LoadingTool {
  return loadingTools.some((tool) => tool.id === value);
}
export function svgPreview(source: string, options: LoadingOptions): string {
  const speed = Math.min(2, Math.max(0.5, options.speed || 1));
  const color = /^#[0-9a-f]{6}$/i.test(options.color || '') ? options.color! : '#71b847';
  let svg = source
    .replace(/#ffffff/gi, color)
    .replace(/(?<![\w.])(\d*\.?\d+)(ms|s)\b/g, (_, value, unit) => `${Number(value) / speed}${unit}`);
  svg = svg.replace(
    '</style>',
    '@media(prefers-reduced-motion:reduce){*{animation:none!important}.l{opacity:.55!important}}</style>'
  );
  if (options.paused) svg = svg.replace('</style>', '*{animation:none!important}.l{opacity:.55!important}</style>');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function previewOptions(search: string): LoadingOptions | undefined {
  const params = new URLSearchParams(search);
  const tool = params.get('loading_tool');
  if (!isLoadingTool(tool)) return undefined;
  return { tool, size: 28, speed: 1, color: '#71b847', paused: false };
}
export function installLoadingPreview(app: App): void {
  const options = previewOptions(location.search);
  if (options) app.provide(loadingPreviewKey, ref(options));
}
