<template>
  <div v-if="loading">
    <el-skeleton />
    <el-divider />
    <el-skeleton />
  </div>
  <vue-markdown v-else :source="content" class="markdown-body" />
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
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {},
  watch: {}
});
</script>

<style lang="scss">
@import 'github-markdown-css/github-markdown.css';
</style>
