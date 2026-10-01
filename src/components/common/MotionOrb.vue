<template>
  <span
    class="motion-orb"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
    :data-renderer="ready ? 'webgl' : 'static'"
  >
    <canvas ref="canvas" :class="{ ready }" />
  </span>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createOrbRenderer, type OrbRenderer } from './motionOrbRenderer';

const props = withDefaults(defineProps<{ size?: number; animated?: boolean }>(), { size: 32, animated: true });
const motionEnabled = inject('nexior-motion-enabled', ref(true));
const canvas = ref<HTMLCanvasElement>();
const ready = ref(false);
let renderer: OrbRenderer | undefined;
let observer: IntersectionObserver | undefined;
let media: MediaQueryList | undefined;
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
    renderer.draw(elapsed / 1000);
    lastFrame = now;
  }
  frame = requestAnimationFrame(draw);
}
function sync() {
  stop();
  if (renderer && props.animated && motionEnabled.value && !media?.matches && visible && !document.hidden) {
    frame = requestAnimationFrame(draw);
  }
}
function initialize() {
  renderer?.dispose();
  renderer = canvas.value
    ? createOrbRenderer(canvas.value, Math.min(props.size * Math.min(window.devicePixelRatio || 1, 2), 384))
    : undefined;
  ready.value = !!renderer;
  renderer?.draw(elapsed / 1000);
  sync();
}
function contextLost(event: Event) {
  event.preventDefault();
  stop();
  renderer = undefined;
  ready.value = false;
}
watch(() => [props.animated, motionEnabled.value], sync);
watch(() => props.size, initialize);
onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  canvas.value?.addEventListener('webglcontextlost', contextLost);
  canvas.value?.addEventListener('webglcontextrestored', initialize);
  if ('IntersectionObserver' in window && canvas.value) {
    observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(canvas.value);
  }
  initialize();
});
onBeforeUnmount(() => {
  stop();
  observer?.disconnect();
  media?.removeEventListener('change', sync);
  document.removeEventListener('visibilitychange', sync);
  canvas.value?.removeEventListener('webglcontextlost', contextLost);
  canvas.value?.removeEventListener('webglcontextrestored', initialize);
  renderer?.dispose();
});
</script>

<style scoped>
.motion-orb {
  display: inline-block;
  position: relative;
  flex-shrink: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 28%, #f6f2ff 0%, #c7b2ef 16%, #7862b2 42%, #312651 66%, transparent 72%);
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
}
canvas.ready {
  opacity: 1;
}
.motion-orb:has(canvas.ready) {
  background: none;
}
</style>
