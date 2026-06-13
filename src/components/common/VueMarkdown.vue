<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed, h } from 'vue';
import MarkdownIt, { Options as MarkdownItOptions } from 'markdown-it';
import hljs from 'highlight.js/lib/common';
import 'katex/dist/katex.min.css';
import { katex } from '@mdit/plugin-katex';

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
    const md = new MarkdownIt({
      ...props.options,
      html: true,
      // Auto-link bare URLs (agent output is full of raw PR/doc links).
      linkify: true,
      // Bake syntax highlighting into the rendered HTML so it survives the
      // streaming re-render churn instead of relying on a post-render pass.
      highlight: (str: string, lang: string): string => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            const out = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
            return `<pre><code class="hljs language-${lang}">${out}</code></pre>`;
          } catch {
            /* fall through to auto-detect */
          }
        }
        try {
          return `<pre><code class="hljs">${hljs.highlightAuto(str).value}</code></pre>`;
        } catch {
          return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
        }
      }
    }).use(katex as any, {
      delimiters: 'all',
      throwOnError: false,
      errorColor: '#cc0000',
      mathFence: true
    });

    // Open every link in a new tab — this app is often embedded, and an
    // in-place navigation would blow away the user's session.
    const defaultLinkOpen =
      md.renderer.rules.link_open || ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      token.attrSet('target', '_blank');
      token.attrSet('rel', 'noopener noreferrer');
      return defaultLinkOpen(tokens, idx, options, env, self);
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
