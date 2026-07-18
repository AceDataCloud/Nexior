<template>
  <div class="media-input" :class="`media-input--${kind}`" :aria-busy="state === 'uploading'">
    <button
      v-if="kind === 'image' && url"
      type="button"
      class="media-input__visual"
      :aria-label="previewLabel"
      :disabled="state === 'uploading' || state === 'unavailable'"
      @click="imageViewerOpen = true"
    >
      <img :src="url" :alt="name" />
    </button>
    <button
      v-else-if="kind === 'video' && url && !videoThumbnailFailed"
      type="button"
      class="media-input__visual"
      :aria-label="previewLabel"
      :disabled="state === 'uploading' || state === 'unavailable'"
      @click="videoDialogOpen = true"
    >
      <video :src="`${url}#t=0.1`" muted preload="metadata" playsinline @error="videoThumbnailFailed = true" />
      <font-awesome-icon icon="fa-solid fa-play" class="media-input__play" />
    </button>
    <div v-else-if="kind === 'audio' && url" class="media-input__audio">
      <audio :src="url" controls preload="metadata" :aria-label="previewLabel" />
    </div>
    <div v-else class="media-input__file" aria-hidden="true">
      <font-awesome-icon icon="fa-regular fa-file" />
    </div>

    <div class="media-input__content">
      <span class="media-input__role">{{ roleLabel }}</span>
      <strong class="media-input__name" :title="name">{{ name }}</strong>
      <span v-if="metadata" class="media-input__metadata">{{ metadata }}</span>
      <el-progress v-if="state === 'uploading'" :percentage="boundedProgress" :show-text="false" :stroke-width="4" />
      <span v-if="state === 'failed' && error" class="media-input__error" role="alert">{{ error }}</span>
      <span v-else-if="state === 'unavailable'" class="media-input__metadata">{{ unavailableLabel }}</span>
    </div>

    <div class="media-input__actions">
      <el-button v-if="replaceable" circle :aria-label="replaceLabel" @click="$emit('replace')">
        <font-awesome-icon icon="fa-solid fa-rotate" />
      </el-button>
      <el-button v-if="removable" circle :aria-label="removeLabel" @click="$emit('remove')">
        <font-awesome-icon icon="fa-solid fa-xmark" />
      </el-button>
    </div>

    <el-image-viewer
      v-if="imageViewerOpen && url"
      :url-list="[url]"
      teleported
      hide-on-click-modal
      @close="imageViewerOpen = false"
    />
    <el-dialog v-model="videoDialogOpen" width="640" align-center append-to-body destroy-on-close>
      <video-player v-if="url" :src="url" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElButton, ElDialog, ElImageViewer, ElProgress } from 'element-plus';

const VideoPlayer = defineAsyncComponent(() => import('@/components/common/VideoPlayer.vue'));

export type MediaInputKind = 'image' | 'video' | 'audio' | 'file';
export type MediaInputState = 'ready' | 'uploading' | 'failed' | 'unavailable';

const props = withDefaults(
  defineProps<{
    kind: MediaInputKind;
    name: string;
    roleLabel: string;
    previewLabel: string;
    replaceLabel: string;
    removeLabel: string;
    unavailableLabel: string;
    url?: string;
    metadata?: string;
    error?: string;
    state?: MediaInputState;
    progress?: number;
    replaceable?: boolean;
    removable?: boolean;
  }>(),
  {
    url: undefined,
    metadata: undefined,
    error: undefined,
    state: 'ready',
    progress: 0,
    replaceable: true,
    removable: true
  }
);

defineEmits<{
  replace: [];
  remove: [];
}>();

const imageViewerOpen = ref(false);
const videoDialogOpen = ref(false);
const videoThumbnailFailed = ref(false);
const boundedProgress = computed(() => Math.min(100, Math.max(0, props.progress)));
</script>

<style lang="scss" scoped>
.media-input {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 80px;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--app-border-subtle);
  border-radius: var(--el-border-radius-base);
}

.media-input__visual,
.media-input__file {
  position: relative;
  width: 80px;
  height: 80px;
  padding: 0;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-dark);
  border: 0;
  border-radius: calc(var(--el-border-radius-base) - 2px);
}

.media-input__visual:focus-visible {
  outline: 3px solid var(--el-color-primary-light-5);
  outline-offset: 2px;
}

.media-input__visual img,
.media-input__visual video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-input__play {
  position: absolute;
  top: 50%;
  left: 50%;
  color: white;
  filter: drop-shadow(0 1px 3px rgb(0 0 0 / 70%));
  transform: translate(-50%, -50%);
}

.media-input__audio {
  grid-column: 1 / 3;
}

.media-input__audio audio {
  width: 100%;
  min-width: 0;
  height: 40px;
}

.media-input__file {
  display: grid;
  place-items: center;
  font-size: 24px;
}

.media-input__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.media-input__role,
.media-input__metadata,
.media-input__error {
  font-size: 12px;
  line-height: 18px;
}

.media-input__role {
  color: var(--el-color-primary);
  font-weight: 600;
}

.media-input__name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-input__metadata {
  color: var(--el-text-color-secondary);
}

.media-input__error {
  color: var(--el-color-danger);
}

.media-input__actions {
  display: flex;
  gap: 4px;
}

.media-input__actions :deep(.el-button) {
  width: 40px;
  height: 40px;
  margin: 0;
}

@media (max-width: 480px) {
  .media-input {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .media-input__visual,
  .media-input__file {
    width: 64px;
    height: 64px;
  }

  .media-input__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
