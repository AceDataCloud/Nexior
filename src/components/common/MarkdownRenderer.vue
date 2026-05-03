<template>
  <vue-markdown v-highlight :source="content" class="markdown-body bg-transparent pt-[3px] text-[inherit]" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VueMarkdown from './VueMarkdown.vue';
import { highlight } from '@/utils';
import 'highlight.js/styles/night-owl.css';

// Install a single global capture-phase listener once. `error` events on <img>
// don't bubble, so we use the capture phase to catch them. Markdown-rendered
// images carry the `md-image` class — when one fails, mark its wrapper with
// `md-image-error` so the styled fallback shows instead of the broken icon.
const INSTALL_FLAG = '__nexiorMdImgErrorInstalled';
type FlaggedWindow = Window & { [INSTALL_FLAG]?: boolean };

const installImageErrorHandler = () => {
  if (typeof window === 'undefined') return;
  const w = window as FlaggedWindow;
  if (w[INSTALL_FLAG]) return;
  w[INSTALL_FLAG] = true;
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== 'IMG') return;
      if (!target.classList.contains('md-image')) return;
      const wrap = target.closest('.md-image-wrap');
      wrap?.classList.add('md-image-error');
    },
    true
  );
};

installImageErrorHandler();

export default defineComponent({
  name: 'MarkdownRenderer',
  directives: {
    highlight
  },
  components: {
    VueMarkdown
  },
  props: {
    content: {
      type: String,
      required: false,
      default: ''
    }
  }
});
</script>

<style lang="scss">
@import 'github-markdown-css/github-markdown.css';

// Graceful broken-image fallback for markdown-rendered <img> tags.
// The default user-agent broken-image icon (small icon + alt text) looks bad,
// especially in chat. Wrap each markdown image in `.md-image-wrap`; on `error`
// (caught via the capture-phase listener installed above), the wrapper gets
// `md-image-error`, which hides the <img> and reveals a styled fallback card.
.markdown-body .md-image-wrap {
  position: relative;
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;

  > .md-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }

  > .md-image-fallback {
    display: none;
  }

  &.md-image-error {
    > .md-image {
      display: none;
    }

    > .md-image-fallback {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      max-width: 100%;
      min-width: min(280px, 100%);
      border-radius: 12px;
      border: 1px dashed rgba(148, 163, 184, 0.55);
      background:
        linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%),
        radial-gradient(circle at 100% 0%, rgba(196, 181, 253, 0.18) 0%, transparent 60%);
      color: #475569;
      font-size: 13px;
      line-height: 1.45;
      box-shadow: 0 1px 0 rgba(148, 163, 184, 0.08);

      .md-image-icon {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        color: #94a3b8;
      }

      .md-image-fallback-text {
        display: inline-flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        max-width: min(360px, 70vw);
      }

      .md-image-fallback-title {
        font-weight: 600;
        color: #334155;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .md-image-fallback-meta {
        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
        font-size: 12px;
        color: #94a3b8;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

@media (prefers-color-scheme: dark) {
  .markdown-body .md-image-wrap.md-image-error > .md-image-fallback {
    background:
      linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.85) 100%),
      radial-gradient(circle at 100% 0%, rgba(196, 181, 253, 0.18) 0%, transparent 60%);
    border-color: rgba(148, 163, 184, 0.3);
    color: #cbd5e1;

    .md-image-icon {
      color: #64748b;
    }

    .md-image-fallback-title {
      color: #e2e8f0;
    }

    .md-image-fallback-meta {
      color: #64748b;
    }
  }
}
</style>

<style lang="scss" scoped>
.markdown-body {
  ol {
    list-style: initial;
  }

  pre code {
    color: white;
  }
}
</style>
