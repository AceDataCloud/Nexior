<template>
  <shared-markdown :source="source" :options="options" :sanitize="sanitize" link-target="_blank" />
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, type PropType } from 'vue';
import type { MarkdownOptions } from '@acedatacloud/core/markdown';

// The SFC boundary also lets SSR include the stylesheet when Markdown is rendered.
const SharedMarkdown = defineAsyncComponent(() => import('./SharedMarkdown.vue'));

export { MARKDOWN_SANITIZE_KEY } from '@acedatacloud/core/markdown/constants';

export default defineComponent({
  name: 'VueMarkdown',
  components: { SharedMarkdown },
  props: {
    source: { type: String, required: true },
    options: { type: Object as PropType<MarkdownOptions['options']>, default: () => ({}) },
    sanitize: { type: Boolean, default: false }
  }
});
</script>
