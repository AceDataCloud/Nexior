<template>
  <span
    class="particle-sphere"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
    :data-renderer="ready ? 'canvas' : 'static'"
    :data-variant="variant"
    :data-speed="speed"
  >
    <svg v-if="!ready" viewBox="0 0 40 40" class="static-sphere">
      <circle
        v-for="(point, index) in staticPoints"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        :r="point.radius"
        :opacity="point.opacity"
        fill="currentColor"
      />
    </svg>
    <canvas ref="canvas" :class="{ ready }" />
  </span>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  createParticleRenderer,
  projectSphere,
  type ParticleRenderer,
  type ParticleOptions,
  type ParticleVariant
} from './particleSphereRenderer';

const props = withDefaults(
  defineProps<{ size?: number; animated?: boolean; variant?: ParticleVariant; speed?: number }>(),
  { size: 18, animated: true }
);
const preview = inject<ParticleOptions | undefined>('nexior-particle-preview', undefined);
const variant = computed(() => props.variant ?? preview?.variant ?? 'sphere');
const speed = computed(() => props.speed ?? preview?.speed ?? 1);
const staticPoints = computed(() => projectSphere(0, variant.value));
const canvas = ref<HTMLCanvasElement>();
const ready = ref(false);
let renderer: ParticleRenderer | undefined;
let observer: IntersectionObserver | undefined;
let media: MediaQueryList | undefined;
let themeObserver: MutationObserver | undefined;
let visible = true;
let frame = 0;
let lastFrame = 0;
let elapsed = 0;
let previousTime = 0;

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  previousTime = 0;
}
function draw(now: number) {
  frame = 0;
  if (!renderer) return;
  if (previousTime) elapsed += Math.min(now - previousTime, 100);
  previousTime = now;
  if (now - lastFrame >= 32) {
    renderStill();
    lastFrame = now;
  }
  frame = requestAnimationFrame(draw);
}
function sync() {
  stop();
  if (renderer && props.animated && !media?.matches && visible && !document.hidden) {
    frame = requestAnimationFrame(draw);
  }
}
function renderStill() {
  renderer?.draw(elapsed / 1000, getComputedStyle(canvas.value!).color, variant.value, speed.value);
}
function initialize() {
  renderer?.dispose();
  renderer = canvas.value
    ? createParticleRenderer(canvas.value, Math.min(props.size * Math.min(window.devicePixelRatio || 1, 2), 384))
    : undefined;
  ready.value = !!renderer;
  renderStill();
  sync();
}
function contextLost(event: Event) {
  event.preventDefault();
  stop();
  renderer = undefined;
  ready.value = false;
}
watch(() => props.animated, sync);
watch(() => props.size, initialize);
watch([variant, speed], renderStill);
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  canvas.value?.addEventListener('contextlost', contextLost);
  canvas.value?.addEventListener('contextrestored', initialize);
  if ('IntersectionObserver' in window && canvas.value) {
    observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(canvas.value);
  }
  themeObserver = new MutationObserver(() => {
    renderStill();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  initialize();
});
onBeforeUnmount(() => {
  stop();
  observer?.disconnect();
  themeObserver?.disconnect();
  media?.removeEventListener('change', sync);
  document.removeEventListener('visibilitychange', sync);
  canvas.value?.removeEventListener('contextlost', contextLost);
  canvas.value?.removeEventListener('contextrestored', initialize);
  renderer?.dispose();
});
</script>

<style scoped>
.particle-sphere {
  display: inline-block;
  position: relative;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
}
canvas,
.static-sphere {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
canvas {
  opacity: 0;
}
canvas.ready {
  opacity: 1;
}
</style>
