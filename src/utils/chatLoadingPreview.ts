// A read-only fixture inside the existing route, compiled out of normal builds.
export function getChatLoadingPreviewMode(): 'waiting' | 'thinking' | undefined {
  if (import.meta.env.VITE_CHAT_LOADING_PREVIEW !== 'true' || typeof window === 'undefined') return;
  if (window.location.pathname !== '/chatgpt/conversations') return;
  const mode = new URLSearchParams(window.location.search).get('loading_preview');
  return mode === 'waiting' || mode === 'thinking' ? mode : undefined;
}
