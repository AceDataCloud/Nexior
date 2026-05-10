<template>
  <div v-highlight class="code-snippet rounded-md overflow-hidden">
    <pre><code :class="languageClass">{{ code }}</code></pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { highlight } from '@/utils';
import 'highlight.js/styles/night-owl.css';

export default defineComponent({
  name: 'CodeSnippet',
  directives: {
    highlight
  },
  props: {
    code: {
      type: String,
      required: true
    },
    lang: {
      type: String,
      required: false,
      default: ''
    }
  },
  computed: {
    languageClass(): string {
      const lang = (this.lang || '').toLowerCase();
      if (!lang) return '';
      // Map our friendly tab labels to highlight.js language slugs so the
      // grammar is auto-detected even when the snippet starts with shared
      // tokens (e.g. axios JS vs OkHttp Java).
      const map: Record<string, string> = {
        shell: 'bash',
        bash: 'bash',
        javascript: 'javascript',
        js: 'javascript',
        python: 'python',
        py: 'python',
        java: 'java',
        go: 'go',
        php: 'php'
      };
      const slug = map[lang] || lang;
      return `language-${slug}`;
    }
  }
});
</script>

<style lang="scss" scoped>
.code-snippet {
  background: #011627; // night-owl default background
  position: relative;

  :deep(pre) {
    margin: 0;
    padding: 12px 14px;
    overflow-x: auto;
    max-height: 420px;
    background: transparent;
  }

  :deep(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 12.5px;
    line-height: 1.55;
    text-align: left;
    white-space: pre;
    background: transparent;
  }
}
</style>
