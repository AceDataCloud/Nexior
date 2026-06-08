<template>
  <div class="transcript-item text-sm leading-relaxed" :class="`kind-${event.kind}`">
    <!-- User prompt -->
    <div v-if="event.kind === 'prompt'" class="flex justify-end">
      <div
        class="max-w-[85%] rounded-lg px-3 py-2 bg-[var(--el-color-primary)] text-white whitespace-pre-wrap break-words"
      >
        {{ event.text }}
      </div>
    </div>

    <!-- Assistant text (markdown) -->
    <vue-markdown
      v-else-if="event.kind === 'text'"
      v-highlight
      :source="event.text || ''"
      class="markdown-body bg-transparent text-[var(--app-text)]"
    />

    <!-- Thinking -->
    <div
      v-else-if="event.kind === 'thinking'"
      class="whitespace-pre-wrap break-words italic text-[var(--app-text-subtle)] border-l-2 border-[var(--app-border-subtle)] pl-3"
    >
      {{ event.text }}
    </div>

    <!-- Tool use -->
    <div
      v-else-if="event.kind === 'tool_use'"
      class="overflow-hidden rounded-md bg-[var(--app-sidebar-bg)] border border-[var(--app-border-subtle)]"
    >
      <div class="flex items-center gap-2 px-2.5 py-1.5 font-medium text-[var(--app-text-subtle)]">
        <font-awesome-icon :icon="toolIcon" class="text-[var(--el-color-primary)]" />
        <span>{{ event.tool }}</span>
        <span v-if="toolDescription" class="min-w-0 truncate text-xs font-normal opacity-70">{{
          toolDescription
        }}</span>
      </div>
      <!-- Shell-style tools render as a terminal command line. -->
      <div v-if="commandText" class="px-2.5 pb-2">
        <div
          class="flex gap-2 overflow-x-auto rounded border border-[var(--app-border-subtle)] bg-[var(--app-content-bg)] px-2.5 py-1.5 font-mono text-xs"
        >
          <span class="select-none text-[var(--el-color-success)]">$</span>
          <span class="whitespace-pre-wrap break-words">{{ commandText }}</span>
        </div>
      </div>
      <!-- File tools show just the target path. -->
      <div v-else-if="filePath" class="px-2.5 pb-2 font-mono text-xs break-all text-[var(--app-text-subtle)]">
        {{ filePath }}
      </div>
      <!-- Fallback: compact JSON without noisy keys. -->
      <pre
        v-else-if="inputText"
        class="m-0 overflow-x-auto whitespace-pre-wrap break-words px-2.5 pb-2 text-xs text-[var(--app-text-subtle)]"
        >{{ inputText }}</pre
      >
    </div>

    <!-- Tool result -->
    <div
      v-else-if="event.kind === 'tool_result'"
      class="overflow-hidden rounded-md"
      :class="event.is_error ? 'bg-[var(--el-color-danger-light-9)]' : 'bg-[var(--app-sidebar-bg)]'"
    >
      <pre
        class="m-0 max-h-72 overflow-auto whitespace-pre-wrap break-words px-2.5 py-2 font-mono text-xs"
        :class="event.is_error ? 'text-[var(--el-color-danger)]' : 'text-[var(--app-text-subtle)]'"
        >{{ resultText }}</pre
      >
    </div>

    <!-- Turn result -->
    <div v-else-if="event.kind === 'result'" class="flex items-center gap-2 text-xs text-[var(--app-text-subtle)]">
      <font-awesome-icon :icon="event.is_error ? 'fa-solid fa-xmark' : 'fa-solid fa-check'" />
      <span>{{ resultLabel }}</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="event.kind === 'error'"
      class="rounded-md bg-[var(--el-color-danger-light-9)] text-[var(--el-color-danger)] px-3 py-2 whitespace-pre-wrap break-words"
    >
      {{ event.text }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VueMarkdown from '@/components/common/VueMarkdown.vue';
import { highlight } from '@/utils';
import { ICodingBridgeEvent } from '@/models';
import 'highlight.js/styles/night-owl.css';

export default defineComponent({
  name: 'CodingBridgeTranscriptItem',
  directives: {
    highlight
  },
  components: {
    FontAwesomeIcon,
    VueMarkdown
  },
  props: {
    event: {
      type: Object as PropType<ICodingBridgeEvent>,
      required: true
    }
  },
  computed: {
    commandText(): string {
      const input = this.event.input;
      if (!input) {
        return '';
      }
      for (const key of ['command', 'cmd', 'script']) {
        const value = input[key];
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
      return '';
    },
    filePath(): string {
      const input = this.event.input;
      if (!input) {
        return '';
      }
      for (const key of ['file_path', 'filePath', 'path', 'notebook_path', 'filename']) {
        const value = input[key];
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
      return '';
    },
    toolDescription(): string {
      const description = this.event.input?.description;
      return typeof description === 'string' ? description : '';
    },
    toolIcon(): string {
      if (this.commandText) {
        return 'fa-solid fa-terminal';
      }
      const tool = (this.event.tool ?? '').toLowerCase();
      if (/read|cat|view/.test(tool)) {
        return 'fa-solid fa-file-lines';
      }
      if (/write|edit|create|update|insert/.test(tool)) {
        return 'fa-solid fa-pen';
      }
      if (/grep|glob|search|find|list/.test(tool)) {
        return 'fa-solid fa-magnifying-glass';
      }
      return 'fa-solid fa-code';
    },
    inputText(): string {
      const input = this.event.input;
      if (!input) {
        return '';
      }
      const filtered: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        if (key === 'timeout' || key === 'description') {
          continue;
        }
        filtered[key] = value;
      }
      if (Object.keys(filtered).length === 0) {
        return '';
      }
      try {
        return JSON.stringify(filtered, null, 2);
      } catch {
        return String(input);
      }
    },
    resultText(): string {
      const content = this.event.content;
      return typeof content === 'string' && content.length > 0 ? content : '—';
    },
    resultLabel(): string {
      const parts: string[] = [];
      if (this.event.is_error) {
        parts.push(this.$t('codingBridge.transcript.turnFailed') as string);
      } else {
        parts.push(this.$t('codingBridge.transcript.turnDone') as string);
      }
      if (typeof this.event.cost_usd === 'number' && this.event.cost_usd > 0) {
        parts.push(`$${this.event.cost_usd.toFixed(4)}`);
      }
      return parts.join(' · ');
    }
  }
});
</script>

<style lang="scss">
/* Unscoped: VueMarkdown emits raw HTML, so the base github-markdown
   styles must reach those elements. Bundler dedupes the shared import. */
@import 'github-markdown-css/github-markdown.css';
</style>

<style lang="scss" scoped>
.transcript-item :deep(.markdown-body) {
  background: transparent;
  color: inherit;
  font-size: inherit;
  line-height: inherit;

  > :first-child {
    margin-top: 0;
  }
  > :last-child {
    margin-bottom: 0;
  }

  ol {
    list-style: decimal;
  }
  ul {
    list-style: disc;
  }

  pre {
    border-radius: 6px;
  }
  pre code {
    color: #fff;
  }
}
</style>
