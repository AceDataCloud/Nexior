<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed, h } from 'vue';
import MarkdownIt, { Options as MarkdownItOptions } from 'markdown-it';
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
    const md = new MarkdownIt({ ...props.options, html: true }).use(katex as any, {
      delimiters: 'all',
      throwOnError: false,
      errorColor: '#cc0000',
      mathFence: true
    });

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
