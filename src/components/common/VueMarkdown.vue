<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed, h } from 'vue';
import MarkdownIt, { Options as MarkdownItOptions } from 'markdown-it';
import 'katex/dist/katex.min.css';
import { katex } from '@mdit/plugin-katex';

const truncate = (s: string, max = 60) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const deriveFilename = (src: string): string => {
  if (!src) return '';
  try {
    const url = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const pathname = url.pathname.replace(/\/+$/, '');
    const last = pathname.split('/').filter(Boolean).pop();
    return last || url.host || src;
  } catch {
    const cleaned = src.split('?')[0].split('#')[0];
    return cleaned.split('/').filter(Boolean).pop() || src;
  }
};

const FALLBACK_ICON_SVG = `
<svg class="md-image-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
  <circle cx="8.5" cy="8.5" r="1.5"></circle>
  <path d="m21 16-4.5-4.5L11 17l-3-3L3 19"></path>
  <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" stroke-dasharray="2 3"></line>
</svg>`.trim();

export default defineComponent({
  name: 'VueMarkdown',
  props: {
    source: {
      type: String,
      required: true
    },
    options: {
      type: Object as PropType<MarkdownItOptions>,
      default: () => ({}),
      required: false
    }
  },
  setup(props, { attrs }) {
    const md = new MarkdownIt({ ...props.options, html: true }).use(katex as any, {
      delimiters: 'all',
      throwOnError: false,
      errorColor: '#cc0000',
      mathFence: true
    });

    // Override the default image renderer to:
    //  - add `loading="lazy"` and `decoding="async"` for better perf,
    //  - tag the <img> with `md-image` so we can attach error handling globally,
    //  - wrap it in a `.md-image-wrap` span that contains a graceful fallback
    //    (icon + alt text + filename) shown when the image fails to load.
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];

      // Resolve alt from inline children (markdown-it stores alt as children tokens).
      const altText = token.children?.length
        ? md.renderer.renderInlineAsText(token.children, options, env)
        : token.content || '';

      const altIdx = token.attrIndex('alt');
      if (altIdx < 0) {
        token.attrPush(['alt', altText]);
      } else {
        token.attrs![altIdx][1] = altText;
      }

      if (token.attrIndex('loading') < 0) token.attrPush(['loading', 'lazy']);
      if (token.attrIndex('decoding') < 0) token.attrPush(['decoding', 'async']);

      const classIdx = token.attrIndex('class');
      const existingClass = classIdx >= 0 ? token.attrs![classIdx][1] : '';
      const nextClass = `md-image${existingClass ? ` ${existingClass}` : ''}`;
      if (classIdx >= 0) {
        token.attrs![classIdx][1] = nextClass;
      } else {
        token.attrPush(['class', nextClass]);
      }

      const srcIdx = token.attrIndex('src');
      const src = srcIdx >= 0 ? token.attrs![srcIdx][1] : '';

      const imgHtml = self.renderToken(tokens, idx, options);
      const filename = truncate(deriveFilename(src) || src, 60);
      const titleText = altText.trim() || 'Image unavailable';

      return (
        '<span class="md-image-wrap">' +
        imgHtml +
        '<span class="md-image-fallback" role="img" aria-label="' +
        md.utils.escapeHtml(`Failed to load image: ${titleText}`) +
        '">' +
        FALLBACK_ICON_SVG +
        '<span class="md-image-fallback-text">' +
        '<span class="md-image-fallback-title">' +
        md.utils.escapeHtml(titleText) +
        '</span>' +
        (filename ? '<span class="md-image-fallback-meta">' + md.utils.escapeHtml(filename) + '</span>' : '') +
        '</span>' +
        '</span>' +
        '</span>'
      );
    };

    const content = computed(() => {
      const src = props.source;
      return md
        ?.render(src)
        .replace(/<think>/g, `<div class="think">`)
        .replace(/<\/think>/g, `</div>`);
    });

    return () =>
      h('div', {
        ...attrs,
        innerHTML: content.value
      });
  }
});
</script>
