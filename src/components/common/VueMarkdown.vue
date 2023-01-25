<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed, h } from 'vue';
import MarkdownIt, { Options as MarkdownItOptions } from 'markdown-it';

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
    const md = new MarkdownIt(props.options);
    const content = computed(() => {
      const src = props.source;
      return md?.render(src);
    });

    return () =>
      h('div', {
        ...attrs,
        innerHTML: content.value
      });
  }
});
</script>
