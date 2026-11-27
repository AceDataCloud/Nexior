<template>
  <div v-if="assets.length" class="tripo-results">
    <article v-for="asset in assets" :key="asset.url" class="tripo-result">
      <component
        :is="'model-viewer'"
        v-if="active === asset.url"
        :src="asset.url"
        :alt="asset.format"
        :poster="asset.poster"
        camera-controls
        touch-action="pan-y"
        @error="onPreviewError"
      />
      <button v-else-if="asset.format === 'GLB'" type="button" class="preview" @click="show(asset.url)">
        <img v-if="asset.poster" :src="asset.poster" alt="" loading="lazy" />
        <span>{{ $t('common.button.preview') }} · GLB</span>
      </button>
      <span v-if="failed === asset.url" role="status">{{ $t('common.message.mediaPreviewUnavailable') }}</span>
      <a :href="asset.url" target="_blank" rel="noopener noreferrer" download
        >{{ $t('common.button.download') }} · {{ asset.format }}</a
      >
    </article>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { tripoAssets } from './tripoAssets';
const props = defineProps<{ output?: string }>();
const assets = computed(() => tripoAssets(props.output));
const active = ref('');
const failed = ref('');
let requested = '';
async function show(url: string) {
  requested = url;
  failed.value = '';
  try {
    await import('@google/model-viewer');
    if (requested === url) active.value = url;
  } catch {
    if (requested === url) failed.value = url;
  }
}
function onPreviewError() {
  failed.value = active.value;
  active.value = '';
}
</script>
<style scoped>
.tripo-results {
  display: grid;
  gap: 0.75rem;
  margin-block: 0.5rem;
}
.tripo-result {
  display: grid;
  gap: 0.5rem;
  justify-items: start;
}
.preview {
  display: grid;
  gap: 0.25rem;
  cursor: pointer;
  padding: 0;
  color: inherit;
}
.preview img,
model-viewer {
  width: min(100%, 28rem);
  max-height: 22rem;
  object-fit: contain;
  border-radius: 0.5rem;
}
model-viewer {
  width: 100%;
  min-width: 0;
  height: clamp(14rem, 42vw, 22rem);
  background: var(--el-fill-color-light);
}
.tripo-result a {
  color: var(--el-color-primary);
}
</style>
