<template>
  <a class="citation-card" :href="citation.url" target="_blank" rel="noopener noreferrer">
    <div class="head">
      <img
        v-if="resolvedIcon"
        :src="resolvedIcon"
        :alt="citation.source || ''"
        class="icon"
        referrerpolicy="no-referrer"
        loading="lazy"
        @error="onIconError"
      />
      <font-awesome-icon v-else :icon="fallbackIcon" class="icon-fallback" />
      <span v-if="citation.source || hostLabel" class="source">{{ citation.source || hostLabel }}</span>
    </div>
    <div v-if="citation.title" class="title">{{ citation.title }}</div>
    <div v-if="citation.snippet" class="snippet">{{ citation.snippet }}</div>
    <div class="url">{{ displayUrl }}</div>
  </a>
</template>

<script lang="ts">
/**
 * Hover-card body for a single source citation. Rendered inside an
 * `<el-popover>` virtually-anchored to a name-tag chip in the markdown
 * stream by `MarkdownRenderer.vue`. The whole card is itself a link to
 * the source URL — clicking anywhere on the card opens the source in a
 * new tab, mirroring the chip's own click behaviour so users don't
 * have to aim at the small inline tag.
 */
import { defineComponent, type PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IChatCitation } from '@/models';

interface IData {
  iconFailed: boolean;
}

export default defineComponent({
  name: 'CitationCard',
  components: { FontAwesomeIcon },
  props: {
    citation: {
      type: Object as PropType<IChatCitation>,
      required: true
    }
  },
  data(): IData {
    return { iconFailed: false };
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
    /** Bare host for the surface label fallback (`docs.google.com`). */
    hostLabel(): string {
      try {
        return new URL(this.citation.url).host.replace(/^www\./, '');
      } catch {
        return '';
      }
    },
    /**
     * Icon URL to render at the top of the card. Preference:
     *   1. `citation.icon` — model-supplied logo when it actually
     *      knows the brand (e.g. an MCP server populates this).
     *   2. Google's S2 favicon CDN keyed by the URL host. Free, no
     *      auth, returns a transparent fallback for unknown sites.
     * If both render attempts fail (rare CDN error), we drop back to
     * the type-driven Font Awesome fallback below.
     */
    resolvedIcon(): string {
      if (this.iconFailed) return '';
      if (this.citation.icon) return this.citation.icon;
      try {
        const host = new URL(this.citation.url).host;
        if (!host) return '';
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
      } catch {
        return '';
      }
    },
    /** Type-driven icon when neither `icon` nor a favicon is available. */
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
  },
  methods: {
    onIconError(): void {
      this.iconFailed = true;
    }
  }
});
</script>

<style lang="scss" scoped>
.citation-card {
  display: block;
  width: 340px;
  max-width: 80vw;
  padding: 14px 16px;
  font-size: 12.5px;
  line-height: 1.5;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  border-radius: 16px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(15, 23, 42, 0.03);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--el-text-color-secondary, #6b7280);
    font-size: 12px;

    .icon {
      width: 18px;
      height: 18px;
      flex: 0 0 18px;
      object-fit: contain;
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.04);
      padding: 1px;
    }

    .icon-fallback {
      width: 14px;
      height: 14px;
      flex: 0 0 14px;
    }

    .source {
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--el-text-color-regular, #374151);
    }
  }

  .title {
    font-weight: 600;
    color: var(--el-text-color-primary, #111827);
    margin-bottom: 6px;
    font-size: 13.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }

  .snippet {
    color: var(--el-text-color-regular, #374151);
    margin-bottom: 8px;
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
    border-top: 1px solid rgba(15, 23, 42, 0.06);
    padding-top: 8px;
    margin-top: 4px;
  }
}

@media (prefers-color-scheme: dark) {
  .citation-card {
    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .head {
      color: rgba(255, 255, 255, 0.6);

      .icon {
        background: rgba(255, 255, 255, 0.06);
      }

      .source {
        color: rgba(255, 255, 255, 0.85);
      }
    }

    .title {
      color: #f3f4f6;
    }

    .snippet {
      color: rgba(255, 255, 255, 0.78);
    }

    .url {
      color: rgba(255, 255, 255, 0.55);
      border-top-color: rgba(255, 255, 255, 0.08);
    }
  }
}
</style>
