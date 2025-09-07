<template>
  <vue-markdown v-highlight :source="content" class="markdown-body bg-transparent pt-[3px] text-[inherit]" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VueMarkdown from './VueMarkdown.vue';
import { highlight } from '@/utils';
import 'highlight.js/styles/night-owl.css';

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
