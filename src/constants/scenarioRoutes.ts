export const SCENARIO_VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'compact', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 }
] as const;

export type ScenarioOutput = 'audio' | 'image' | 'video' | 'workflow';

export interface ScenarioRouteManifestEntry {
  name: string;
  path: string;
  output: ScenarioOutput;
  auditVariants?: readonly string[];
}

// Approved visual-audit scope. Variants name UI branches to exercise; they are
// not URL segments and remain optional until a branch has a stable selector.
export const SCENARIO_ROUTES = [
  {
    name: 'fish',
    path: '/fish/tts',
    output: 'audio',
    auditVariants: ['text-to-speech', 'voice-cloning']
  },
  { name: 'fish-model', path: '/fish/model', output: 'audio' },
  {
    name: 'suno',
    path: '/suno',
    output: 'audio',
    auditVariants: ['simple', 'custom']
  },
  {
    name: 'producer',
    path: '/producer',
    output: 'audio',
    auditVariants: ['simple', 'custom']
  },
  { name: 'flux', path: '/flux', output: 'image' },
  { name: 'seedream', path: '/seedream', output: 'image' },
  { name: 'nanobanana', path: '/nanobanana', output: 'image' },
  { name: 'openai-image', path: '/openai-image', output: 'image' },
  {
    name: 'midjourney',
    path: '/midjourney',
    output: 'image',
    auditVariants: ['image-generation', 'video-generation', 'describe']
  },
  { name: 'luma', path: '/luma', output: 'video' },
  { name: 'sora', path: '/sora', output: 'video' },
  {
    name: 'kling',
    path: '/kling',
    output: 'video',
    auditVariants: ['video-generation', 'motion-control', 'talking-photo']
  },
  { name: 'hailuo', path: '/hailuo', output: 'video' },
  {
    name: 'veo',
    path: '/veo',
    output: 'video',
    auditVariants: ['video-generation', 'video-extension']
  },
  { name: 'seedance', path: '/seedance', output: 'video' },
  { name: 'wan', path: '/wan', output: 'video' },
  { name: 'pika', path: '/pika', output: 'video' },
  { name: 'pixverse', path: '/pixverse', output: 'video' },
  { name: 'grok-video', path: '/grok-video', output: 'video' },
  { name: 'omni', path: '/omni', output: 'video' },
  {
    name: 'digital-human',
    path: '/digital-human',
    output: 'workflow'
  },
  { name: 'maestro', path: '/maestro', output: 'workflow' }
] as const satisfies readonly ScenarioRouteManifestEntry[];
