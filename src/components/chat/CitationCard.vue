<template>
  <a class="citation-card" :href="citation.url" target="_blank" rel="noopener noreferrer">
    <div v-if="citation.source || citation.icon" class="head">
      <img v-if="citation.icon" :src="citation.icon" :alt="citation.source || ''" class="icon" />
      <font-awesome-icon v-else :icon="fallbackIcon" class="icon-fallback" />
      <span v-if="citation.source" class="source">{{ citation.source }}</span>
    </div>
    <div v-if="citation.title" class="title">{{ citation.title }}</div>
    <div v-if="citation.snippet" class="snippet">{{ citation.snippet }}</div>
    <div class="url">{{ displayUrl }}</div>
  </a>
</template>

<script lang="ts">
/**
 * Hover-card body for a single source citation. Rendered inside an
 * `<el-popover>` virtually-anchored to a `[N]` chip in the markdown
 * stream by `MarkdownRenderer.vue`. The whole card is itself a link to
 * the source URL — clicking anywhere on the card opens the source in a
 * new tab, mirroring the chip's own click behaviour so users don't
 * have to aim at the small superscript.
 */
import { defineComponent, type PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IChatCitation } from '@/models';

export default defineComponent({
  name: 'CitationCard',
  components: { FontAwesomeIcon },
  props: {
    citation: {
      type: Object as PropType<IChatCitation>,
      required: true
    }
  },
  computed: {
    /** Hostname-only display so a 200-char URL doesn't blow up the card. */
    displayUrl(): string {
      try {
        const u = new URL(this.citation.url);
        return u.host + (u.pathname && u.pathname !== '/' ? u.pathname : '');
      } catch {
        return this.citation.url;
      }
    },
    /** Type-driven icon when the citation didn't carry a logo URL. */
    fallbackIcon(): string {
      const t = (this.citation.type || '').toLowerCase();
      if (t === 'file') return 'fa-solid fa-file-lines';
      if (t === 'page') return 'fa-solid fa-file';
      if (t === 'issue') return 'fa-solid fa-circle-dot';
      if (t === 'email') return 'fa-solid fa-envelope';
      if (t === 'message') return 'fa-solid fa-message';
      if (t === 'web') return 'fa-solid fa-globe';
      return 'fa-solid fa-link';
    }
  }
});
</script>

<style lang="scss" scoped>
.citation-card {
  display: block;
  width: 320px;
  max-width: 80vw;
  padding: 10px 12px;
  font-size: 12.5px;
  line-height: 1.45;
  color: inherit;
  text-decoration: none;
  cursor: pointer;

  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    color: var(--el-text-color-secondary, #6b7280);
    font-size: 12px;

    .icon {
      width: 14px;
      height: 14px;
      object-fit: contain;
      flex: 0 0 14px;
    }

    .icon-fallback {
      width: 12px;
      height: 12px;
      flex: 0 0 12px;
    }

    .source {
      font-weight: 500;
    }
  }

  .title {
    font-weight: 600;
    color: var(--el-text-color-primary, #111827);
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }

  .snippet {
    color: var(--el-text-color-regular, #374151);
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .url {
    color: var(--el-text-color-secondary, #6b7280);
    font-size: 11.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    direction: ltr;
  }
}
</style>
