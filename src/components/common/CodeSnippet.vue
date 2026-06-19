<template>
  <div v-highlight class="code-snippet rounded-md overflow-hidden" :class="{ 'is-copyable': copyable }">
    <!-- Hover-revealed copy affordance (opt-in via `copyable`). -->
    <div v-if="copyable" class="cb-code-copy">
      <copy-to-clipboard :content="code" />
    </div>
    <pre><code :class="languageClass">{{ code }}</code></pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { highlight } from '@/utils';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import 'highlight.js/styles/night-owl.css';

export default defineComponent({
  name: 'CodeSnippet',
  components: {
    CopyToClipboard
  },
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
    },
    // Show a hover-revealed copy button in the top-right corner.
    copyable: {
      type: Boolean,
      required: false,
      default: false
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

  // Copy button: top-right, revealed on hover (kept visible while focused so a
  // keyboard user can reach it). Sits above the scrolling <pre>.
  .cb-code-copy {
    position: absolute;
    top: 6px;
    right: 8px;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 2px 4px;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.75);
    background: rgba(1, 22, 39, 0.6);
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  &.is-copyable:hover .cb-code-copy,
  .cb-code-copy:focus-within {
    opacity: 1;
  }

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
