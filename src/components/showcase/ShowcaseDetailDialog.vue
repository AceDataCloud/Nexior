<template>
  <el-dialog
    :model-value="Boolean(item)"
    :width="dialogWidth"
    align-center
    append-to-body
    destroy-on-close
    class="showcase-detail-dialog"
    :show-close="false"
    @close="emit('close')"
  >
    <div
      v-if="item"
      class="detail-layout"
      :class="[`layout-${item.layout.toLowerCase()}`, `media-${item.mediaType.toLowerCase()}`]"
    >
      <button
        type="button"
        class="detail-close"
        :aria-label="$t('common.button.close')"
        :title="$t('common.button.close')"
        @click="emit('close')"
      >
        <close-icon aria-hidden="true" />
      </button>
      <section class="media-stage">
        <img v-if="item.mediaType === 'Image'" :src="item.posterUrl" :alt="item.altText" />
        <video-player v-else-if="item.mediaType === 'Video'" :src="item.previewUrl" />
        <showcase-audio-player
          v-else
          ref="audioPlayer"
          :src="item.previewUrl"
          :cover="item.posterUrl"
          :title="item.title"
        />
      </section>
      <aside class="detail-copy">
        <div class="detail-scroll">
          <div class="service">
            <img :src="item.icon" alt="" />
            <div class="service-copy">
              <span class="service-name">{{ item.name }}</span>
              <span v-if="item.model" class="model">{{ item.model }}</span>
            </div>
          </div>
          <h2>{{ item.title }}</h2>
          <section v-if="item.prompt" class="prompt">
            <h3>{{ $t('intro.inspiration.prompt') }}</h3>
            <p ref="promptElement" class="collapsed">
              {{ item.prompt }}
            </p>
            <button
              v-if="promptOverflowing"
              ref="promptToggle"
              type="button"
              class="prompt-toggle"
              aria-haspopup="dialog"
              :aria-controls="promptDialogId"
              @click="promptDialogVisible = true"
            >
              {{ $t('intro.inspiration.showMore') }}
            </button>
          </section>
          <section v-if="item.parameters.length" class="parameters">
            <h3>{{ $t('intro.inspiration.parameters') }}</h3>
            <dl>
              <template v-for="parameter in item.parameters" :key="parameter.key">
                <dt>{{ parameterLabel(parameter.key) }}</dt>
                <dd>{{ parameter.value }}</dd>
              </template>
            </dl>
          </section>
        </div>
        <button v-if="item.canCreateSimilar" type="button" class="create-similar" @click="createSimilar">
          {{ $t('intro.home.showcase.createSimilar') }} <span aria-hidden="true">→</span>
        </button>
      </aside>
    </div>
  </el-dialog>
  <el-dialog
    :id="promptDialogId"
    v-model="promptDialogVisible"
    width="min(760px, calc(100vw - 24px))"
    align-center
    append-to-body
    class="showcase-prompt-dialog"
    :title="$t('intro.inspiration.prompt')"
    @closed="restorePromptFocus"
  >
    <div class="full-prompt">{{ item?.prompt }}</div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElDialog } from 'element-plus';
import { CloseIcon } from '@acedatacloud/core/icons/components';
import type { ResolvedShowcase } from '@/models';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ShowcaseAudioPlayer from './ShowcaseAudioPlayer.vue';

const props = defineProps<{ item?: ResolvedShowcase }>();
const emit = defineEmits<{ close: [] }>();
const router = useRouter();
const promptElement = ref<HTMLElement>();
const promptToggle = ref<HTMLButtonElement>();
const promptDialogVisible = ref(false);
const promptOverflowing = ref(false);
let resizeObserver: ResizeObserver | undefined;

const promptDialogId = computed(() => `showcase-prompt-dialog-${props.item?.id || 'empty'}`);
const dialogWidth = computed(() => {
  if (!props.item) return 'min(1180px, calc(100vw - 32px))';
  if (props.item.mediaType === 'Audio') return 'min(920px, calc(100vw - 32px))';
  if (props.item.layout === 'Portrait') return 'min(880px, calc(100vw - 32px))';
  if (props.item.layout === 'Square') return 'min(1020px, calc(100vw - 32px))';
  return 'min(1180px, calc(100vw - 32px))';
});

function measurePrompt(): void {
  const element = promptElement.value;
  if (!element) return;
  promptOverflowing.value = element.scrollHeight > element.clientHeight + 1;
}

function observePrompt(): void {
  resizeObserver?.disconnect();
  const element = promptElement.value;
  if (!element || typeof ResizeObserver === 'undefined') return;
  resizeObserver = new ResizeObserver(measurePrompt);
  resizeObserver.observe(element);
}

watch(
  () => props.item?.id,
  async () => {
    promptDialogVisible.value = false;
    promptOverflowing.value = false;
    await nextTick();
    measurePrompt();
    observePrompt();
  },
  { immediate: true }
);

onBeforeUnmount(() => resizeObserver?.disconnect());

function restorePromptFocus(): void {
  promptToggle.value?.focus();
}

async function createSimilar(): Promise<void> {
  const item = props.item;
  if (!item?.canCreateSimilar) return;
  await router.push({ name: item.routeName, query: { showcase: item.id } });
  emit('close');
}

function parameterLabel(key: string): string {
  const normalized = key.replaceAll('_', ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
</script>

<style lang="scss">
.showcase-detail-dialog {
  overflow: hidden;
  padding: 0;
  border-radius: 18px;

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 0;
  }
}

.showcase-prompt-dialog {
  display: flex;
  max-height: calc(100dvh - 24px);
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;

  .el-dialog__header {
    flex: none;
    padding-right: 52px;
  }

  .el-dialog__body {
    min-height: 0;
    overflow: hidden;
    padding-top: 8px;
  }
}
</style>

<style lang="scss" scoped>
.detail-layout {
  position: relative;
  display: grid;
  max-height: calc(100dvh - 48px);
  grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.85fr);
  overflow: hidden;
  border-radius: 16px;
  background: var(--el-bg-color);

  &.layout-square {
    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  }

  &.layout-portrait {
    grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1fr);
  }

  &.media-audio {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
  }
}

.detail-close {
  position: absolute;
  z-index: 5;
  top: 10px;
  right: 10px;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  padding: 0;
  border: 0;
  color: var(--el-text-color-primary);
  background: transparent;
  cursor: pointer;

  &::before {
    position: absolute;
    width: 34px;
    height: 34px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 50%;
    background: color-mix(in srgb, var(--el-bg-color-overlay) 88%, transparent);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    content: '';
    backdrop-filter: blur(12px);
  }

  :deep(svg) {
    position: relative;
    width: 17px;
    height: 17px;
  }

  &:hover::before {
    border-color: var(--el-border-color);
    background: var(--el-bg-color-overlay);
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary-light-3);
    outline-offset: 1px;
    border-radius: 50%;
  }
}

.media-stage {
  display: grid;
  min-width: 0;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  background: #070a0f;

  > img {
    display: block;
    width: 100%;
    height: auto;
    max-height: calc(100dvh - 48px);
    object-fit: contain;
  }

  :deep(.video) {
    width: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }
}

.detail-copy {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);

  h2 {
    margin: 0;
    padding-right: 30px;
    font-size: 24px;
  }

  h3 {
    margin: 0 0 9px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.detail-scroll {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
  padding: 34px 28px 22px;
}

.service {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding-right: 36px;
  color: var(--el-text-color-secondary);
  font-size: 13px;

  img {
    width: 30px;
    height: 30px;
    flex: none;
    border-radius: 8px;
    object-fit: cover;
  }

  .service-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .service-name {
    font-weight: 750;
  }

  .model {
    max-width: 100%;
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--el-fill-color-light);
    font-size: 11px;
    overflow-wrap: anywhere;
  }
}

.prompt p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;

  &.collapsed {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
  }
}

.full-prompt {
  max-height: calc(100dvh - 156px);
  overflow-y: auto;
  padding-right: 8px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.75;
  overscroll-behavior: contain;
}

.prompt-toggle {
  margin-top: 10px;
  padding: 0;
  border: 0;
  color: var(--el-color-primary);
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;

  &:focus-visible {
    outline: 2px solid var(--el-color-primary-light-3);
    outline-offset: 3px;
    border-radius: 3px;
  }
}

.parameters dl {
  display: grid;
  grid-template-columns: minmax(90px, auto) 1fr;
  gap: 8px 16px;
  margin: 0;

  dt {
    color: var(--el-text-color-secondary);
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
  }
}

.create-similar {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  flex: none;
  margin: 0 28px 26px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: var(--el-color-primary);
  cursor: pointer;
  font: inherit;
  font-weight: 800;

  &:focus-visible {
    outline: 3px solid var(--el-color-primary-light-3);
    outline-offset: 2px;
  }
}

@media (max-width: 760px) {
  .detail-layout,
  .detail-layout.layout-square,
  .detail-layout.layout-portrait,
  .detail-layout.media-audio {
    max-height: calc(100dvh - 16px);
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .detail-close {
    top: max(6px, env(safe-area-inset-top));
    right: 6px;
  }

  .media-stage {
    > img {
      max-height: 52dvh;
    }
  }

  .detail-copy {
    overflow: visible;
  }

  .detail-scroll {
    overflow: visible;
    padding: 24px 20px;
  }

  .create-similar {
    position: sticky;
    bottom: 0;
    z-index: 2;
    margin: 0 12px max(12px, env(safe-area-inset-bottom));
    background: var(--el-color-primary);
  }
}
</style>
