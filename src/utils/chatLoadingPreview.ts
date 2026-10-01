import type { ParticleOptions } from '@/components/common/particleSphereRenderer';

// A read-only fixture inside the existing route, compiled out of normal builds.
export function getChatLoadingPreviewMode(): 'waiting' | 'thinking' | undefined {
  if (import.meta.env.VITE_CHAT_LOADING_PREVIEW !== 'true' || typeof window === 'undefined') return;
  if (window.location.pathname !== '/chatgpt/conversations') return;
  const mode = new URLSearchParams(window.location.search).get('loading_preview');
  return mode === 'waiting' || mode === 'thinking' ? mode : undefined;
}

export function getChatParticlePreviewOptions(): ParticleOptions {
  const defaults: ParticleOptions = { variant: 'sphere', speed: 1 };
  if (!getChatLoadingPreviewMode()) return defaults;
  const query = new URLSearchParams(window.location.search);
  const variant = query.get('particle_style');
  const speed = Number(query.get('particle_speed'));
  return {
    variant: variant === 'orbit' || variant === 'helix' ? variant : 'sphere',
    speed: speed === 2 || speed === 4 ? speed : 1
  };
}
