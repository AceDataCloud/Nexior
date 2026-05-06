<template>
  <div class="entity-card" :class="`entity-card--${cardType}`">
    <!-- Audio -->
    <div v-if="cardType === 'audio'" class="audio-card">
      <div v-if="card.thumbnail" class="thumb">
        <img :src="card.thumbnail" :alt="card.title || ''" />
      </div>
      <div class="meta">
        <div v-if="card.title" class="title" :title="card.title">{{ card.title }}</div>
        <div v-if="card.duration" class="sub">{{ formattedDuration }}</div>
        <audio class="player" controls preload="metadata" :src="card.url" />
        <div class="actions">
          <a class="download" :href="card.url" target="_blank" rel="noopener noreferrer">
            <font-awesome-icon icon="fa-solid fa-arrow-down" />
            {{ $t('common.button.download') }}
          </a>
        </div>
      </div>
    </div>

    <!-- Video — rendered as an iframe by default. The aichat2 worker
         normalizes YouTube watch URLs to the canonical embed form, and
         iframes also play direct media URLs (browser shows its native
         video viewer) so a single renderer covers both. -->
    <div v-else-if="cardType === 'video'" class="video-card">
      <div class="frame">
        <iframe
          class="player"
          :src="card.url"
          :title="card.title || ''"
          frameborder="0"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />
      </div>
      <div v-if="card.title || card.duration" class="meta">
        <span v-if="card.title" class="title" :title="card.title">{{ card.title }}</span>
        <span v-if="card.duration" class="sub">{{ formattedDuration }}</span>
      </div>
    </div>

    <!-- Image -->
    <div v-else-if="cardType === 'image'" class="image-card">
      <el-image
        :src="card.url"
        :alt="card.alt || card.title || ''"
        fit="contain"
        class="image"
        :preview-src-list="[card.url]"
        :initial-index="0"
        :hide-on-click-modal="true"
        :preview-teleported="true"
      >
        <template #placeholder>
          <div class="image-placeholder" />
        </template>
        <template #error>
          <div class="image-placeholder image-placeholder--error" />
        </template>
      </el-image>
      <div v-if="card.title" class="caption" :title="card.title">{{ card.title }}</div>
    </div>

    <!-- File / fallback -->
    <a
      v-else
      class="file-card"
      :href="card.url"
      target="_blank"
      rel="noopener noreferrer"
      :title="card.title || card.url"
    >
      <font-awesome-icon class="icon" :icon="fileIcon" />
      <div class="info">
        <div class="title">{{ card.title || cleanFileName }}</div>
        <div class="sub">{{ card.mimeType || hostname }}</div>
      </div>
      <font-awesome-icon class="open" icon="fa-solid fa-arrow-up-right-from-square" />
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElImage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IChatCard } from '@/models';

export default defineComponent({
  name: 'EntityCard',
  components: { ElImage, FontAwesomeIcon },
  props: {
    card: {
      type: Object as PropType<IChatCard>,
      required: true
    }
  },
  computed: {
    /** Normalize the card type into one of the primary renderers. The
     * legacy `embed` type (briefly emitted by PlatformService #826) is
     * folded back into `video` so historical cards still render — the
     * worker no longer flips type, see PlatformService #827. */
    cardType(): 'audio' | 'video' | 'image' | 'file' {
      const t = (this.card.type || '').toLowerCase();
      if (t === 'audio' || t === 'image') return t;
      if (t === 'video' || t === 'embed') return 'video';
      if (this.card.mimeType?.startsWith('audio/')) return 'audio';
      if (this.card.mimeType?.startsWith('video/')) return 'video';
      if (this.card.mimeType?.startsWith('image/')) return 'image';
      return 'file';
    },
    formattedDuration(): string {
      const total = this.card.duration ?? 0;
      if (!Number.isFinite(total) || total <= 0) return '';
      const mm = Math.floor(total / 60);
      const ss = Math.floor(total % 60)
        .toString()
        .padStart(2, '0');
      return `${mm}:${ss}`;
    },
    cleanFileName(): string {
      try {
        const u = new URL(this.card.url);
        const segs = u.pathname.split('/').filter(Boolean);
        return decodeURIComponent(segs[segs.length - 1] || u.hostname);
      } catch {
        return this.card.url;
      }
    },
    hostname(): string {
      try {
        return new URL(this.card.url).hostname;
      } catch {
        return '';
      }
    },
    fileIcon(): string {
      const mime = (this.card.mimeType || '').toLowerCase();
      if (mime.includes('pdf')) return 'fa-solid fa-file-pdf';
      if (mime.includes('word') || mime.includes('msword')) return 'fa-solid fa-file-word';
      if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return 'fa-solid fa-file-excel';
      if (mime.includes('zip') || mime.includes('compressed')) return 'fa-solid fa-file-zipper';
      if (mime.startsWith('text/')) return 'fa-solid fa-file-lines';
      return 'fa-solid fa-file';
    }
  }
});
</script>

<style lang="scss" scoped>
.entity-card {
  margin: 8px 0;
  max-width: 480px;

  .title {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.audio-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-light);

  .thumb img {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    object-fit: cover;
    display: block;
  }
  .meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .player {
    width: 100%;
    height: 36px;
    margin-top: 4px;
  }
  .actions {
    display: flex;
    gap: 8px;
    font-size: 12px;
    margin-top: 2px;
  }
  .download {
    color: var(--el-color-primary);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .download:hover {
    text-decoration: underline;
  }
}

.video-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
  background: #000;

  .frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
  }
  .player {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
    background: #000;
  }
  .meta {
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
}

.image-card {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .image {
    display: block;
    width: 100%;
    min-height: 240px;
    max-height: 400px;
    border-radius: 8px;
    overflow: hidden;
  }
  .image-placeholder {
    width: 100%;
    height: 100%;
    min-height: 240px;
    border-radius: 8px;
    background: linear-gradient(
      90deg,
      var(--el-fill-color) 0%,
      var(--el-fill-color-light) 50%,
      var(--el-fill-color) 100%
    );
    background-size: 200% 100%;
    animation: image-card-shimmer 1.4s ease-in-out infinite;
  }
  .image-placeholder--error {
    animation: none;
    background: var(--el-fill-color);
  }
  .caption {
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    text-align: center;
    line-height: 1.4;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    opacity: 0.75;
  }
}

@keyframes image-card-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-light);
  text-decoration: none;
  color: inherit;

  .icon {
    font-size: 24px;
    color: var(--el-color-primary);
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .open {
    color: var(--el-text-color-secondary);
  }
}
.file-card:hover {
  background: var(--el-fill-color);
}
</style>
