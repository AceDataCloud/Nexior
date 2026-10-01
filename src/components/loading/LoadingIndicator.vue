<template>
  <span
    class="loading-indicator"
    :class="{ paused: options.paused }"
    :style="style"
    aria-hidden="true"
    :data-tool="options.tool"
  >
    <img v-if="svg" :key="options.tool" :src="svg" alt="" :width="size" :height="size" />
    <span v-else-if="options.tool === 'dot-animator'" class="adc-animator-spinner"
      ><span v-for="n in 9" :key="n"
    /></span>
    <span v-else-if="options.tool === 'ldrs'" class="adc-ldrs"
      ><span class="container"><span v-for="n in 16" :key="n" class="dot" /></span
    ></span>
    <span v-else-if="options.tool === 'css-loaders'" class="adc-css-dots" />
    <span v-else-if="options.tool === 'loading-io'" class="adc-io-ring"><span v-for="n in 4" :key="n" /></span>
    <span v-else-if="options.tool === 'piskel'" class="adc-piskel-frame"><span class="adc-piskel-sheet" /></span>
  </span>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import thinking from '@/assets/loading/thinking.svg?raw';
import stream from '@/assets/loading/stream.svg?raw';
import verify from '@/assets/loading/verify.svg?raw';
import svgator from '@/assets/loading/svgator.svg?raw';
import sprite from '@/assets/loading/piskel-sheet.png';
import { svgPreview, type LoadingOptions } from './catalog';
import './styles/animator.css';
import './styles/ldrs.scss';
import './styles/css-loaders.css';
import './styles/loading-io.css';

const props = defineProps({
  options: { type: Object as PropType<LoadingOptions>, required: true },
  stage: { type: String, default: 'waiting' }
});
const size = computed(() => Math.min(160, Math.max(16, props.options.size || 28)));
const style = computed(() => ({
  '--loader-size': `${size.value}px`,
  '--loader-speed': String(Math.min(2, Math.max(0.5, props.options.speed || 1))),
  '--loader-color': props.options.color || 'currentColor',
  '--uib-size': `${size.value}px`,
  '--uib-color': props.options.color || 'currentColor',
  '--uib-speed': `${1.5 / (props.options.speed || 1)}s`,
  '--piskel-sheet': `url("${sprite}")`
}));
const svg = computed(() => {
  if (props.options.tool === 'svgator') return svgPreview(svgator, props.options);
  if (props.options.tool !== 'dot-matrix') return undefined;
  return svgPreview(
    props.stage === 'complete' ? verify : props.stage === 'replying' ? stream : thinking,
    props.options
  );
});
</script>

<style>
.loading-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--loader-size);
  height: var(--loader-size);
  flex-shrink: 0;
  color: var(--loader-color);
  vertical-align: middle;
}
.loading-indicator img {
  display: block;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}
.loading-indicator.paused *,
.loading-indicator.paused *::before {
  animation-play-state: paused !important;
}
.adc-piskel-frame {
  width: var(--loader-size);
  height: var(--loader-size);
  overflow: hidden;
  display: block;
}
.adc-piskel-sheet {
  display: block;
  width: calc(var(--loader-size) * 4);
  height: var(--loader-size);
  background: var(--loader-color);
  mask-image: var(--piskel-sheet);
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  image-rendering: pixelated;
  animation: adc-piskel-frames calc(0.5s / var (--loader-speed)) steps(4) infinite;
}
@keyframes adc-piskel-frames {
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .loading-indicator *,
  .loading-indicator *::before {
    animation: none !important;
  }
}
</style>
