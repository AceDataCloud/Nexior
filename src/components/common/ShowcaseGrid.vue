<template>
  <section class="dashboard-section showcase-section" :class="{ compact, masonry }" :aria-label="ariaLabel">
    <slot name="heading">
      <div v-if="title" class="section-heading">
        <div>
          <span v-if="eyebrow">{{ eyebrow }}</span>
          <h2>{{ title }}</h2>
        </div>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </slot>
    <div class="showcase-grid">
      <article
        v-for="item in items"
        :key="item.id"
        :ref="(element) => rememberCard(item.id, element)"
        class="showcase-card"
        :class="[item.layout.toLowerCase(), { 'preview-playing': playingId === item.id }]"
        @mouseenter="item.mediaType === 'Video' && startPreview(item.id)"
        @mouseleave="item.mediaType === 'Video' && stopPreview(item.id)"
        @focusin="item.mediaType === 'Video' && startPreview(item.id)"
        @focusout="onFocusOut(item.id, $event)"
      >
        <img :src="item.posterUrl" :alt="item.altText" loading="lazy" decoding="async" />
        <video
          v-if="item.mediaType === 'Video' && item.previewUrl && !failedMedia.has(item.id)"
          :ref="(element) => rememberMedia(item.id, element)"
          :src="loadedMediaIds.has(item.id) ? item.previewUrl : undefined"
          muted
          loop
          playsinline
          :preload="loadedMediaIds.has(item.id) ? 'metadata' : 'none'"
          :aria-label="$t('intro.home.showcase.preview', { title: item.title })"
          @error="onMediaError(item.id)"
        />
        <audio
          v-else-if="item.mediaType === 'Audio' && item.previewUrl && !failedMedia.has(item.id)"
          :ref="(element) => rememberMedia(item.id, element)"
          :src="loadedMediaIds.has(item.id) ? item.previewUrl : undefined"
          :preload="loadedMediaIds.has(item.id) ? 'metadata' : 'none'"
          loop
          @error="onMediaError(item.id)"
        />
        <span class="shade" />
        <button
          v-if="detailPreview"
          type="button"
          class="detail-trigger"
          :aria-label="$t('intro.home.showcase.preview', { title: item.title })"
          @click="$emit('select', item)"
        />
        <button
          v-if="item.mediaType === 'Audio' || reducedMotion"
          type="button"
          class="preview-button"
          :aria-label="
            $t(playingId === item.id ? 'intro.home.showcase.pause' : 'intro.home.showcase.play', { title: item.title })
          "
          @click="togglePreview(item.id)"
        >
          {{ playingId === item.id ? 'Ⅱ' : '▶' }}
        </button>
        <div class="showcase-copy">
          <span v-if="showCapability" class="capability">
            <img :src="item.icon" alt="" @error="$emit('icon-error', item)" />
            {{ item.name }}
          </span>
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
          <router-link :to="{ name: item.routeName, query: { showcase: item.id } }" class="create-link">
            {{ $t('intro.home.showcase.createSimilar') }} <span aria-hidden="true">→</span>
          </router-link>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import type { ResolvedShowcase } from '@/models';

withDefaults(
  defineProps<{
    items: ResolvedShowcase[];
    title?: string;
    eyebrow?: string;
    subtitle?: string;
    ariaLabel?: string;
    showCapability?: boolean;
    compact?: boolean;
    masonry?: boolean;
    detailPreview?: boolean;
  }>(),
  {
    title: '',
    eyebrow: '',
    subtitle: '',
    ariaLabel: '',
    showCapability: true,
    compact: false,
    masonry: false,
    detailPreview: false
  }
);
defineEmits<{ 'icon-error': [item: ResolvedShowcase]; select: [item: ResolvedShowcase] }>();

const media = new Map<string, HTMLMediaElement>();
const cards = new Map<string, HTMLElement>();
const failedMedia = ref(new Set<string>());
const loadedMediaIds = ref(new Set<string>());
const playingId = ref<string>();
const requestedPlayingId = ref<string>();
const reducedMotion = ref(false);
let motionQuery: MediaQueryList | undefined;
let observer: IntersectionObserver | undefined;

function rememberCard(id: string, element: Element | ComponentPublicInstance | null): void {
  const previous = cards.get(id);
  if (previous) observer?.unobserve(previous);
  if (element instanceof HTMLElement) {
    cards.set(id, element);
    observer?.observe(element);
  } else cards.delete(id);
}

function rememberMedia(id: string, element: Element | ComponentPublicInstance | null): void {
  if (element instanceof HTMLMediaElement) media.set(id, element);
  else media.delete(id);
}

async function ensureMediaLoaded(id: string): Promise<HTMLMediaElement | undefined> {
  if (!loadedMediaIds.value.has(id)) {
    loadedMediaIds.value = new Set(loadedMediaIds.value).add(id);
    await nextTick();
  }
  return media.get(id);
}

function stopAll(except?: string): void {
  if (!except) requestedPlayingId.value = undefined;
  for (const [id, element] of media) {
    if (id === except) continue;
    element.pause();
    if (element instanceof HTMLVideoElement) element.currentTime = 0;
  }
  if (playingId.value !== except) playingId.value = undefined;
}

async function startPreview(id: string, force = false): Promise<void> {
  if (reducedMotion.value && !force) return;
  requestedPlayingId.value = id;
  const element = await ensureMediaLoaded(id);
  if (!element || requestedPlayingId.value !== id) return;
  stopAll(id);
  try {
    await element.play();
    if (requestedPlayingId.value === id) playingId.value = id;
    else element.pause();
  } catch {
    if (requestedPlayingId.value === id) requestedPlayingId.value = undefined;
    playingId.value = undefined;
  }
}

function stopPreview(id: string): void {
  if (requestedPlayingId.value === id) requestedPlayingId.value = undefined;
  const element = media.get(id);
  element?.pause();
  if (element instanceof HTMLVideoElement) element.currentTime = 0;
  if (playingId.value === id) playingId.value = undefined;
}

function togglePreview(id: string): void {
  if (playingId.value === id) stopPreview(id);
  else void startPreview(id, true);
}

function onMediaError(id: string): void {
  failedMedia.value = new Set(failedMedia.value).add(id);
  stopPreview(id);
}

function onFocusOut(id: string, event: FocusEvent): void {
  const root = event.currentTarget as HTMLElement;
  const next = event.relatedTarget as Node | null;
  if (!next || !root.contains(next)) stopPreview(id);
}

function onVisibility(): void {
  if (document.hidden) stopAll();
}

function onMotionChange(event: MediaQueryListEvent): void {
  reducedMotion.value = event.matches;
  if (event.matches) stopAll();
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.value = motionQuery.matches;
  motionQuery.addEventListener('change', onMotionChange);
  document.addEventListener('visibilitychange', onVisibility);
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = [...cards].find(([, element]) => element === entry.target)?.[0];
          if (!id) continue;
          if (entry.isIntersecting) loadedMediaIds.value = new Set(loadedMediaIds.value).add(id);
          else stopPreview(id);
        }
      },
      { rootMargin: '300px 0px' }
    );
    for (const card of cards.values()) observer.observe(card);
  }
});

onBeforeUnmount(() => {
  stopAll();
  observer?.disconnect();
  motionQuery?.removeEventListener('change', onMotionChange);
  document.removeEventListener('visibilitychange', onVisibility);
});

defineExpose({ playingId, loadedMediaIds, startPreview, stopPreview, togglePreview, reducedMotion });
</script>

<style lang="scss" scoped>
.dashboard-section {
  padding-top: 34px;
}

.showcase-section {
  padding-bottom: 34px;

  &.compact {
    padding-top: 0;
    padding-bottom: 18px;
  }

  &.masonry {
    .showcase-grid {
      display: block;
      columns: 300px;
      column-gap: 13px;
    }

    .showcase-card {
      width: 100%;
      margin-bottom: 13px;
      break-inside: avoid;

      &.landscape {
        aspect-ratio: 16 / 9;
      }

      &.square {
        aspect-ratio: 1;
      }

      &.portrait {
        aspect-ratio: 3 / 4;
      }
    }
  }
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 16px;

  > div > span {
    color: var(--el-color-primary);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h2 {
    margin: 5px 0 0;
    font-size: 25px;
    letter-spacing: -0.02em;
  }

  p {
    max-width: 470px;
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.55;
  }
}

.showcase-grid {
  display: grid;
  grid-auto-flow: dense;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 185px;
  gap: 13px;
}

.showcase-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: 15px;
  color: #fff;
  background: #0d131d;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  &.landscape {
    grid-column: span 2;
  }

  &.portrait {
    grid-row: span 2;
  }

  > img,
  > video,
  .shade {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  > img,
  > video {
    object-fit: cover;
  }

  > video {
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  &:hover > video,
  &:focus-within > video {
    opacity: 1;
  }

  .shade {
    background: linear-gradient(180deg, rgba(4, 8, 15, 0.02) 25%, rgba(4, 8, 15, 0.92) 100%);
    pointer-events: none;
  }
}

.detail-trigger {
  position: absolute;
  z-index: 1;
  inset: 0;
  border: 0;
  border-radius: inherit;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 0;
    box-shadow: inset 0 0 0 3px var(--el-color-primary);
  }
}

.preview-button {
  position: absolute;
  z-index: 2;
  top: 13px;
  right: 13px;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  color: #fff;
  background: rgba(4, 8, 15, 0.5);
  cursor: pointer;
  backdrop-filter: blur(10px);

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

.showcase-copy {
  position: absolute;
  z-index: 2;
  right: 16px;
  bottom: 15px;
  left: 16px;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.8);
  pointer-events: none;

  > strong {
    display: block;
    margin-top: 7px;
    font-size: 18px;
  }

  > p {
    display: -webkit-box;
    overflow: hidden;
    margin: 5px 0 8px;
    color: rgba(255, 255, 255, 0.74);
    font-size: 12px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.capability {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 750;

  img {
    width: 25px;
    height: 25px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.92);
    object-fit: cover;
  }
}

.create-link {
  position: relative;
  z-index: 3;
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  pointer-events: auto;

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 3px;
    border-radius: 4px;
  }
}

@media (max-width: 1120px) {
  .showcase-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .showcase-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .dashboard-section {
    padding-top: 25px;
  }

  .showcase-section {
    padding-bottom: 24px;
  }

  .section-heading {
    display: block;

    p {
      margin-top: 7px;
    }
  }

  .showcase-grid {
    grid-auto-rows: 190px;
    gap: 10px;
  }

  .showcase-card {
    border-radius: 13px;

    &.landscape {
      grid-column: span 2;
    }
  }

  .showcase-copy > p {
    display: none;
  }
}

@media (max-width: 430px) {
  .showcase-grid {
    grid-template-columns: 1fr;
  }

  .showcase-card.landscape {
    grid-column: span 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .showcase-card:not(.preview-playing) > video {
    opacity: 0;
  }

  .showcase-card > video {
    transition: none;
  }
}
</style>
