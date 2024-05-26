<template>
  <vue-markdown v-highlight :source="content" class="markdown-body" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VueMarkdown from './VueMarkdown.vue';
import { highlight } from '@/utils';
import 'highlight.js/styles/night-owl.css';

export default defineComponent({
  name: 'ApiCode',
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
  },
  data() {},
  watch: {}
});
</script>

<style lang="scss">
@import 'github-markdown-css/github-markdown.css';
</style>

<style lang="scss" scoped>
.markdown-body {
  background: none;
  padding-top: 3px;
  color: inherit;
  ol {
    list-style: initial;
  }

  pre code {
    color: white;
  }
}
</style>
