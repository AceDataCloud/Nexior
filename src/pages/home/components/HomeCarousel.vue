<template>
  <section
    class="home-carousel"
    :aria-label="$t('intro.home.carousel.label')"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="onFocusOut"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <div class="slides">
      <router-link
        v-for="(slide, index) in slides"
        :key="slide.id"
        :to="{ name: slide.routeName }"
        class="slide"
        :class="{ active: index === activeIndex }"
        :aria-hidden="index !== activeIndex"
        :tabindex="index === activeIndex ? 0 : -1"
      >
        <img
          v-if="slide.imageUrl"
          :src="slide.imageUrl"
          :alt="slide.title"
          :loading="index === 0 ? 'eager' : 'lazy'"
          decoding="async"
          :fetchpriority="index === 0 ? 'high' : 'auto'"
          :style="{ objectPosition: slide.focalPoint || 'center' }"
          @error="$emit('image-error', slide)"
        />
        <span v-else class="image-fallback"><img :src="slide.icon" alt="" /></span>
        <span class="shade" />
        <span class="copy">
          <span class="eyebrow">{{ slide.eyebrow }}</span>
          <strong>{{ slide.title }}</strong>
          <span class="description">{{ slide.description }}</span>
          <span class="action">{{ $t('intro.home.createNow') }} <span aria-hidden="true">→</span></span>
        </span>
      </router-link>
    </div>

    <template v-if="slides.length > 1">
      <button class="arrow previous" type="button" :aria-label="$t('intro.home.carousel.previous')" @click="previous">
        <span aria-hidden="true">‹</span>
      </button>
      <button class="arrow next" type="button" :aria-label="$t('intro.home.carousel.next')" @click="next">
        <span aria-hidden="true">›</span>
      </button>
      <div class="dots">
        <button
          v-for="(slide, index) in slides"
          :key="slide.id"
          type="button"
          :class="{ active: index === activeIndex }"
          :aria-label="$t('intro.home.carousel.goto', { number: index + 1, title: slide.title })"
          :aria-current="index === activeIndex ? 'true' : undefined"
          @click="goTo(index)"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ResolvedHomeBanner } from '../data';

const props = defineProps<{ slides: ResolvedHomeBanner[] }>();
defineEmits<{ 'image-error': [slide: ResolvedHomeBanner] }>();

const AUTOPLAY_MS = 5600;
const SWIPE_THRESHOLD = 45;
const activeIndex = ref(0);
const hovered = ref(false);
const focused = ref(false);
const hidden = ref(false);
const reducedMotion = ref(false);
const touchStartX = ref<number>();
let timer: number | undefined;
let motionQuery: MediaQueryList | undefined;

const paused = computed(
  () => hovered.value || focused.value || hidden.value || reducedMotion.value || props.slides.length < 2
);

function normalize(index: number): number {
  const count = props.slides.length;
  return count ? (index + count) % count : 0;
}

function goTo(index: number): void {
  activeIndex.value = normalize(index);
}

function next(): void {
  goTo(activeIndex.value + 1);
}

function previous(): void {
  goTo(activeIndex.value - 1);
}

function stopTimer(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}

function syncTimer(): void {
  stopTimer();
  if (!paused.value) timer = window.setInterval(next, AUTOPLAY_MS);
}

function onVisibility(): void {
  hidden.value = document.hidden;
}

function onMotionChange(event: MediaQueryListEvent): void {
  reducedMotion.value = event.matches;
}

function onFocusOut(event: FocusEvent): void {
  const currentTarget = event.currentTarget as HTMLElement;
  const nextTarget = event.relatedTarget as Node | null;
  focused.value = Boolean(nextTarget && currentTarget.contains(nextTarget));
}

function onTouchStart(event: TouchEvent): void {
  touchStartX.value = event.changedTouches[0]?.clientX;
}

function onTouchEnd(event: TouchEvent): void {
  if (touchStartX.value === undefined) return;
  const endX = event.changedTouches[0]?.clientX;
  if (endX === undefined) return;
  const delta = endX - touchStartX.value;
  if (Math.abs(delta) >= SWIPE_THRESHOLD) delta > 0 ? previous() : next();
  touchStartX.value = undefined;
}

watch(paused, syncTimer);
watch(
  () => props.slides.length,
  (count) => {
    if (activeIndex.value >= count) activeIndex.value = 0;
    syncTimer();
  }
);

onMounted(() => {
  hidden.value = document.hidden;
  document.addEventListener('visibilitychange', onVisibility);
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.value = motionQuery.matches;
  motionQuery.addEventListener('change', onMotionChange);
  syncTimer();
});

onBeforeUnmount(() => {
  stopTimer();
  document.removeEventListener('visibilitychange', onVisibility);
  motionQuery?.removeEventListener('change', onMotionChange);
});

defineExpose({ activeIndex, next, previous, goTo, hovered, focused });
</script>

<style lang="scss" scoped>
.home-carousel {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: clamp(340px, 30vw, 430px);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 18px;
  background: #0b1019;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.3);
}

.slides,
.slide,
.slide > img,
.image-fallback,
.shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.slide {
  opacity: 0;
  color: #fff;
  pointer-events: none;
  transition: opacity 0.55s ease;

  &.active {
    z-index: 1;
    opacity: 1;
    pointer-events: auto;
  }

  > img {
    object-fit: cover;
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: -4px;
  }
}

.image-fallback {
  display: grid;
  place-items: center;
  background: radial-gradient(circle, rgba(var(--app-brand-rgb), 0.22), transparent 45%), #0b1019;

  img {
    width: 100px;
    height: 100px;
    border-radius: 24px;
    object-fit: cover;
  }
}

.shade {
  background:
    linear-gradient(90deg, rgba(4, 8, 15, 0.9) 0%, rgba(4, 8, 15, 0.65) 38%, rgba(4, 8, 15, 0.08) 72%),
    linear-gradient(0deg, rgba(4, 8, 15, 0.5), transparent 45%);
}

.copy {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: clamp(34px, 5vw, 78px);
  display: flex;
  width: min(590px, 48%);
  flex-direction: column;
  align-items: flex-start;
  gap: 11px;
  transform: translateY(-50%);
  text-shadow: 0 3px 22px rgba(0, 0, 0, 0.75);

  strong {
    font-size: clamp(30px, 3.5vw, 56px);
    line-height: 1.06;
    letter-spacing: -0.035em;
  }
}

.eyebrow {
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  background: rgba(4, 8, 15, 0.34);
  font-size: 12px;
  font-weight: 750;
  backdrop-filter: blur(12px);
}

.description {
  color: rgba(255, 255, 255, 0.76);
  font-size: 15px;
  line-height: 1.6;
}

.action {
  margin-top: 5px;
  font-size: 14px;
  font-weight: 750;
}

.arrow {
  position: absolute;
  z-index: 3;
  top: 50%;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  color: #fff;
  background: rgba(5, 9, 17, 0.42);
  cursor: pointer;
  transform: translateY(-50%);
  backdrop-filter: blur(10px);

  span {
    margin-top: -2px;
    font-size: 30px;
    line-height: 1;
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

.previous {
  left: 16px;
}

.next {
  right: 16px;
}

.dots {
  position: absolute;
  z-index: 3;
  right: 0;
  bottom: 16px;
  left: 0;
  display: flex;
  justify-content: center;
  gap: 8px;

  button {
    width: 26px;
    height: 4px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.34);
    cursor: pointer;
    transition:
      width 0.2s ease,
      background-color 0.2s ease;

    &.active {
      width: 44px;
      background: #fff;
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 4px;
    }
  }
}

@media (max-width: 900px) {
  .home-carousel {
    height: clamp(300px, 44vw, 380px);
  }

  .copy {
    width: 62%;
  }
}

@media (max-width: 600px) {
  .home-carousel {
    height: 338px;
    min-height: 0;
    border-radius: 14px;
  }

  .copy {
    left: 22px;
    width: 72%;
    gap: 7px;

    strong {
      font-size: 27px;
    }
  }

  .description {
    display: -webkit-box;
    overflow: hidden;
    font-size: 13px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .arrow {
    top: auto;
    bottom: 13px;
    width: 36px;
    height: 36px;
    transform: none;
  }

  .previous {
    left: 14px;
  }

  .next {
    right: 14px;
  }

  .dots {
    bottom: 29px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .slide,
  .dots button {
    transition: none;
  }
}
</style>
