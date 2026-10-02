<template>
  <shared-markdown :source="source" :options="options" :sanitize="sanitize" link-target="_blank" />
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { MarkdownRenderer as SharedMarkdown, type MarkdownOptions } from '@acedatacloud/core/markdown';
import '@acedatacloud/core/markdown.css';

export { MARKDOWN_SANITIZE_KEY } from '@acedatacloud/core/markdown';

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
