<template>
  <vue-markdown :source="content" class="markdown-body" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VueMarkdown from 'vue-markdown-render';

export default defineComponent({
  name: 'ApiCode',
  components: {
    VueMarkdown
  },
  props: {
    content: {
      type: String,
      required: true
    }
  },
  data() {},
  watch: {}
});
</script>

<style lang="scss">
@import 'github-markdown-css/github-markdown.css';
</style>
