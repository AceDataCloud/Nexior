<template>
  <div class="transcript-item text-sm leading-relaxed" :class="`kind-${event.kind}`">
    <!-- User prompt -->
    <div v-if="event.kind === 'prompt'" class="group flex items-end justify-end gap-1.5">
      <!-- Edit: reload this prompt into the composer; on send the conversation
           is rewound to this turn. Only shown when the backend supports it. -->
      <button
        v-if="editable"
        type="button"
        class="cb-edit-btn opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        :title="$t('codingBridge.session.editPrompt')"
        :aria-label="$t('codingBridge.session.editPrompt')"
        @click="$emit('edit', event)"
      >
        <font-awesome-icon icon="fa-solid fa-pen" />
      </button>
      <div
        class="max-w-[85%] rounded-lg px-3 py-2 bg-[var(--el-color-primary)] text-white whitespace-pre-wrap break-words"
      >
        <div
          v-if="event.images && event.images.length"
          class="flex flex-wrap gap-1.5"
          :class="{ 'mb-1.5': event.text || hasAttachments }"
        >
          <img
            v-for="(image, index) in event.images"
            :key="index"
            :src="image"
            class="w-16 h-16 rounded object-cover"
            alt=""
          />
        </div>
        <div v-if="hasAttachments" class="flex flex-wrap gap-1.5" :class="{ 'mb-1.5': event.text }">
          <a
            v-for="(attachment, index) in event.attachments"
            :key="`${attachment.url}-${index}`"
            :href="attachment.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex max-w-[220px] items-center gap-2 rounded-md bg-white/15 px-2 py-1.5 text-xs text-white hover:bg-white/20"
          >
            <img v-if="attachment.type === 'image'" :src="attachment.url" class="h-9 w-9 rounded object-cover" alt="" />
            <span v-else class="flex h-9 w-9 items-center justify-center rounded bg-white/15">
              <font-awesome-icon icon="fa-solid fa-file" />
            </span>
            <span class="min-w-0 truncate">{{ attachment.name || attachment.url }}</span>
          </a>
        </div>
        <span v-if="event.text">{{ event.text }}</span>
      </div>
    </div>

    <!-- Assistant text (markdown); a blinking caret trails while streaming. -->
    <div v-else-if="event.kind === 'text'" class="cb-stream-text" :class="{ 'is-streaming': event.streaming }">
      <vue-markdown
        v-highlight
        :source="event.text || ''"
        class="markdown-body bg-transparent text-[var(--app-text)]"
      />
    </div>

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
      <!-- AskUserQuestion: list the question(s) instead of raw JSON. -->
      <div v-if="questionLines.length" class="flex flex-col gap-1.5 px-2.5 pb-2">
        <div
          v-for="(line, index) in questionLines"
          :key="index"
          class="rounded border border-[var(--app-border-subtle)] bg-[var(--app-content-bg)] px-2.5 py-1.5 text-xs"
        >
          <div v-if="line.header" class="font-medium text-[var(--app-text)]">{{ line.header }}</div>
          <div class="whitespace-pre-wrap break-words text-[var(--app-text-subtle)]">{{ line.question }}</div>
        </div>
      </div>
      <!-- Shell-style tools render as a terminal command line. -->
      <div v-else-if="commandText" class="px-2.5 pb-2">
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

    <!-- Notice: a friendly heads-up such as a slash command that can't run remotely. -->
    <div
      v-else-if="event.kind === 'notice'"
      class="flex items-start gap-2 rounded-md bg-[var(--app-sidebar-bg)] border border-[var(--app-border-subtle)] text-[var(--app-text-subtle)] px-3 py-2 text-xs"
    >
      <font-awesome-icon icon="fa-solid fa-circle-info" class="mt-0.5 flex-none text-[var(--el-color-primary)]" />
      <span class="whitespace-pre-wrap break-words">{{ noticeText }}</span>
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
import { ASK_USER_QUESTION_TOOL } from './askUserQuestion';
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
    },
    // Whether this prompt can be edited (backend supports conversation rewind).
    editable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit'],
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
    // AskUserQuestion is relayed as a tool_use; surface the question text
    // instead of the raw `{questions:[...]}` JSON.
    questionLines(): { header: string; question: string }[] {
      const tool = (this.event.tool ?? '').toLowerCase();
      const questions = this.event.input?.questions;
      const looksLikeAsk = tool === ASK_USER_QUESTION_TOOL.toLowerCase() || Array.isArray(questions);
      if (!looksLikeAsk || !Array.isArray(questions)) {
        return [];
      }
      return questions
        .filter((q) => q && typeof q.question === 'string')
        .map((q) => ({
          header: typeof q.header === 'string' ? q.header : '',
          question: q.question as string
        }));
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
    },
    hasAttachments(): boolean {
      return !!this.event.attachments?.length;
    },
    // Localize a notice from its machine code + command, falling back to the
    // node-provided English text for codes the web app doesn't know yet.
    noticeText(): string {
      const code = this.event.subtype;
      const command = this.event.command;
      if (command) {
        if (code === 'slash_unavailable') {
          return this.$t('codingBridge.notice.slashUnavailable', { command }) as string;
        }
        if (code === 'slash_codex_unsupported') {
          return this.$t('codingBridge.notice.slashCodexUnsupported', { command }) as string;
        }
      }
      return this.event.text || '';
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
.cb-edit-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  border: 1px solid var(--app-border-subtle);
  background: var(--app-content-bg);
  color: var(--app-text-subtle);
  font-size: 11px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }
}

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

  /* Let the night-owl `.hljs` dark background fill the block cleanly instead
     of framing it with github-markdown's light `pre` padding/background. */
  pre {
    margin: 0;
    padding: 0;
    background: transparent;
    border-radius: 6px;
    overflow: hidden;
  }
  pre code {
    color: #fff;
  }

  /* Inline code keeps a subtle chip; block code is themed by night-owl. */
  a {
    color: var(--el-color-primary);
    text-decoration: underline;
  }
}

// Blinking typewriter caret trailing the last line while text streams in.
.cb-stream-text.is-streaming :deep(.markdown-body > :last-child)::after {
  content: '';
  display: inline-block;
  width: 0.45em;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--el-color-primary);
  border-radius: 1px;
  animation: cb-caret-blink 1s steps(1, end) infinite;
}

@keyframes cb-caret-blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}
</style>
