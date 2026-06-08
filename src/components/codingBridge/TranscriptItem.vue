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

    <!-- Assistant text -->
    <div v-else-if="event.kind === 'text'" class="whitespace-pre-wrap break-words text-[var(--app-text)]">
      {{ event.text }}
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
      class="rounded-md bg-[var(--app-sidebar-bg)] border border-[var(--app-border-subtle)] p-2"
    >
      <div class="flex items-center gap-2 text-[var(--app-text-subtle)] font-medium">
        <font-awesome-icon icon="fa-solid fa-code" />
        <span>{{ event.tool }}</span>
      </div>
      <pre
        v-if="hasInput"
        class="mt-1 text-xs overflow-x-auto whitespace-pre-wrap break-words text-[var(--app-text-subtle)]"
        >{{ inputText }}</pre
      >
    </div>

    <!-- Tool result -->
    <div
      v-else-if="event.kind === 'tool_result'"
      class="rounded-md p-2 text-xs whitespace-pre-wrap break-words overflow-x-auto"
      :class="
        event.is_error
          ? 'bg-[var(--el-color-danger-light-9)] text-[var(--el-color-danger)]'
          : 'bg-[var(--app-sidebar-bg)] text-[var(--app-text-subtle)]'
      "
    >
      {{ event.content }}
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
import { ICodingBridgeEvent } from '@/models';

export default defineComponent({
  name: 'CodingBridgeTranscriptItem',
  components: {
    FontAwesomeIcon
  },
  props: {
    event: {
      type: Object as PropType<ICodingBridgeEvent>,
      required: true
    }
  },
  computed: {
    hasInput(): boolean {
      return !!this.event.input && Object.keys(this.event.input).length > 0;
    },
    inputText(): string {
      try {
        return JSON.stringify(this.event.input, null, 2);
      } catch {
        return String(this.event.input ?? '');
      }
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
