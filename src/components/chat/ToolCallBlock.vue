<template>
  <div class="tool-call-block" :class="{ 'is-error': toolCall.state === 'failed' }">
    <div class="tool-header" @click="collapsed = !collapsed">
      <span class="tool-icon">
        <el-icon v-if="toolCall.state === 'running'" class="is-loading"><Loading /></el-icon>
        <el-icon v-else-if="toolCall.state === 'completed'" color="#67c23a"><CircleCheck /></el-icon>
        <el-icon v-else color="#f56c6c"><CircleClose /></el-icon>
      </span>
      <span class="tool-name">{{ toolCall.displayName || toolCall.name }}</span>
      <span v-if="toolCall.durationMs" class="tool-duration"> {{ (toolCall.durationMs / 1000).toFixed(1) }}s </span>
      <el-icon class="collapse-icon" :class="{ 'is-collapsed': collapsed }">
        <ArrowDown />
      </el-icon>
    </div>

    <transition name="el-collapse-transition">
      <div v-show="!collapsed" class="tool-body">
        <!-- Input -->
        <div v-if="toolCall.input && Object.keys(toolCall.input).length" class="tool-section">
          <div class="tool-section-label">Input</div>
          <pre class="tool-code">{{ formatJson(toolCall.input) }}</pre>
        </div>

        <!-- Output -->
        <div v-if="toolCall.output !== undefined" class="tool-section">
          <div class="tool-section-label">{{ toolCall.state === 'failed' ? 'Error' : 'Output' }}</div>
          <pre class="tool-code" :class="{ 'is-error-text': toolCall.state === 'failed' }">{{
            formatOutput(toolCall.output)
          }}</pre>
        </div>

        <!-- Artifacts -->
        <div v-if="toolCall.artifacts?.length" class="tool-section">
          <div class="tool-section-label">Generated</div>
          <div class="tool-artifacts">
            <ArtifactBlock v-for="(artifact, idx) in toolCall.artifacts" :key="idx" :artifact="artifact" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue';
import { Loading, CircleCheck, CircleClose, ArrowDown } from '@element-plus/icons-vue';
import ArtifactBlock from './ArtifactBlock.vue';
import type { IChatToolCall } from '@/models';

export default defineComponent({
  name: 'ToolCallBlock',
  components: { Loading, CircleCheck, CircleClose, ArrowDown, ArtifactBlock },
  props: {
    toolCall: {
      type: Object as PropType<IChatToolCall>,
      required: true
    },
    defaultCollapsed: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const collapsed = ref(props.defaultCollapsed);

    const formatJson = (obj: unknown) => {
      try {
        return JSON.stringify(obj, null, 2);
      } catch {
        return String(obj);
      }
    };

    const formatOutput = (output: unknown) => {
      if (typeof output === 'string') return output;
      return formatJson(output);
    };

    return { collapsed, formatJson, formatOutput };
  }
});
</script>

<style scoped>
.tool-call-block {
  margin: 8px 0;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}
.tool-call-block.is-error {
  border-color: #f56c6c33;
  background: #fef0f0;
}
.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
}
.tool-header:hover {
  background: #f0f0f0;
}
.tool-name {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
}
.tool-duration {
  font-size: 12px;
  color: #999;
}
.collapse-icon {
  transition: transform 0.2s;
}
.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}
.tool-body {
  border-top: 1px solid #e4e7ed;
  padding: 10px 14px;
}
.tool-section {
  margin-bottom: 10px;
}
.tool-section:last-child {
  margin-bottom: 0;
}
.tool-section-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 4px;
  font-weight: 600;
}
.tool-code {
  font-size: 12px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
.tool-code.is-error-text {
  color: #f56c6c;
}
.tool-artifacts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
