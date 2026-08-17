<template>
  <el-dialog
    :model-value="Boolean(item)"
    width="min(1180px, calc(100vw - 32px))"
    align-center
    append-to-body
    destroy-on-close
    class="inspiration-detail-dialog"
    :show-close="true"
    @close="$emit('close')"
  >
    <div v-if="item" class="detail-layout">
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
        <div class="service">
          <img :src="item.icon" alt="" />
          <span>{{ item.name }}</span>
          <span v-if="item.model" class="model">{{ item.model }}</span>
        </div>
        <h2>{{ item.title }}</h2>
        <section v-if="item.prompt" class="prompt">
          <h3>{{ $t('intro.inspiration.prompt') }}</h3>
          <p>{{ item.prompt }}</p>
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
        <router-link :to="{ name: item.routeName, query: { showcase: item.id } }" class="create-similar">
          {{ $t('intro.home.showcase.createSimilar') }} <span aria-hidden="true">→</span>
        </router-link>
      </aside>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElDialog } from 'element-plus';
import type { ResolvedShowcase } from '@/models';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ShowcaseAudioPlayer from './ShowcaseAudioPlayer.vue';

defineProps<{ item?: ResolvedShowcase }>();
defineEmits<{ close: [] }>();

function parameterLabel(key: string): string {
  const normalized = key.replaceAll('_', ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
</script>

<style lang="scss">
.inspiration-detail-dialog {
  .el-dialog__header {
    margin: 0;
    padding: 0;
  }

  .el-dialog__headerbtn {
    z-index: 4;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.48);
  }

  .el-dialog__close {
    color: #fff;
    font-size: 22px;
  }

  .el-dialog__body {
    padding: 0;
  }
}
</style>

<style lang="scss" scoped>
.detail-layout {
  display: grid;
  min-height: min(76vh, 780px);
  grid-template-columns: minmax(0, 1.65fr) minmax(300px, 0.85fr);
  overflow: hidden;
  border-radius: 10px;
}

.media-stage {
  display: grid;
  min-width: 0;
  place-items: center;
  padding: 24px;
  background: #070a0f;

  > img {
    max-width: 100%;
    max-height: 72vh;
    object-fit: contain;
  }

  :deep(.video) {
    width: 100%;
    max-width: 100%;
    max-height: none;
  }
}

.detail-copy {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
  padding: 34px 28px 26px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);

  h2 {
    margin: 0;
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

.service {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 750;

  img {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    object-fit: cover;
  }

  .model {
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--el-fill-color-light);
    font-size: 11px;
  }
}

.prompt p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
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
  margin-top: auto;
  border-radius: 999px;
  color: #fff;
  background: var(--el-color-primary);
  font-weight: 800;

  &:focus-visible {
    outline: 3px solid var(--el-color-primary-light-3);
    outline-offset: 2px;
  }
}

@media (max-width: 760px) {
  .detail-layout {
    max-height: 90vh;
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .media-stage {
    min-height: 42vh;
    padding: 12px;

    > img {
      max-height: 56vh;
    }
  }

  .detail-copy {
    overflow: visible;
    padding: 24px 20px calc(20px + env(safe-area-inset-bottom));
  }
}
</style>
