<template>
  <div class="thinking-block" :class="{ active: !done }">
    <div class="thinking-header" @click="collapsed = !collapsed">
      <el-icon class="caret" :class="{ 'rotate-90': !collapsed }"><ArrowRight /></el-icon>
      <font-awesome-icon icon="fa-solid fa-brain" class="brain" :class="{ pulse: !done }" />
      <span class="thinking-label">{{ label }}</span>
    </div>
    <div v-show="!collapsed" class="thinking-content">
      <markdown-renderer :content="content" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import { ElIcon } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useI18n } from 'vue-i18n';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';

/**
 * Renders a model's chain-of-thought stream emitted by aichat2 as
 * `type:"thinking"` SSE events.
 *
 * UX:
 *  - While `done === false`: auto-expanded, brain icon pulses, header
 *    reads "Thinking…".
 *  - Once `done === true` and content is non-empty: auto-collapses to a
 *    one-line "Thought" header that the user can click to re-expand.
 *
 * The component is purely presentational — `Conversation.vue` owns the
 * `thinking` string accumulation across `type:"thinking"` SSE chunks and
 * passes it down via the `content` prop on every delta.
 */
export default defineComponent({
  name: 'ThinkingBlock',
  components: { ArrowRight, ElIcon, FontAwesomeIcon, MarkdownRenderer },
  props: {
    content: { type: String, required: true },
    /** True once the model has switched from thinking to answering. */
    done: { type: Boolean, default: false }
  },
  setup(props) {
    const { t } = useI18n();
    // Default expanded while the model is still thinking, then collapse
    // once we've moved on to the answer so the user sees the final reply
    // without having to scroll past a wall of reasoning.
    const collapsed = ref(false);
    watch(
      () => props.done,
      (isDone) => {
        if (isDone) collapsed.value = true;
      }
    );

    const label = computed(() => (props.done ? t('chat.thinking.done') : t('chat.thinking.inProgress')));

    return { collapsed, label };
  }
});
</script>

<style scoped>
.thinking-block {
  margin: 4px 0 10px;
  border-left: 3px solid var(--el-border-color, #e0e0e0);
  padding: 4px 0 4px 12px;
}
.thinking-block.active .thinking-header {
  color: var(--el-color-primary, #6366f1);
}
.thinking-header {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #888;
  font-size: 13px;
  user-select: none;
}
.thinking-header:hover {
  color: var(--el-color-primary, #6366f1);
}
.caret {
  transition: transform 0.15s ease;
  font-size: 12px;
}
.brain {
  font-size: 12px;
  opacity: 0.85;
}
.brain.pulse {
  animation: brain-pulse 1.4s ease-in-out infinite;
}
.thinking-content {
  margin-top: 6px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter, #fafafa);
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  white-space: normal;
  word-break: break-word;
  max-height: 320px;
  overflow-y: auto;
}
.thinking-content :deep(p) {
  margin: 0 0 4px;
}
.thinking-content :deep(p:last-child) {
  margin-bottom: 0;
}
.rotate-90 {
  transform: rotate(90deg);
}
@keyframes brain-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}
</style>
