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
import VueMarkdown from './VueMarkdown.vue';
import { ElDivider, ElSkeleton } from 'element-plus';

export default defineComponent({
  name: 'ApiCode',
  components: {
    VueMarkdown,
    ElDivider,
    ElSkeleton
  },
  props: {
    content: {
      type: String,
      required: false,
      default: ''
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

<style lang="scss" scoped>
.markdown-body {
  background: none;
}
</style>
